import { Skeleton, SkeletonRegion } from './Skeleton'

/** Mirrors Hero: sized in em inside a display-xl box so line heights match. */
export function HeroSkeleton() {
  return (
    <SkeletonRegion label="Loading introduction">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="mt-8 h-7 w-72 max-w-full" />
      <div aria-hidden="true" className="display-xl mt-4">
        <Skeleton className="mb-[0.17em] h-[0.78em] w-[62%]" />
        <Skeleton className="mb-[0.17em] h-[0.78em] w-[90%]" />
        <Skeleton className="h-[0.78em] w-[48%]" />
      </div>
      <div className="mt-10 lg:grid lg:grid-cols-12 lg:gap-8">
        <Skeleton className="h-12 w-48 rounded-full lg:col-span-5" />
        <div className="mt-8 space-y-3 lg:col-span-5 lg:col-start-8 lg:mt-0">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-11/12" />
          <Skeleton className="h-5 w-4/5" />
        </div>
      </div>
    </SkeletonRegion>
  )
}

export function CardsSkeleton({ count = 3, featured = false }: { count?: number; featured?: boolean }) {
  return (
    <SkeletonRegion label="Loading projects">
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        {Array.from({ length: count }, (_, i) => (
          <Skeleton
            key={i}
            className={`rounded-[2rem] ${
              featured && i === 0 ? 'h-72 md:col-span-2 md:h-96' : 'h-64'
            }`}
          />
        ))}
      </div>
    </SkeletonRegion>
  )
}

export function TimelineSkeleton() {
  return (
    <SkeletonRegion label="Loading experience">
      <div className="space-y-14">
        {[0, 1, 2].map((i) => (
          <div key={i} className="pl-12 sm:pl-16">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-4 h-10 w-3/4 max-w-md" />
            <Skeleton className="mt-4 h-5 w-full max-w-prose" />
            <Skeleton className="mt-2 h-5 w-5/6 max-w-prose" />
          </div>
        ))}
      </div>
    </SkeletonRegion>
  )
}

export function ContactSkeleton() {
  return (
    <SkeletonRegion label="Loading contact details">
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-20 rounded-3xl" />
        ))}
      </div>
    </SkeletonRegion>
  )
}
