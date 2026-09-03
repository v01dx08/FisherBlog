"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronLeft, ChevronRight, Play, Maximize2 } from "lucide-react"

export function MediaGrid({ items = [] }) {
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [loadedMap, setLoadedMap] = useState({})

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setLightboxIndex(null)
      if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1))
      }
      if (e.key === "ArrowRight") {
        setLightboxIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0))
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [lightboxIndex, items.length])

  if (!items || items.length === 0) return null

  const handleImageLoad = (index) => {
    setLoadedMap((prev) => ({ ...prev, [index]: true }))
  }

  const count = items.length

  const renderMediaItem = (item, index, className = "", isOverlay = false, overlayCount = 0) => {
    const isVideo = item.type === "video" || (typeof item === "string" && item.endsWith(".mp4"))
    const url = typeof item === "string" ? item : item.url
    const isLoaded = !!loadedMap[index]

    return (
      <div
        key={index}
        onClick={() => setLightboxIndex(index)}
        className={`relative overflow-hidden bg-muted cursor-pointer group select-none ${className}`}
      >
        {!isLoaded && !isVideo && (
          <div className="absolute inset-0 skeleton-shimmer z-0" />
        )}

        {isVideo ? (
          <div className="w-full h-full bg-slate-950 flex items-center justify-center relative">
            <video
              src={url}
              preload="metadata"
              className="w-full h-full object-cover pointer-events-none"
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
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
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
      </div>
    )
  }

  return (
    <>
      <div className="w-full overflow-hidden bg-muted/40">
        {/* CASE 1: 1 Media */}
        {count === 1 && (
          <div className="w-full max-h-[520px]">
            {renderMediaItem(items[0], 0, "w-full max-h-[520px] aspect-[16/10]")}
          </div>
        )}

        {/* CASE 2: 2 Media side-by-side */}
        {count === 2 && (
          <div className="grid grid-cols-2 gap-1 w-full aspect-[16/10]">
            {renderMediaItem(items[0], 0, "w-full h-full")}
            {renderMediaItem(items[1], 1, "w-full h-full")}
          </div>
        )}

        {/* CASE 3: 3 Media (1 large left, 2 stacked right) */}
        {count === 3 && (
          <div className="grid grid-cols-2 grid-rows-2 gap-1 w-full aspect-[16/10]">
            {renderMediaItem(items[0], 0, "row-span-2 col-span-1 h-full")}
            {renderMediaItem(items[1], 1, "col-span-1 h-full")}
            {renderMediaItem(items[2], 2, "col-span-1 h-full")}
          </div>
        )}

        {/* CASE 4: 4 Media (2x2 grid) */}
        {count === 4 && (
          <div className="grid grid-cols-2 grid-rows-2 gap-1 w-full aspect-square sm:aspect-[4/3]">
            {renderMediaItem(items[0], 0, "h-full")}
            {renderMediaItem(items[1], 1, "h-full")}
            {renderMediaItem(items[2], 2, "h-full")}
            {renderMediaItem(items[3], 3, "h-full")}
          </div>
        )}

        {/* CASE 5+: 5 or more Media (2 top, 3 bottom with +N on 5th slot) */}
        {count >= 5 && (
          <div className="grid grid-cols-6 grid-rows-2 gap-1 w-full aspect-square sm:aspect-[4/3]">
            {renderMediaItem(items[0], 0, "col-span-3 h-full")}
            {renderMediaItem(items[1], 1, "col-span-3 h-full")}
            {renderMediaItem(items[2], 2, "col-span-2 h-full")}
            {renderMediaItem(items[3], 3, "col-span-2 h-full")}
            {renderMediaItem(items[4], 4, "col-span-2 h-full", count > 5, count - 4)}
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <div
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between"
            onClick={() => setLightboxIndex(null)}
          >
            {/* Top Bar */}
            <div
              className="p-4 flex items-center justify-between text-white z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm">
                {lightboxIndex + 1} / {items.length}
              </span>
              <button
                onClick={() => setLightboxIndex(null)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Center Media View */}
            <div
              className="flex-1 flex items-center justify-center p-4 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Prev Button */}
              {items.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setLightboxIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1))
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
                className="max-h-[82vh] max-w-4xl flex items-center justify-center"
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
                    className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl select-none"
                  />
                )}
              </motion.div>

              {/* Next Button */}
              {items.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setLightboxIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0))
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
                      key={i}
                      onClick={() => setLightboxIndex(i)}
                      className={`h-12 w-16 rounded-lg overflow-hidden shrink-0 transition-all ${
                        lightboxIndex === i
                          ? "ring-2 ring-primary scale-105"
                          : "opacity-40 hover:opacity-80"
                      }`}
                    >
                      <img src={url} alt="Thumbnail" className="w-full h-full object-cover" />
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
