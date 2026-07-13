// apps/web/components/ticket-system/ImportModal.tsx
'use client';

import { useRef, useState } from 'react';
import { FileCheck2, FileCode, FileJson, FileSpreadsheet, FileUp, Upload } from 'lucide-react';
import type { ImportSummary } from '@repo/contracts';
import { Modal } from './ds/Modal';
import { Button } from './ds/Button';
import { Banner } from './ds/Banner';
import { ApiError, type ApiClient } from '../../lib/ticket-system/api';

function FormatRow({ icon, name, ext }: { icon: React.ReactNode; name: string; ext: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }}>
      {icon}
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{name}</span>
      <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{ext}</span>
    </div>
  );
}

function extFor(name: string): string {
  const m = /\.([a-z0-9]+)$/i.exec(name || '');
  return m ? m[1].toLowerCase() : '';
}

export interface ImportModalProps {
  open: boolean;
  api: ApiClient;
  onClose: () => void;
  onImported: (result: ImportSummary) => void;
}

const ACCEPTED = ['csv', 'json', 'xml'];

export function ImportModal({ open, api, onClose, onImported }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset the form fields whenever the modal transitions to open, computed
  // during render (per https://react.dev/learn/you-might-not-need-an-effect)
  // instead of a useEffect, so no extra state-setting effect is needed.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setFile(null);
      setError(null);
      setImporting(false);
    }
  }

  const acceptFile = (f: File | null | undefined) => {
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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    acceptFile(e.dataTransfer.files?.[0]);
  };

  const startImport = async () => {
    if (!file) return;
    setImporting(true);
    setError(null);
    try {
      const result = await api.importTickets(file);
      onImported(result);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Import failed.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={520}
      title="Import tickets"
      description="Bring in tickets from another tool as CSV, JSON, or XML. Triage auto-detects the format, then categorizes and prioritizes each ticket on ingest."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={importing}>
            Cancel
          </Button>
          <Button onClick={startImport} disabled={!file || importing} iconLeft={<Upload size={15} />}>
            {importing ? 'Importing…' : 'Start import'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <input ref={inputRef} type="file" accept=".csv,.json,.xml" style={{ display: 'none' }} onChange={(e) => acceptFile(e.target.files?.[0])} />
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `1.5px dashed ${dragOver ? 'var(--border-focus)' : 'var(--border-strong)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: '26px',
            textAlign: 'center',
            background: dragOver ? 'var(--surface-selected)' : 'var(--surface-sunken)',
            cursor: 'pointer',
          }}
        >
          {file ? (
            <>
              <FileCheck2 size={28} color="var(--success)" />
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', marginTop: '8px' }}>{file.name}</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginTop: '2px' }}>{(file.size / 1024).toFixed(1)} KB — click to choose a different file</div>
            </>
          ) : (
            <>
              <FileUp size={28} color="var(--brand-500)" />
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', marginTop: '8px' }}>Drag a file here, or browse</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginTop: '2px' }}>.csv, .json, or .xml — up to 50 MB</div>
            </>
          )}
        </div>

        {error && <Banner tone="danger" title="Import failed">{error}</Banner>}

        <div>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>Supported formats</div>
          <FormatRow icon={<FileSpreadsheet size={16} color="var(--text-tertiary)" />} name="Comma-separated values" ext=".csv" />
          <FormatRow icon={<FileJson size={16} color="var(--text-tertiary)" />} name="JSON export" ext=".json" />
          <FormatRow icon={<FileCode size={16} color="var(--text-tertiary)" />} name="XML export" ext=".xml" />
        </div>

        <Banner tone="info" title="Auto-classification is on">
          Imported tickets are categorized and assigned a priority automatically. You can review and override before they enter your queues.
        </Banner>
      </div>
    </Modal>
  );
}
