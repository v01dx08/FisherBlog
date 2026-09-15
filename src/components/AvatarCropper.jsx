"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Minus, Plus, RotateCcw, X } from "lucide-react"
import { Button } from "@/components/ui/button"

const CROP_PRESETS = {
  avatar: {
    cropWidth: 320,
    cropHeight: 320,
    outputWidth: 512,
    outputHeight: 512,
    suffix: "avatar",
    title: "Căn chỉnh ảnh đại diện",
    description: "Kéo ảnh để đặt khuôn mặt vào vòng tròn.",
    saveLabel: "Lưu ảnh đại diện",
  },
  cover: {
    cropWidth: 420,
    cropHeight: 140,
    outputWidth: 1500,
    outputHeight: 500,
    suffix: "cover",
    title: "Căn chỉnh ảnh bìa",
    description: "Kéo ảnh để chọn phần hiển thị đẹp nhất cho ảnh bìa.",
    saveLabel: "Lưu ảnh bìa",
  },
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function createCroppedImage({ image, zoom, offset, preset }) {
  const baseScale = Math.max(preset.cropWidth / image.naturalWidth, preset.cropHeight / image.naturalHeight)
  const scale = baseScale * zoom
  const sourceWidth = preset.cropWidth / scale
  const sourceHeight = preset.cropHeight / scale
  const sourceX = image.naturalWidth / 2 - (preset.cropWidth / 2 + offset.x) / scale
  const sourceY = image.naturalHeight / 2 - (preset.cropHeight / 2 + offset.y) / scale
  const canvas = document.createElement("canvas")
  canvas.width = preset.outputWidth
  canvas.height = preset.outputHeight
  const context = canvas.getContext("2d")

  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = "high"
  context.drawImage(
    image,
    clamp(sourceX, 0, image.naturalWidth - sourceWidth),
    clamp(sourceY, 0, image.naturalHeight - sourceHeight),
    sourceWidth,
    sourceHeight,
    0,
    0,
    preset.outputWidth,
    preset.outputHeight
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Không thể cắt ảnh."))
        return
      }
      resolve(blob)
    }, "image/png", 0.92)
  })
}

export function AvatarCropper({ file, mode = "avatar", onCancel, onApply }) {
  const preset = CROP_PRESETS[mode] || CROP_PRESETS.avatar
  const imageRef = useRef(null)
  const dragRef = useRef(null)
  const [imageSize, setImageSize] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [saving, setSaving] = useState(false)
  const previewUrl = useMemo(() => file ? URL.createObjectURL(file) : "", [file])

  const getBounds = useCallback((nextZoom = zoom) => {
    if (!imageSize?.width || !imageSize?.height) return { x: 0, y: 0 }
    const baseScale = Math.max(preset.cropWidth / imageSize.width, preset.cropHeight / imageSize.height)
    const width = imageSize.width * baseScale * nextZoom
    const height = imageSize.height * baseScale * nextZoom
    return {
      x: Math.max(0, (width - preset.cropWidth) / 2),
      y: Math.max(0, (height - preset.cropHeight) / 2),
    }
  }, [imageSize, preset.cropHeight, preset.cropWidth, zoom])

  const limitOffset = useCallback((nextOffset, nextZoom = zoom) => {
    const bounds = getBounds(nextZoom)
    return {
      x: clamp(nextOffset.x, -bounds.x, bounds.x),
      y: clamp(nextOffset.y, -bounds.y, bounds.y),
    }
  }, [getBounds, zoom])

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  useEffect(() => {
    const handleMove = (event) => {
      if (!dragRef.current) return
      event.preventDefault()
      const dx = event.clientX - dragRef.current.x
      const dy = event.clientY - dragRef.current.y
      dragRef.current = { x: event.clientX, y: event.clientY }
      setOffset((current) => limitOffset({ x: current.x + dx, y: current.y + dy }))
    }
    const stopDrag = () => {
      dragRef.current = null
    }

    window.addEventListener("pointermove", handleMove, { passive: false })
    window.addEventListener("pointerup", stopDrag)
    return () => {
      window.removeEventListener("pointermove", handleMove)
      window.removeEventListener("pointerup", stopDrag)
    }
  }, [limitOffset])

  const updateZoom = (value) => {
    const nextZoom = clamp(Number(value), 1, 3)
    setZoom(nextZoom)
    setOffset((current) => limitOffset(current, nextZoom))
  }

  const applyCrop = async () => {
    if (!imageRef.current) return
    setSaving(true)
    try {
      const blob = await createCroppedImage({ image: imageRef.current, zoom, offset, preset })
      const name = file.name.replace(/\.[^.]+$/, "") || preset.suffix
      onApply(new File([blob], `${name}-${preset.suffix}.png`, { type: "image/png" }))
    } finally {
      setSaving(false)
    }
  }

  if (!file) return null

  const imageStyle = imageSize
    ? {
        width: imageSize.width * Math.max(preset.cropWidth / imageSize.width, preset.cropHeight / imageSize.height),
        height: imageSize.height * Math.max(preset.cropWidth / imageSize.width, preset.cropHeight / imageSize.height),
        transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
      }
    : undefined

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background/90 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="avatar-crop-title" onClick={onCancel}>
      <div className={`w-full rounded-2xl border border-border/70 bg-card p-4 shadow-2xl sm:p-5 ${mode === "cover" ? "max-w-2xl" : "max-w-md"}`} onClick={(event) => event.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="avatar-crop-title" className="text-base font-bold">{preset.title}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{preset.description}</p>
          </div>
          <button type="button" onClick={onCancel} aria-label="Dong" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          className={`relative mx-auto w-full touch-none overflow-hidden rounded-lg bg-black ${mode === "cover" ? "aspect-[3/1] max-w-[420px] sm:max-w-[560px]" : "aspect-square max-w-[320px]"}`}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture?.(event.pointerId)
            dragRef.current = { x: event.clientX, y: event.clientY }
          }}
        >
          <img
            ref={imageRef}
            key={previewUrl}
            src={previewUrl}
            alt="Anh dang can chinh"
            draggable={false}
            onLoad={(event) => {
              setImageSize({
                width: event.currentTarget.naturalWidth,
                height: event.currentTarget.naturalHeight,
              })
              setZoom(1)
              setOffset({ x: 0, y: 0 })
            }}
            className="absolute left-1/2 top-1/2 max-w-none select-none"
            style={imageStyle}
          />
          <div className="pointer-events-none absolute inset-0 ring-1 ring-white/10" />
          <div className={`pointer-events-none absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 border-2 border-white shadow-[0_0_0_999px_rgba(0,0,0,0.46)] ${mode === "cover" ? "rounded-lg" : "rounded-full"}`} />
          <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-white/20" />
          <div className="pointer-events-none absolute inset-y-0 left-1/2 border-l border-white/20" />
        </div>

        <div className="mt-5 flex items-center gap-3">
          <Minus className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            onChange={(event) => updateZoom(event.target.value)}
            aria-label="Phong to anh"
            className="w-full accent-primary"
          />
          <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button type="button" variant="ghost" onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }) }} className="gap-2 rounded-full">
            <RotateCcw className="h-4 w-4" /> Đặt lại
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1 rounded-full sm:flex-none">Hủy</Button>
            <Button type="button" onClick={applyCrop} disabled={saving || !imageSize} className="flex-1 rounded-full sm:flex-none">
              {saving ? "Đang cắt..." : preset.saveLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
