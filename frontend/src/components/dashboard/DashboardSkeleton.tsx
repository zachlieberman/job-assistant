import { LoadingRegion, Skeleton } from '../ui/Skeleton'

/** Same block sizes as the loaded dashboard so nothing shifts when data arrives. */
export default function DashboardSkeleton() {
  return (
    <LoadingRegion label="Loading applications…">
      <div className="flex flex-col gap-5">
        <Skeleton className="h-[92px] rounded-strip md:h-[84px]" />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Skeleton className="h-[330px] rounded-panel" />
          <Skeleton className="h-[330px] rounded-panel" />
        </div>
        <Skeleton className="h-[360px] rounded-panel" />
        <Skeleton className="h-[320px] rounded-panel" />
      </div>
    </LoadingRegion>
  )
}
