import { useState } from 'react'

interface ProductImageProps {
  src: string | null | undefined
  alt?: string
  className?: string
}

export function ProductImage({ src, alt = '', className }: ProductImageProps) {
  const [error, setError] = useState(false)
  if (!src || error) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-100 text-slate-400 ${className ?? ''}`}
        aria-hidden="true"
      >
        <span className="text-xl">🐾</span>
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      className={`object-cover ${className ?? ''}`}
      onError={() => setError(true)}
      loading="lazy"
    />
  )
}