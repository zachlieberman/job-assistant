interface Props {
  src: string
  alt: string
  className?: string
}

/** Rounded portrait photo; the fixed aspect ratio reserves space so nothing shifts on load. */
export default function Photo({ src, alt, className = '' }: Props) {
  return (
    <img
      src={src}
      alt={alt}
      width={768}
      height={1024}
      loading="lazy"
      decoding="async"
      className={`aspect-[4/5] w-full rounded-[2rem] bg-card object-cover ${className}`}
    />
  )
}
