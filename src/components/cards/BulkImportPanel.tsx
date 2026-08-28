// src/components/cards/BulkImportPanel.tsx
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

export function BulkImportPanel({
  importing,
  onImport,
}: {
  importing: boolean
  onImport: (rows: { term: string; definition: string }[]) => void
}) {
  const [text, setText] = useState('')
  const [termSep, setTermSep] = useState<string>('\t')
  const [termCustom, setTermCustom] = useState('')
  const [rowSep, setRowSep] = useState<string>('\n')
  const [rowCustom, setRowCustom] = useState('')

  const effectiveTermSep = termSep === 'custom' ? termCustom : termSep
  const effectiveRowSep = rowSep === 'custom' ? rowCustom : rowSep

  const result = useMemo(
    () => parsePaste(text, effectiveTermSep || '\t', effectiveRowSep || '\n'),
    [text, effectiveTermSep, effectiveRowSep],
  )

  function handleImport() {
    const validRows = result.rows.filter((r) => r.valid).map((r) => ({ term: r.term, definition: r.definition }))
    if (validRows.length === 0) return
    onImport(validRows)
    setText('')
  }

  return (
    <div className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste term-definition pairs here"
        rows={6}
        className="w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-sm outline-none focus:border-neutral-500"
      />

      <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600">
        <label className="flex items-center gap-1">
          Between term and definition:
          <select
            value={termSep}
            onChange={(e) => setTermSep(e.target.value)}
            className="rounded border border-neutral-300 px-1 py-0.5"
          >
            {TERM_SEPARATORS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
            <option value="custom">Custom</option>
          </select>
        </label>
        {termSep === 'custom' && (
          <input
            value={termCustom}
            onChange={(e) => setTermCustom(e.target.value)}
            placeholder="separator"
            className="w-20 rounded border border-neutral-300 px-1 py-0.5"
          />
        )}

        <label className="flex items-center gap-1">
          Between rows:
          <select
            value={rowSep}
            onChange={(e) => setRowSep(e.target.value)}
            className="rounded border border-neutral-300 px-1 py-0.5"
          >
            {ROW_SEPARATORS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
            <option value="custom">Custom</option>
          </select>
        </label>
        {rowSep === 'custom' && (
          <input
            value={rowCustom}
            onChange={(e) => setRowCustom(e.target.value)}
            placeholder="separator"
            className="w-20 rounded border border-neutral-300 px-1 py-0.5"
          />
        )}
      </div>

      {text.trim() !== '' && (
        <>
          <p className="text-sm text-neutral-500">
            Parsed {result.validCount} cards
            {result.invalidCount > 0 && ` · ${result.invalidCount} rows need attention`}
            {result.duplicateTerms.length > 0 && ` · ${result.duplicateTerms.length} duplicate terms`}
          </p>
          <div className="max-h-64 overflow-y-auto rounded-md border border-neutral-200">
            <table className="w-full text-sm">
              <tbody>
                {result.rows.map((row, i) => (
                  <tr key={i} className={row.valid ? '' : 'bg-red-50'}>
                    <td className="w-8 px-2 py-1 text-neutral-400">{i + 1}</td>
                    <td className="px-2 py-1">{row.term}</td>
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
        onClick={handleImport}
        disabled={importing || result.validCount === 0}
        className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {importing ? 'Importing…' : `Import ${result.validCount} cards`}
      </button>
    </div>
  )
}
