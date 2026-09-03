"use client"

export function PostSkeleton() {
  return (
    <div className="social-card mb-4 overflow-hidden p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full skeleton-shimmer shrink-0" />
          <div className="space-y-1.5">
            <div className="h-4 w-32 rounded-md skeleton-shimmer" />
            <div className="h-3 w-20 rounded-md skeleton-shimmer" />
          </div>
        </div>
        <div className="h-8 w-8 rounded-full skeleton-shimmer" />
      </div>

      {/* Content lines */}
      <div className="space-y-2 mb-4">
        <div className="h-3.5 w-full rounded-md skeleton-shimmer" />
        <div className="h-3.5 w-4/5 rounded-md skeleton-shimmer" />
        <div className="h-3.5 w-2/5 rounded-md skeleton-shimmer" />
      </div>

      {/* Media Image / Video preview box */}
      <div className="mb-4 h-64 w-full rounded-xl skeleton-shimmer" />

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-border/40">
        <div className="h-8 w-24 rounded-xl skeleton-shimmer" />
        <div className="h-8 w-24 rounded-xl skeleton-shimmer" />
        <div className="h-8 w-24 rounded-xl skeleton-shimmer" />
      </div>
    </div>
  )
}
