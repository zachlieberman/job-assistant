import { useParams } from 'react-router-dom'
import AiActionsPanel from '../components/detail/AiActionsPanel'
import DetailHeader from '../components/detail/DetailHeader'
import DocSection, { CopyButton } from '../components/detail/DocSection'
import StatusBar from '../components/detail/StatusBar'
import Toast from '../components/Toast'
import ErrorPanel from '../components/ui/ErrorPanel'
import { buttonPrimary } from '../components/ui/formStyles'
import { LoadingRegion, Skeleton } from '../components/ui/Skeleton'
import { useApplicationDetail } from '../hooks/useApplicationDetail'

function DetailSkeleton() {
  return (
    <LoadingRegion label="Loading application…">
      <div className="flex flex-col gap-5">
        <Skeleton className="h-[110px] rounded-panel" />
        <Skeleton className="h-[90px] rounded-panel" />
        <Skeleton className="h-[140px] rounded-panel" />
        <Skeleton className="h-[220px] rounded-panel" />
      </div>
    </LoadingRegion>
  )
}

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>()
  const d = useApplicationDetail(id)

  if (d.error && !d.app) {
    return (
      <ErrorPanel
        title={d.error}
        detail="This application may have been deleted, or the API isn't reachable. Try again, or go back to the dashboard."
        onRetry={d.load}
      />
    )
  }
  if (!d.app) return <DetailSkeleton />

  return (
    <div className="flex flex-col gap-5">
      <DetailHeader app={d.app} deleting={d.busy === 'delete'} onDelete={d.remove} />
      <StatusBar edits={d.edits} onChange={d.patchEdits} />
      <AiActionsPanel
        resumes={d.resumes}
        selectedResumeId={d.selectedResumeId}
        onSelectResume={d.setSelectedResumeId}
        tone={d.tone}
        onTone={d.setTone}
        tailoring={d.busy === 'tailor'}
        writing={d.busy === 'cover'}
        onTailor={d.tailor}
        onWriteCoverLetter={d.writeCoverLetter}
        result={d.tailorResult}
      />
      <DocSection label="Job description" value={d.edits.job_description} onChange={(v) => d.patchEdits({ job_description: v })} defaultRows={10} />
      <DocSection label="Tailored resume" value={d.edits.tailored_resume} onChange={(v) => d.patchEdits({ tailored_resume: v })} defaultRows={20} mono actions={<CopyButton text={d.edits.tailored_resume} />} />
      <DocSection label="Cover letter" value={d.edits.cover_letter} onChange={(v) => d.patchEdits({ cover_letter: v })} defaultRows={10} actions={<CopyButton text={d.edits.cover_letter} />} />
      <DocSection label="Notes" value={d.edits.notes} onChange={(v) => d.patchEdits({ notes: v })} defaultRows={4} />

      {d.error && (
        <ErrorPanel title={d.error} detail="Your edits are still on this page. Check your connection and try again." />
      )}

      <div className="flex justify-end border-t border-line pt-5">
        <button type="button" onClick={d.save} disabled={d.busy === 'save'} className={buttonPrimary}>
          {d.busy === 'save' ? 'Saving…' : 'Save changes'}
        </button>
      </div>
      <Toast message={d.toast.message} type={d.toast.type} visible={d.toast.visible} />
    </div>
  )
}
