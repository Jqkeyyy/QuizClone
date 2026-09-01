import { useMemo, useState } from 'react'
import { parsePaste } from '../../lib/parse/bulkImport'

const TERM_SEPARATORS = [
  { label: 'Tab', value: '\t' },
  { label: 'Comma', value: ',' },
] as const

const ROW_SEPARATORS = [
  { label: 'New line', value: '\n' },
  { label: 'Semicolon', value: ';' },
] as const

export interface BulkImportPanelProps {
  onImport: (pairs: Array<{ term: string; definition: string }>) => void
}

export function BulkImportPanel({ onImport }: BulkImportPanelProps) {
  const [text, setText] = useState('')
  const [termSep, setTermSep] = useState<string>('\t')
  const [rowSep, setRowSep] = useState<string>('\n')
  const [customTermSep, setCustomTermSep] = useState('')
  const [customRowSep, setCustomRowSep] = useState('')

  const effectiveTermSep = termSep === 'custom' ? customTermSep : termSep
  const effectiveRowSep = rowSep === 'custom' ? customRowSep : rowSep

  const result = useMemo(
    () => parsePaste(text, effectiveTermSep || '\t', effectiveRowSep || '\n'),
    [text, effectiveTermSep, effectiveRowSep],
  )

  return (
    <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste term and definition pairs here…"
        rows={8}
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
      />

      <div className="flex flex-wrap gap-4 text-sm text-neutral-600">
        <label className="flex items-center gap-2">
          Between term and definition:
          <select
            value={termSep}
            onChange={(e) => setTermSep(e.target.value)}
            className="rounded-md border border-neutral-300 px-2 py-1"
          >
            {TERM_SEPARATORS.map((s) => (
              <option key={s.label} value={s.value}>
                {s.label}
              </option>
            ))}
            <option value="custom">Custom</option>
          </select>
          {termSep === 'custom' && (
            <input
              value={customTermSep}
              onChange={(e) => setCustomTermSep(e.target.value)}
              className="w-16 rounded-md border border-neutral-300 px-2 py-1"
            />
          )}
        </label>

        <label className="flex items-center gap-2">
          Between rows:
          <select
            value={rowSep}
            onChange={(e) => setRowSep(e.target.value)}
            className="rounded-md border border-neutral-300 px-2 py-1"
          >
            {ROW_SEPARATORS.map((s) => (
              <option key={s.label} value={s.value}>
                {s.label}
              </option>
            ))}
            <option value="custom">Custom</option>
          </select>
          {rowSep === 'custom' && (
            <input
              value={customRowSep}
              onChange={(e) => setCustomRowSep(e.target.value)}
              className="w-16 rounded-md border border-neutral-300 px-2 py-1"
            />
          )}
        </label>
      </div>

      <p className="text-sm text-neutral-600">
        Parsed {result.validCount} cards
        {result.invalidCount > 0 ? ` · ${result.invalidCount} rows need attention` : ''}
      </p>

      <div className="max-h-64 overflow-y-auto rounded-md border border-neutral-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-2 py-1">#</th>
              <th className="px-2 py-1">Term</th>
              <th className="px-2 py-1">Definition</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row, i) => (
              <tr key={i} className={row.valid ? '' : 'bg-red-50'}>
                <td className="px-2 py-1 text-neutral-400">{i + 1}</td>
                <td className="px-2 py-1">
                  {row.term}
                  {row.duplicate && <span className="ml-1 text-amber-600">(dup)</span>}
                </td>
                <td className="px-2 py-1">{row.definition}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        disabled={result.validCount === 0}
        onClick={() =>
          onImport(result.rows.filter((r) => r.valid).map((r) => ({ term: r.term, definition: r.definition })))
        }
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        Import {result.validCount} cards
      </button>
    </div>
  )
}
