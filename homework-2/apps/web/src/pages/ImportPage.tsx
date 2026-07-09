import { useRef, useState, type DragEvent } from 'react';
import type { ImportSummary } from '@repo/contracts';
import { ticketsApi } from '../api/client';

export function ImportPage() {
  const [autoClassify, setAutoClassify] = useState(true);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setSummary(null);
    try {
      setSummary(await ticketsApi.importFile(file, autoClassify));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setBusy(false);
    }
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files[0];
    if (file) void upload(file);
  };

  return (
    <div className="import-page">
      <div className="card">
        <h2>Import tickets</h2>
        <p className="muted">Upload a .csv, .json, or .xml file with ticket records.</p>

        <div
          className={`dropzone${dragOver ? ' drag-over' : ''}`}
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') inputRef.current?.click();
            if (e.key === ' ') {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {busy ? 'Uploading…' : 'Drag & drop a file here, or click to choose'}
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.json,.xml"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
              e.target.value = '';
            }}
          />
        </div>

        <label className="checkbox">
          <input
            type="checkbox"
            checked={autoClassify}
            onChange={(e) => setAutoClassify(e.target.checked)}
          />
          Auto-classify imported tickets
        </label>
      </div>

      {error && <div className="alert">{error}</div>}

      {summary && (
        <div className="card">
          <h2>Import summary</h2>
          <div className="summary-cards">
            <div className="summary-card">
              <strong>{summary.total}</strong>
              <span>Total</span>
            </div>
            <div className="summary-card ok">
              <strong>{summary.successful}</strong>
              <span>Successful</span>
            </div>
            <div className="summary-card fail">
              <strong>{summary.failed}</strong>
              <span>Failed</span>
            </div>
          </div>

          {summary.errors.length > 0 && (
            <table className="error-table">
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Field</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {summary.errors.map((e) => (
                  <tr key={`${e.row}-${e.field ?? 'row'}`}>
                    <td>{e.row}</td>
                    <td>{e.field ?? '—'}</td>
                    <td>{e.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
