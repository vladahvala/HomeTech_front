import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link } from 'react-router';
import { adminImportService } from '../../api';
import { getErrorMessage } from '../../api/ApiError';
import AccountLayout from '../../components/AccountLayout';
import ListState from '../../components/ListState';
import Notice from '../../components/Notice';
import { useAsync } from '../../hooks/useAsync';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import type { ImportReport } from '../../types';
import { formatDateTime } from '../../utils/dates';
import { validatePriceFile } from '../../validation/rules';

/** Імпорт прайсу Katran зі звітом і описом формату (UC-IMP-01, DOC-03) */
export default function AdminImportPage() {
  useDocumentTitle('Імпорт прайсу');
  const last = useAsync(() => adminImportService.getLastReport(), []);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);
  const shown = report ?? last.data ?? null;

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    setError(selected ? (validatePriceFile(selected) ?? '') : '');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setError('Оберіть файл прайсу.');
      return;
    }
    const fileError = validatePriceFile(file);
    if (fileError) {
      setError(fileError);
      return;
    }
    setError('');
    setIsRunning(true);
    try {
      setReport(await adminImportService.importPrice(file));
    } catch (failure) {
      // формат файлу, імпорт уже йде (REL-04) або збій — каталог лишився як був (REL-01)
      setError(`${getErrorMessage(failure)} Каталог не змінено.`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <AccountLayout title="Імпорт прайсу Katran">
      <form className="admin-panel admin-import__form" onSubmit={handleSubmit} noValidate aria-busy={isRunning}>
        <label className="form-field__label" htmlFor="price-file">
          Файл прайсу
        </label>
        <input
          id="price-file"
          type="file"
          className={`form-field__input admin-import__file${error ? ' form-field__input--invalid' : ''}`}
          accept=".csv,.zip,text/csv,application/zip"
          disabled={isRunning}
          aria-describedby="price-file-hint"
          onChange={handleFile}
        />
        <p id="price-file-hint" className="form-field__hint">
          CSV або ZIP-архів з одним CSV, до 20 МБ
        </p>
        {error && (
          <p className="form-field__error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="cart-button admin-import__submit" disabled={isRunning}>
          {isRunning ? 'Імпортуємо…' : 'Імпортувати'}
        </button>
        {isRunning && (
          <p className="admin-panel__text" role="status">
            Імпорт повного прайсу може тривати до 2 хвилин. Не закривайте сторінку.
          </p>
        )}
      </form>

      {last.error ? (
        <ListState kind="error" error={last.error} onRetry={last.reload} />
      ) : shown ? (
        <ImportReportView report={shown} isFresh={report !== null} />
      ) : last.isLoading ? null : (
        <p className="admin-panel__text admin-import__none">Імпорту ще не було.</p>
      )}

      <FormatHelp />
    </AccountLayout>
  );
}

function ImportReportView({ report, isFresh }: { report: ImportReport; isFresh: boolean }) {
  const items: [string, number, string?][] = [
    ['Додано', report.added, 'нові товари — приховані'],
    ['Оновлено', report.updated],
    ['Пропущено', report.skipped, 'уцінені, вживані, видалені, без категорії'],
    ['Рядків з помилками', report.errors],
    ['Переведено в «Немає»', report.outOfStock, 'немає у файлі'],
  ];

  return (
    <section className="admin-import__report" aria-live="polite">
      {isFresh && <Notice kind="success">Імпорт завершено. Каталог оновлено.</Notice>}
      <h3 className="admin-template__title">{isFresh ? 'Звіт імпорту' : 'Останній імпорт'}</h3>
      <p className="admin-panel__text">
        Файл «{report.fileName}», {formatDateTime(report.finishedAt)}
      </p>
      <dl className="import-stats">
        {items.map(([label, value, note]) => (
          <div key={label} className={`import-stats__item${label.startsWith('Рядків') && value > 0 ? ' import-stats__item--warning' : ''}`}>
            <dt className="import-stats__label">{label}</dt>
            <dd className="import-stats__value">{value}</dd>
            {note && <dd className="import-stats__note">{note}</dd>}
          </div>
        ))}
      </dl>
      {report.added > 0 && (
        <p className="admin-panel__text">
          <Link to="/admin/products?published=false&source=katran">Переглянути приховані товари з прайсу</Link> —
          заповніть характеристики й опис та опублікуйте.
        </p>
      )}
      {report.errorRows.length > 0 && (
        <>
          <h4 className="admin-import__subtitle">Рядки з помилками</h4>
          <table className="orders-table admin-import__errors">
            <thead>
              <tr>
                <th scope="col">Рядок</th>
                <th scope="col">Що не так</th>
              </tr>
            </thead>
            <tbody>
              {report.errorRows.map((item) => (
                <tr key={`${item.row}-${item.message}`}>
                  <td data-label="Рядок">{item.row}</td>
                  <td data-label="Що не так">{item.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {report.errors > report.errorRows.length && (
            <p className="form-field__hint">Показано перші {report.errorRows.length} з {report.errors}.</p>
          )}
        </>
      )}
    </section>
  );
}

/** Опис формату прайсу й правил імпорту (DOC-03) */
function FormatHelp() {
  return (
    <details className="admin-import__help">
      <summary className="admin-import__help-title">Формат прайсу й правила імпорту</summary>
      <div className="admin-import__help-body">
        <h4 className="admin-import__subtitle">Формат файлу</h4>
        <ul>
          <li>CSV-файл або ZIP-архів з одним CSV-файлом, до 20 МБ.</li>
          <li>Кодування Windows-1251, роздільник колонок «;», десятковий роздільник — кома.</li>
          <li>
            Перший рядок — назви колонок: Код, Артикул, Найменування, РРЦ, Роздріб, Вхід (закупівельна ціна),
            Наявність, Гарантія (місяців), Фото (посилання), Виробник.
          </li>
          <li>Ціна 7,00 означає «ціни немає».</li>
        </ul>
        <h4 className="admin-import__subtitle">Що робить імпорт</h4>
        <ul>
          <li>
            <strong>Наявний код</strong> — оновлює ціну, закупівельну ціну, наявність, гарантію й фото з прайсу. Назву,
            категорію, характеристики, опис і власне фото не змінює.
          </li>
          <li>
            <strong>Новий код</strong> — створює <strong>прихований</strong> товар у категорії, шаблон імпорту якої
            збігається з початком назви. Якщо такої категорії немає — товар пропускається.
          </li>
          <li>
            <strong>Ціна</strong> — РРЦ, якщо вона більша за 0 і не 7,00; інакше роздрібна за тією самою умовою.
          </li>
          <li>
            Товари з кодом постачальника, яких немає у файлі, отримують статус <strong>«Немає»</strong>.
          </li>
          <li>Уцінені й вживані товари, а також товари, видалені в адмінці, пропускаються.</li>
          <li>Імпорт виконується повністю або не виконується зовсім; одночасно — лише один імпорт.</li>
        </ul>
        <p className="admin-panel__text">
          <a href="/katran-sample.csv" download>
            Завантажити приклад прайсу
          </a>{' '}
          — щоб перевірити імпорт на демо-даних.
        </p>
      </div>
    </details>
  );
}
