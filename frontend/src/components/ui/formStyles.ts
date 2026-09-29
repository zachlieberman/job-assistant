export const inputClass =
  'w-full rounded-control border border-field bg-ink px-3 py-2.5 text-base text-fg placeholder:text-muted transition-colors duration-150 hover:border-muted focus-visible:border-brand-text md:text-sm aria-[invalid=true]:border-brand-text aria-[invalid=true]:bg-raised'

export const labelClass = 'text-sm font-medium text-fg'

const buttonBase =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-control px-4 text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 md:min-h-[36px]'

export const buttonPrimary = `${buttonBase} bg-brand text-white hover:bg-brand-hover`
export const buttonSecondary = `${buttonBase} border border-field bg-transparent text-fg hover:bg-raised hover:border-muted`
export const buttonGhost = `${buttonBase} text-muted hover:bg-raised hover:text-fg`
