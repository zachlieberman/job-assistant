import { useCallback, useState } from 'react'
import { importApplicationsCsv } from '../api/client'

export interface ImportMessage {
  text: string
  ok: boolean
}

function summarize(imported: number, skipped: number, errorCount: number): string {
  const parts = [`Imported ${imported} application${imported !== 1 ? 's' : ''}`]
  if (skipped) parts.push(`skipped ${skipped}`)
  if (errorCount) parts.push(`${errorCount} error${errorCount !== 1 ? 's' : ''}`)
  return parts.join(', ') + '.'
}

/** Uploads a CSV, reports the outcome, then calls `onDone` so the list can refresh. */
export function useCsvImport(onDone: () => void | Promise<void>) {
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState<ImportMessage | null>(null)

  const run = useCallback(
    async (file: File) => {
      setImporting(true)
      setMessage(null)
      try {
        const res = await importApplicationsCsv(file)
        const { imported, skipped, errors } = res.data
        setMessage({ text: summarize(imported, skipped, errors.length), ok: true })
      } catch (err: unknown) {
        const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        setMessage({
          text: detail ?? 'Import failed. Check that the file is a CSV with the exported column headers, then try again.',
          ok: false,
        })
        return
      } finally {
        setImporting(false)
      }
      await onDone()
    },
    [onDone],
  )

  return { importing, message, run }
}
