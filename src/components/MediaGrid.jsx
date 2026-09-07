"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronLeft, ChevronRight, Play, Maximize2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react"

export function MediaGrid({ items = [] }) {
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [loadedMap, setLoadedMap] = useState({})
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const closeButtonRef = useRef(null)
  const pointersRef = useRef(new Map())
  const dragStartRef = useRef(null)
  const pinchStartRef = useRef(null)

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    closeButtonRef.current?.focus()
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setZoom(1)
        setPan({ x: 0, y: 0 })
        pointersRef.current.clear()
        dragStartRef.current = null
        pinchStartRef.current = null
        setLightboxIndex(null)
      }
      if (e.key === "ArrowLeft") {
        setZoom(1)
        setPan({ x: 0, y: 0 })
        pointersRef.current.clear()
        dragStartRef.current = null
        pinchStartRef.current = null
        setLightboxIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1))
      }
      if (e.key === "ArrowRight") {
        setZoom(1)
        setPan({ x: 0, y: 0 })
        pointersRef.current.clear()
        dragStartRef.current = null
        pinchStartRef.current = null
        setLightboxIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0))
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [lightboxIndex, items.length])

  if (!items || items.length === 0) return null

  const handleImageLoad = (index) => {
    setLoadedMap((prev) => ({ ...prev, [index]: true }))
  }

  const count = items.length
  const currentItem = lightboxIndex === null ? null : items[lightboxIndex]
  const currentIsVideo = Boolean(
    currentItem?.type === "video" ||
    (typeof currentItem === "string" && currentItem.endsWith(".mp4"))
  )

  const resetZoom = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
    pointersRef.current.clear()
    dragStartRef.current = null
    pinchStartRef.current = null
  }

  const openLightbox = (index) => {
    resetZoom()
    setLightboxIndex(index)
  }

  const closeLightbox = () => {
    resetZoom()
    setLightboxIndex(null)
  }

  const showLightboxIndex = (nextIndex) => {
    resetZoom()
    setLightboxIndex((previous) => typeof nextIndex === "function" ? nextIndex(previous) : nextIndex)
  }

  const clampZoom = (value) => Math.min(4, Math.max(1, value))

  const changeZoom = (amount) => {
    setZoom((current) => {
      const next = clampZoom(Number((current + amount).toFixed(2)))
      if (next === 1) setPan({ x: 0, y: 0 })
      return next
    })
  }

  const distanceBetweenPointers = () => {
    const points = [...pointersRef.current.values()]
    if (points.length < 2) return 0
    return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y)
  }

  const handleZoomWheel = (event) => {
    if (currentIsVideo) return
    event.preventDefault()
    changeZoom(event.deltaY > 0 ? -0.18 : 0.18)
  }

  const handlePointerDown = (event) => {
    if (currentIsVideo) return
    event.currentTarget.setPointerCapture?.(event.pointerId)
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

    if (pointersRef.current.size === 1 && zoom > 1) {
      dragStartRef.current = {
        x: event.clientX,
        y: event.clientY,
        pan,
      }
    }

    if (pointersRef.current.size === 2) {
      pinchStartRef.current = {
        distance: distanceBetweenPointers(),
        zoom,
      }
      dragStartRef.current = null
    }
  }

  const handlePointerMove = (event) => {
    if (currentIsVideo || !pointersRef.current.has(event.pointerId)) return
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

    if (pointersRef.current.size === 2 && pinchStartRef.current?.distance) {
      const nextZoom = clampZoom(pinchStartRef.current.zoom * (distanceBetweenPointers() / pinchStartRef.current.distance))
      setZoom(nextZoom)
      if (nextZoom === 1) setPan({ x: 0, y: 0 })
      return
    }

    if (zoom > 1 && dragStartRef.current) {
      setPan({
        x: dragStartRef.current.pan.x + event.clientX - dragStartRef.current.x,
        y: dragStartRef.current.pan.y + event.clientY - dragStartRef.current.y,
      })
    }
  }

  const handlePointerUp = (event) => {
    pointersRef.current.delete(event.pointerId)
    if (pointersRef.current.size < 2) pinchStartRef.current = null
    if (pointersRef.current.size === 0) dragStartRef.current = null
  }

  const toggleQuickZoom = () => {
    if (currentIsVideo) return
    if (zoom > 1) resetZoom()
    else setZoom(2)
  }

  const renderMediaItem = (item, index, className = "", isOverlay = false, overlayCount = 0) => {
    const isVideo = item.type === "video" || (typeof item === "string" && item.endsWith(".mp4"))
    const url = typeof item === "string" ? item : item.url
    const isLoaded = !!loadedMap[index]

    return (
      <button
        type="button"
        aria-label={`Mở media ${index + 1} trong ${count}`}
        key={index}
        onClick={() => openLightbox(index)}
        className={`relative block min-h-0 min-w-0 overflow-hidden bg-muted cursor-pointer group select-none text-left ${className}`}
      >
        {!isLoaded && !isVideo && (
          <div className="absolute inset-0 skeleton-shimmer z-0" />
        )}

        {isVideo ? (
          <div className="w-full h-full bg-slate-950 flex items-center justify-center relative">
            <video
              src={url}
              preload="metadata"
            className="h-full w-full object-cover pointer-events-none"
            />
            <div className="absolute h-11 w-11 rounded-full bg-black/60 backdrop-blur-sm text-white flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="h-5 w-5 ml-0.5 fill-current" />
            </div>
          </div>
        ) : (
          <img
            src={url}
            alt="Mẻ câu"
            loading="lazy"
            decoding="async"
            onLoad={() => handleImageLoad(index)}
            className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              !isLoaded ? "opacity-0" : "opacity-100"
            }`}
          />
        )}

        {/* Hover zoom icon */}
        <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/40 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-opacity">
          <Maximize2 className="h-3.5 w-3.5" />
        </div>

        {/* Facebook +N Overlay on last slot */}
        {isOverlay && overlayCount > 0 && (
          <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px] flex items-center justify-center text-white z-10 font-bold text-2xl group-hover:bg-black/75 transition-colors">
            +{overlayCount}
          </div>
        )}
      </button>
    )
  }

  const overlayCount = Math.max(0, count - 5)

  return (
    <>
      <div className="w-full max-w-full overflow-hidden bg-muted/40">
        {count === 1 && (
          <div className="w-full max-h-[560px]">
            {renderMediaItem(items[0], 0, "h-full max-h-[560px] w-full aspect-[4/3] sm:aspect-[16/10]")}
          </div>
        )}

        {count === 2 && (
          <div className="grid w-full grid-cols-2 gap-0.5 aspect-[16/10]">
            {renderMediaItem(items[0], 0, "w-full h-full")}
            {renderMediaItem(items[1], 1, "w-full h-full")}
          </div>
        )}

        {count === 3 && (
          <div className="grid w-full grid-cols-2 grid-rows-2 gap-0.5 aspect-[4/3] sm:aspect-[16/10]">
            {renderMediaItem(items[0], 0, "col-span-2 h-full")}
            {renderMediaItem(items[1], 1, "h-full")}
            {renderMediaItem(items[2], 2, "h-full")}
          </div>
        )}

        {count === 4 && (
          <div className="grid w-full grid-cols-2 grid-rows-2 gap-0.5 aspect-[4/3]">
            {renderMediaItem(items[0], 0, "h-full")}
            {renderMediaItem(items[1], 1, "h-full")}
            {renderMediaItem(items[2], 2, "h-full")}
            {renderMediaItem(items[3], 3, "h-full")}
          </div>
        )}

        {count >= 5 && (
          <div className="grid w-full grid-cols-6 grid-rows-[minmax(0,1.2fr)_minmax(0,1fr)] gap-0.5 aspect-[5/4] sm:aspect-[4/3]">
            {renderMediaItem(items[0], 0, "col-span-3 h-full")}
            {renderMediaItem(items[1], 1, "col-span-3 h-full")}
            {renderMediaItem(items[2], 2, "col-span-2 h-full")}
            {renderMediaItem(items[3], 3, "col-span-2 h-full")}
            {renderMediaItem(items[4], 4, "col-span-2 h-full", overlayCount > 0, overlayCount)}
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Trình xem media"
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between"
            onClick={closeLightbox}
          >
            {/* Top Bar */}
            <div
              className="p-4 flex items-center justify-between text-white z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                  {lightboxIndex + 1} / {items.length}
                </span>
                {!currentIsVideo && (
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                    {Math.round(zoom * 100)}%
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {!currentIsVideo && (
                  <>
                    <button type="button" aria-label="Thu nhỏ ảnh" onClick={() => changeZoom(-0.25)} disabled={zoom <= 1} className="rounded-full p-2 text-white transition-colors hover:bg-white/10 disabled:opacity-40">
                      <ZoomOut className="h-5 w-5" />
                    </button>
                    <button type="button" aria-label="Đặt lại thu phóng" onClick={resetZoom} disabled={zoom === 1 && pan.x === 0 && pan.y === 0} className="rounded-full p-2 text-white transition-colors hover:bg-white/10 disabled:opacity-40">
                      <RotateCcw className="h-5 w-5" />
                    </button>
                    <button type="button" aria-label="Phóng to ảnh" onClick={() => changeZoom(0.25)} disabled={zoom >= 4} className="rounded-full p-2 text-white transition-colors hover:bg-white/10 disabled:opacity-40">
                      <ZoomIn className="h-5 w-5" />
                    </button>
                  </>
                )}
                <button
                  ref={closeButtonRef}
                  type="button"
                  aria-label="Đóng trình xem media"
                  onClick={closeLightbox}
                  className="rounded-full p-2 text-white transition-colors hover:bg-white/10"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Center Media View */}
            <div
              className="relative flex flex-1 touch-none select-none items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
              onWheel={handleZoomWheel}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onDoubleClick={toggleQuickZoom}
            >
              {/* Prev Button */}
              {items.length > 1 && (
                <button
                  type="button"
                  aria-label="Media trước"
                  onClick={(e) => {
                    e.stopPropagation()
                    showLightboxIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1))
                  }}
                  className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-20"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              )}

              {/* Media Element */}
              <motion.div
                key={lightboxIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`max-h-[82vh] max-w-4xl flex items-center justify-center overflow-hidden ${currentIsVideo ? "" : zoom > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"}`}
              >
                {items[lightboxIndex]?.type === "video" ||
                (typeof items[lightboxIndex] === "string" && items[lightboxIndex].endsWith(".mp4")) ? (
                  <video
                    src={typeof items[lightboxIndex] === "string" ? items[lightboxIndex] : items[lightboxIndex].url}
                    controls
                    autoPlay
                    className="max-h-[80vh] max-w-full rounded-xl shadow-2xl"
                  />
                ) : (
                  <img
                    src={typeof items[lightboxIndex] === "string" ? items[lightboxIndex] : items[lightboxIndex].url}
                    alt="Mẻ câu phóng to"
                    draggable={false}
                    style={{ transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})` }}
                    className="max-h-[80vh] max-w-full touch-none select-none rounded-xl object-contain shadow-2xl transition-transform duration-100"
                  />
                )}
              </motion.div>

              {/* Next Button */}
              {items.length > 1 && (
                <button
                  type="button"
                  aria-label="Media tiếp theo"
                  onClick={(e) => {
                    e.stopPropagation()
                    showLightboxIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0))
                  }}
                  className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-20"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              )}
            </div>

            {/* Bottom thumbnail strip */}
            {items.length > 1 && (
              <div
                className="p-4 flex justify-center gap-2 overflow-x-auto custom-scrollbar z-10"
                onClick={(e) => e.stopPropagation()}
              >
                {items.map((item, i) => {
                  const url = typeof item === "string" ? item : item.url
                  return (
                    <button
                      type="button"
                      aria-label={`Xem media ${i + 1}`}
                      key={i}
                      onClick={() => showLightboxIndex(i)}
                      className={`h-12 w-16 rounded-lg overflow-hidden shrink-0 transition-all ${
                        lightboxIndex === i
                          ? "ring-2 ring-primary scale-105"
                          : "opacity-40 hover:opacity-80"
                      }`}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
