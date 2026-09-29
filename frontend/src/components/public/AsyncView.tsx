import { ReactNode } from 'react'
import { Resource } from '../../hooks/useApiResource'
import ErrorState from './ErrorState'

interface Props<T> {
  resource: Resource<T>
  onRetry: () => void
  /** Skeleton that matches the loaded layout's dimensions. */
  fallback: ReactNode
  what: string
  errorClassName?: string
  children: (data: T) => ReactNode
}

/** Renders skeleton, error-with-retry, or content for a loaded resource. */
export default function AsyncView<T>({
  resource,
  onRetry,
  fallback,
  what,
  errorClassName,
  children,
}: Props<T>) {
  if (resource.status === 'loading') return <>{fallback}</>
  if (resource.status === 'error') {
    return <ErrorState what={what} onRetry={onRetry} className={errorClassName} />
  }
  return <>{children(resource.data)}</>
}
