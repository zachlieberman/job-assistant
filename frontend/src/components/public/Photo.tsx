interface Props {
  src: string
  alt: string
  className?: string
  /** Above-the-fold (LCP) image: load immediately at high priority instead of lazily. */
  eager?: boolean
}

/** Rounded portrait photo; the fixed aspect ratio reserves space so nothing shifts on load. */
export default function Photo({ src, alt, className = '', eager = false }: Props) {
  // React 18 only forwards the lowercase `fetchpriority` attribute without a
  // warning (camelCase `fetchPriority` is React 19). Spread it so TS accepts it.
  const priority = eager ? { fetchpriority: 'high' } : {}
  return (
    <img
      src={src}
      alt={alt}
      width={768}
      height={1024}
      loading={eager ? 'eager' : 'lazy'}
      {...priority}
      decoding="async"
      className={`aspect-[4/5] w-full rounded-[2rem] bg-card object-cover ${className}`}
    />
  )
}
