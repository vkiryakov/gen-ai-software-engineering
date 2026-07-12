// Triage agent app — bulk import modal (CSV / JSON / XML), posts the whole
// file to POST /tickets/import (multipart) — or the mock's equivalent parser.
(function () {
const { Modal, Button, Banner } = window.TriageDesignSystem_a9a780;

function FormatRow({ icon, name, ext }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }}>
      <i data-lucide={icon} style={{ width: 16, height: 16, color: 'var(--text-tertiary)' }} />
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{name}</span>
      <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{ext}</span>
    </div>
  );
}

function extFor(name) {
  const m = /\.([a-z0-9]+)$/i.exec(name || '');
  return m ? m[1].toLowerCase() : '';
}

function ImportModal({ open, onClose, onImported }) {
  const [file, setFile] = React.useState(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [importing, setImporting] = React.useState(false);
  const inputRef = React.useRef(null);
  const ACCEPTED = ['csv', 'json', 'xml'];

  React.useEffect(() => { if (open) { setFile(null); setError(null); setImporting(false); } }, [open]);

  const acceptFile = (f) => {
    if (!f) return;
    const ext = extFor(f.name);
    if (!ACCEPTED.includes(ext)) {
      setError(`Unsupported file type ".${ext || '?'}" — use .csv, .json or .xml.`);
      setFile(null);
      return;
    }
    setError(null);
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    acceptFile(e.dataTransfer.files && e.dataTransfer.files[0]);
  };

  const startImport = async () => {
    if (!file) return;
    setImporting(true);
    setError(null);
    try {
      const result = await window.TriageAPI.importTickets(file);
      onImported(result);
    } catch (e) {
      setError(e.message || 'Import failed.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} width={520} title="Import tickets"
      description="Bring in tickets from another tool as CSV, JSON, or XML. Triage auto-detects the format, then categorizes and prioritizes each ticket on ingest."
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={importing}>Cancel</Button>
        <Button onClick={startImport} disabled={!file || importing} iconLeft={<i data-lucide="upload" style={{ width: 15, height: 15 }} />}>
          {importing ? 'Importing…' : 'Start import'}
        </Button>
      </>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <input ref={inputRef} type="file" accept=".csv,.json,.xml" style={{ display: 'none' }}
          onChange={(e) => acceptFile(e.target.files && e.target.files[0])} />
        {/* Dropzone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current && inputRef.current.click()}
          style={{
            border: `1.5px dashed ${dragOver ? 'var(--border-focus)' : 'var(--border-strong)'}`, borderRadius: 'var(--radius-lg)',
            padding: '26px', textAlign: 'center', background: dragOver ? 'var(--surface-selected)' : 'var(--surface-sunken)',
            cursor: 'pointer',
          }}>
          {file ? (
            <React.Fragment>
              <i data-lucide="file-check-2" style={{ width: 28, height: 28, color: 'var(--success)' }} />
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', marginTop: '8px' }}>{file.name}</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginTop: '2px' }}>{(file.size / 1024).toFixed(1)} KB — click to choose a different file</div>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <i data-lucide="file-up" style={{ width: 28, height: 28, color: 'var(--brand-500)' }} />
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', marginTop: '8px' }}>Drag a file here, or browse</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginTop: '2px' }}>.csv, .json, or .xml — up to 50 MB</div>
            </React.Fragment>
          )}
        </div>

        {error && <Banner tone="danger" title="Import failed">{error}</Banner>}

        <div>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>Supported formats</div>
          <FormatRow icon="file-spreadsheet" name="Comma-separated values" ext=".csv" />
          <FormatRow icon="file-json" name="JSON export" ext=".json" />
          <FormatRow icon="file-code" name="XML export" ext=".xml" />
        </div>

        <Banner tone="info" title="Auto-classification is on">
          Imported tickets are categorized and assigned a priority automatically. You can review and override before they enter your queues.
        </Banner>
      </div>
    </Modal>
  );
}
window.ImportModal = ImportModal;
})();
