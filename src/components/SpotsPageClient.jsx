"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Compass, Crosshair, Fish, GlobeHemisphereWest, ListMagnifyingGlass, MapPin, NavigationArrow, SlidersHorizontal, WarningCircle } from "@phosphor-icons/react"
import { Loader2 } from "lucide-react"
import { Header } from "@/components/Header"
import { LeftSidebar } from "@/components/LeftSidebar"
import { RightSidebar } from "@/components/RightSidebar"

const radiusOptions = [
  { label: "10 km", value: 10000 },
  { label: "30 km", value: 30000 },
  { label: "50 km", value: 50000 },
]

const quickPlaces = ["Hồ Trị An", "Hồ Dầu Tiếng", "Hà Nội", "Cần Giờ", "Đà Nẵng", "Cần Thơ"]

function mapUrl(place) {
  return `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`
}

function locationLabel(place) {
  return [place.admin2, place.admin1].filter(Boolean).join(", ") || place.source || "Việt Nam"
}

export function SpotsPageClient() {
  const [query, setQuery] = useState("Hồ Trị An")
  const [submittedQuery, setSubmittedQuery] = useState("Hồ Trị An")
  const [radius, setRadius] = useState(30000)
  const [items, setItems] = useState([])
  const [center, setCenter] = useState(null)
  const [selectedId, setSelectedId] = useState("")
  const [loading, setLoading] = useState(true)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState("")

  const selectedSpot = useMemo(() => items.find((item) => item.id === selectedId) || items[0] || null, [items, selectedId])

  const loadSpots = useCallback(async (params) => {
    setLoading(true)
    setError("")
    try {
      params.set("radius", String(radius))
      const response = await fetch(`/api/fishing-spots?${params}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Không thể tải điểm câu.")
      const nextItems = Array.isArray(data.items) ? data.items : []
      setItems(nextItems)
      setCenter(data.center || null)
      setSelectedId(nextItems[0]?.id || "")
      if (nextItems.length === 0) setError("Chưa tìm thấy hồ câu phù hợp quanh khu vực này.")
    } catch (caught) {
      setItems([])
      setCenter(null)
      setSelectedId("")
      setError(caught.message || "Không thể tải điểm câu.")
    } finally {
      setLoading(false)
      setLocating(false)
    }
  }, [radius])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadSpots(new URLSearchParams({ q: submittedQuery }))
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadSpots, submittedQuery])

  const submitSearch = (event) => {
    event.preventDefault()
    const next = query.trim()
    if (next.length < 2) {
      setError("Nhập ít nhất 2 ký tự để tìm khu vực.")
      return
    }
    setSubmittedQuery(next)
  }

  const useCurrentLocation = () => {
    setError("")
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setError("Mobile chỉ cho phép lấy vị trí trên HTTPS. Hãy mở web bằng HTTPS hoặc tìm bằng tên địa điểm.")
      return
    }
    if (!navigator.geolocation) {
      setError("Trình duyệt không hỗ trợ lấy vị trí.")
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setQuery("Vị trí quanh tôi")
        setSubmittedQuery("Vị trí quanh tôi")
        loadSpots(new URLSearchParams({
          lat: String(position.coords.latitude),
          lon: String(position.coords.longitude),
        }))
      },
      () => {
        setLocating(false)
        setError("Không thể lấy vị trí. Hãy bật quyền vị trí hoặc tìm bằng tên địa điểm.")
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 60_000 }
    )
  }

  return (
    <main id="main-content" className="h-[100dvh] w-full overflow-hidden bg-background">
      <Header />
      <div className="grid h-full w-full grid-cols-1 gap-5 overflow-hidden px-3 pb-[76px] pt-[76px] sm:px-5 md:pb-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,960px)_minmax(320px,1fr)] xl:grid-cols-[280px_minmax(24px,1fr)_minmax(0,960px)_minmax(24px,1fr)_320px] xl:gap-6 min-[2100px]:mx-auto min-[2100px]:max-w-[1580px]">
        <div className="hidden min-w-0 xl:col-start-1 xl:block"><LeftSidebar /></div>

        <section className="custom-scrollbar min-h-0 min-w-0 overflow-y-auto pb-16 pt-4 lg:col-start-2 xl:col-start-3">
          <div className="mb-5 overflow-hidden rounded-3xl border border-primary/20 bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--primary)_24%,transparent),transparent_35%),color-mix(in_srgb,var(--card)_86%,transparent)] p-5 shadow-sm sm:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/12 px-3 py-1 text-xs font-bold text-primary">
                  <MapPin className="h-4 w-4" weight="fill" />
                  Bản đồ đi câu FishViet
                </span>
                <h1 className="mt-4 text-2xl font-bold tracking-[-0.025em] sm:text-3xl">Tìm hồ câu quanh bạn</h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Dò khu câu cá, hồ câu dịch vụ và điểm câu tự nhiên quanh vị trí hoặc khu vực bạn sắp đi.
                </p>
              </div>
              <button type="button" onClick={useCurrentLocation} disabled={locating || loading} className="kinetic inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground shadow-[0_8px_26px_rgba(34,139,230,0.2)] disabled:opacity-50">
                {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" weight="bold" />}
                Gần tôi
              </button>
            </div>

            <form onSubmit={submitSearch} className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
              <label className="relative block">
                <ListMagnifyingGlass className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" weight="duotone" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Nhập tên hồ, tỉnh/thành hoặc khu vực..."
                  className="h-12 w-full rounded-2xl bg-background/70 pl-11 pr-4 text-sm outline-none ring-1 ring-border/70 placeholder:text-muted-foreground focus:bg-card focus:ring-primary/45"
                />
              </label>
              <button type="submit" disabled={loading} className="kinetic inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-card px-5 text-sm font-bold text-primary ring-1 ring-primary/25 hover:bg-primary/10 disabled:opacity-50">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Compass className="h-4 w-4" weight="bold" />}
                Tìm điểm câu
              </button>
            </form>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground"><SlidersHorizontal className="h-4 w-4" /> Bán kính</span>
              {radiusOptions.map((option) => (
                <button key={option.value} type="button" onClick={() => setRadius(option.value)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${radius === option.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                  {option.label}
                </button>
              ))}
              <span className="mx-1 hidden h-4 w-px bg-border sm:block" />
              {quickPlaces.map((place) => (
                <button key={place} type="button" onClick={() => { setQuery(place); setSubmittedQuery(place) }} className="rounded-full bg-muted/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground">
                  {place}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p role="alert" className="mb-4 flex items-start gap-2 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <WarningCircle className="mt-0.5 h-4 w-4 shrink-0" weight="bold" />
              {error}
            </p>
          )}

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0 space-y-3">
              {loading ? (
                [0, 1, 2, 3].map((item) => <div key={item} className="h-32 rounded-3xl skeleton-shimmer" />)
              ) : items.length === 0 ? (
                <div className="social-card flex min-h-72 flex-col items-center justify-center p-8 text-center">
                  <Fish className="h-12 w-12 text-primary/45" weight="duotone" />
                  <h2 className="mt-4 text-lg font-bold">Chưa có điểm câu phù hợp</h2>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground">Thử tăng bán kính hoặc tìm bằng tên tỉnh/thành gần khu vực bạn muốn đi.</p>
                </div>
              ) : items.map((spot) => {
                const active = selectedSpot?.id === spot.id
                return (
                  <article key={spot.id} className={`rounded-3xl border p-4 transition ${active ? "border-primary/45 bg-primary/8 shadow-sm" : "border-border/70 bg-card/80 hover:border-primary/25"}`}>
                    <button type="button" onClick={() => setSelectedId(spot.id)} className="block w-full text-left">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="truncate text-base font-bold">{spot.name}</h2>
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 shrink-0" weight="duotone" />
                            <span className="truncate">{locationLabel(spot)}</span>
                          </p>
                        </div>
                        {typeof spot.distanceKm === "number" && (
                          <span className="shrink-0 rounded-full bg-primary/12 px-2.5 py-1 text-[11px] font-black text-primary">{spot.distanceKm} km</span>
                        )}
                      </div>
                    </button>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <a href={mapUrl(spot)} target="_blank" rel="noreferrer" className="kinetic inline-flex h-9 items-center gap-1.5 rounded-xl bg-muted px-3 text-xs font-bold text-foreground hover:bg-primary/10 hover:text-primary">
                        <NavigationArrow className="h-3.5 w-3.5" weight="bold" />
                        Mở Maps
                      </a>
                      <Link href={`/water-conditions?q=${encodeURIComponent(spot.name)}`} className="kinetic inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground hover:bg-primary/90">
                        <NavigationArrow className="h-3.5 w-3.5" weight="bold" />
                        Điều kiện mặt nước
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>

            <aside className="min-w-0 space-y-4 lg:sticky lg:top-20 lg:self-start">
              <div className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
                <div className="border-b border-border/60 p-4">
                  <h2 className="text-sm font-bold">Khu vực đang xem</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{center ? `${center.latitude.toFixed(4)}, ${center.longitude.toFixed(4)}` : "Chưa có tọa độ"}</p>
                </div>
                <div className="relative aspect-[4/3] bg-[radial-gradient(circle_at_center,color-mix(in_srgb,var(--primary)_24%,transparent),transparent_35%),linear-gradient(135deg,color-mix(in_srgb,var(--muted)_78%,transparent),color-mix(in_srgb,var(--card)_88%,transparent))]">
                  <div className="absolute inset-4 rounded-[1.5rem] border border-primary/20" />
                  <div className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl">
                    <Crosshair className="h-6 w-6" weight="bold" />
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-background/80 p-3 text-xs text-muted-foreground backdrop-blur">
                    {selectedSpot ? (
                      <p><span className="font-bold text-foreground">{selectedSpot.name}</span><br />{locationLabel(selectedSpot)}</p>
                    ) : (
                      <p>Chọn một điểm câu để xem nhanh thông tin.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-border/70 bg-card p-4">
                <h2 className="flex items-center gap-2 text-sm font-bold"><GlobeHemisphereWest className="h-4 w-4 text-primary" weight="duotone" /> Mẹo tìm hồ câu</h2>
                <div className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                  <p>Tìm theo tỉnh/thành nếu chưa biết tên hồ cụ thể.</p>
                  <p>Dùng bán kính 50 km khi ở ngoại ô hoặc khu ít dữ liệu OSM.</p>
                  <p>Mở điều kiện mặt nước trước khi đi để xem gió, khí áp và giờ đẹp.</p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <div className="hidden min-w-0 justify-self-end lg:col-start-3 lg:block xl:col-start-5"><RightSidebar /></div>
      </div>
    </main>
  )
}
