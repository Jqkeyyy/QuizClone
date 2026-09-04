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
  importing: boolean
  onImport: (pairs: Array<{ term: string; definition: string }>) => Promise<void>
}

export function BulkImportPanel({ importing, onImport }: BulkImportPanelProps) {
  const [text, setText] = useState('')
  const [termSeparator, setTermSeparator] = useState<string>('\t')
  const [rowSeparator, setRowSeparator] = useState<string>('\n')
  const [customTermSeparator, setCustomTermSeparator] = useState('')
  const [customRowSeparator, setCustomRowSeparator] = useState('')

  const effectiveTermSeparator = termSeparator === 'custom' ? customTermSeparator : termSeparator
  const effectiveRowSeparator = rowSeparator === 'custom' ? customRowSeparator : rowSeparator
  const result = useMemo(
    () => parsePaste(text, effectiveTermSeparator || '\t', effectiveRowSeparator || '\n'),
    [text, effectiveTermSeparator, effectiveRowSeparator],
  )

  async function handleImport() {
    const pairs = result.rows
      .filter((row) => row.valid)
      .map(({ term, definition }) => ({ term, definition }))
    if (pairs.length === 0) return
    try {
      await onImport(pairs)
      setText('')
    } catch {
      // The parent mutation owns the visible error state. Keep the pasted
      // content in place so the user can retry without reconstructing it.
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== 'Tab') return
          event.preventDefault()
          const target = event.currentTarget
          const start = target.selectionStart
          const end = target.selectionEnd
          setText(text.slice(0, start) + '\t' + text.slice(end))
          requestAnimationFrame(() => {
            target.selectionStart = target.selectionEnd = start + 1
          })
        }}
        placeholder="Paste term and definition pairs here…"
        rows={8}
        className="w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-sm outline-none focus:border-neutral-500"
      />

      <div className="flex flex-wrap gap-4 text-sm text-neutral-600">
        <label className="flex items-center gap-2">
          Between term and definition:
          <select
            value={termSeparator}
            onChange={(event) => setTermSeparator(event.target.value)}
            className="rounded-md border border-neutral-300 px-2 py-1"
          >
            {TERM_SEPARATORS.map((separator) => (
              <option key={separator.label} value={separator.value}>{separator.label}</option>
            ))}
            <option value="custom">Custom</option>
          </select>
          {termSeparator === 'custom' && (
            <input
              value={customTermSeparator}
              onChange={(event) => setCustomTermSeparator(event.target.value)}
              aria-label="Custom term separator"
              className="w-16 rounded-md border border-neutral-300 px-2 py-1"
            />
          )}
        </label>

        <label className="flex items-center gap-2">
          Between rows:
          <select
            value={rowSeparator}
            onChange={(event) => setRowSeparator(event.target.value)}
            className="rounded-md border border-neutral-300 px-2 py-1"
          >
            {ROW_SEPARATORS.map((separator) => (
              <option key={separator.label} value={separator.value}>{separator.label}</option>
            ))}
            <option value="custom">Custom</option>
          </select>
          {rowSeparator === 'custom' && (
            <input
              value={customRowSeparator}
              onChange={(event) => setCustomRowSeparator(event.target.value)}
              aria-label="Custom row separator"
              className="w-16 rounded-md border border-neutral-300 px-2 py-1"
            />
          )}
        </label>
      </div>

      {text.trim() && (
        <>
          <p className="text-sm text-neutral-600">
            Parsed {result.validCount} cards
            {result.invalidCount > 0 ? ` · ${result.invalidCount} rows need attention` : ''}
          </p>
          <div className="max-h-64 overflow-y-auto rounded-md border border-neutral-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-500">
                <tr><th className="px-2 py-1">#</th><th className="px-2 py-1">Term</th><th className="px-2 py-1">Definition</th><th className="px-2 py-1"><span className="sr-only">Status</span></th></tr>
              </thead>
              <tbody>
                {result.rows.map((row, index) => (
                  <tr key={`${index}-${row.raw}`} className={row.valid ? '' : 'bg-red-50'}>
                    <td className="px-2 py-1 text-neutral-400">{index + 1}</td>
                    <td className="px-2 py-1">{row.term}{row.duplicate && <span className="ml-1 text-amber-600">(duplicate)</span>}</td>
                    <td className="px-2 py-1">{row.definition}</td>
                    <td className="px-2 py-1 text-red-500">{row.valid ? '' : '⚠'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <button
        type="button"
        disabled={importing || result.validCount === 0}
        onClick={() => void handleImport()}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {importing ? 'Importing…' : `Import ${result.validCount} cards`}
      </button>
    </div>
  )
}
