"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  Clock,
  Compass,
  Droplets,
  Fish,
  Loader2,
  LocateFixed,
  MapPin,
  Search,
  Thermometer,
  Waves,
  Wind,
} from "lucide-react"
import { Header } from "@/components/Header"
import { LeftSidebar } from "@/components/LeftSidebar"
import { RightSidebar } from "@/components/RightSidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const QUICK_SPOTS = [
  "Hồ Trị An",
  "Hồ Ba Bể",
  "Hồ Dầu Tiếng",
  "Hồ Thác Bà",
  "Hồ Núi Cốc",
  "Cần Giờ",
  "Sông Hồng",
  "Sông Đồng Nai",
]

function metricTone(label) {
  if (label.includes("Rất tốt")) return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
  if (label.includes("Không")) return "border-destructive/30 bg-destructive/10 text-destructive"
  return "border-primary/25 bg-primary/10 text-primary"
}

function MetricCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="social-card min-w-0 p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon className="h-4 w-4 text-primary" />
        <span>{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}

function lonLatToTile(lat, lon, zoom) {
  const latRad = lat * Math.PI / 180
  const scale = 2 ** zoom
  const x = (lon + 180) / 360 * scale
  const y = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * scale
  return {
    x,
    y,
    tileX: Math.floor(x),
    tileY: Math.floor(y),
  }
}

function MapCard({ place }) {
  const lat = Number(place.latitude)
  const lon = Number(place.longitude)
  const zoom = 13
  const centerTile = lonLatToTile(lat, lon, zoom)
  const tileOffsetX = 512 + (centerTile.x - centerTile.tileX) * 256
  const tileOffsetY = 512 + (centerTile.y - centerTile.tileY) * 256
  const tiles = []
  for (let y = -2; y <= 2; y += 1) {
    for (let x = -2; x <= 2; x += 1) {
      tiles.push({ x: centerTile.tileX + x, y: centerTile.tileY + y })
    }
  }
  const mapLink = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=15/${lat}/${lon}`
  const directionsLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`

  return (
    <section className="social-card overflow-hidden">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
            <MapPin className="h-4 w-4 text-primary" />
            Bản đồ vị trí
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {[place.name, place.admin2, place.admin1].filter(Boolean).join(", ")}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={mapLink} target="_blank" rel="noopener noreferrer" className="kinetic rounded-lg px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10">
            Mở bản đồ
          </Link>
          <Link href={directionsLink} target="_blank" rel="noopener noreferrer" className="kinetic rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90">
            Chỉ đường
          </Link>
        </div>
      </div>
      <div className="relative h-[280px] w-full overflow-hidden bg-muted sm:h-[360px]">
        <div
          className="absolute grid h-[1280px] w-[1280px] grid-cols-5 grid-rows-5 opacity-95"
          style={{
            left: `calc(50% - ${tileOffsetX}px)`,
            top: `calc(50% - ${tileOffsetY}px)`,
          }}
        >
          {tiles.map((tile) => (
            <img
              key={`${tile.x}-${tile.y}`}
              src={`https://tile.openstreetmap.org/${zoom}/${tile.x}/${tile.y}.png`}
              alt=""
              className="h-64 w-64 select-none"
              loading="lazy"
              draggable={false}
            />
          ))}
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:64px_64px] mix-blend-overlay" />
        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-full flex-col items-center">
          <div className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow-xl ring-2 ring-white/70">
            {place.name}
          </div>
          <div className="h-4 w-4 rotate-45 rounded-br bg-primary shadow-xl" />
        </div>
        <div className="absolute bottom-3 right-3 rounded-full bg-card/90 px-3 py-1 text-[10px] font-semibold text-muted-foreground shadow-sm ring-1 ring-border/70">
          OpenStreetMap
        </div>
      </div>
    </section>
  )
}

export function WaterConditionsPageClient() {
  const [query, setQuery] = useState("Hồ Trị An")
  const [submittedQuery, setSubmittedQuery] = useState("Hồ Trị An")
  const [report, setReport] = useState(null)
  const [places, setPlaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [locating, setLocating] = useState(false)

  const loadReport = useCallback(async (params) => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch(`/api/water-conditions?${params.toString()}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Không thể tải điều kiện mặt nước.")
      setReport(data.report)
      setPlaces(data.places || [])
    } catch (caught) {
      setError(caught.message)
      setReport(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const params = new URLSearchParams({ q: submittedQuery })
    const timer = window.setTimeout(() => loadReport(params), 0)
    return () => window.clearTimeout(timer)
  }, [loadReport, submittedQuery])

  const submitSearch = (event) => {
    event.preventDefault()
    const next = query.trim()
    if (next.length < 2) {
      setError("Nhập ít nhất 2 ký tự để tìm địa điểm.")
      return
    }
    setError("")
    setSubmittedQuery(next)
  }

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Trình duyệt không hỗ trợ lấy vị trí hiện tại.")
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const params = new URLSearchParams({
          lat: String(position.coords.latitude),
          lon: String(position.coords.longitude),
          name: "Vị trí quanh tôi",
        })
        setQuery("Vị trí quanh tôi")
        loadReport(params).finally(() => setLocating(false))
      },
      () => {
        setLocating(false)
        setError("Không thể lấy vị trí. Hãy cho phép quyền vị trí hoặc nhập tên địa điểm.")
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const selectPlace = (place) => {
    const label = [place.name, place.admin1].filter(Boolean).join(", ")
    setError("")
    setQuery(label)
    const params = new URLSearchParams({
      lat: String(place.latitude),
      lon: String(place.longitude),
      name: place.name,
    })
    loadReport(params)
  }

  return (
    <main id="main-content" className="h-[100dvh] w-full overflow-hidden bg-background">
      <Header />
      <div className="grid h-full w-full grid-cols-1 gap-5 overflow-hidden px-3 pb-[76px] pt-[76px] sm:px-5 md:pb-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,960px)_minmax(320px,1fr)] xl:grid-cols-[280px_minmax(24px,1fr)_minmax(0,960px)_minmax(24px,1fr)_320px] xl:gap-6 min-[2100px]:mx-auto min-[2100px]:max-w-[1580px]">
        <div className="hidden min-w-0 xl:col-start-1 xl:block"><LeftSidebar /></div>

        <section className="custom-scrollbar min-h-0 min-w-0 overflow-y-auto pb-16 pt-4 lg:col-start-2 xl:col-start-3">
          <div className="mb-5">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/14 text-primary">
                <Waves className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <h1 className="text-xl font-bold sm:text-2xl">Điều kiện mặt nước & thời tiết</h1>
                <p className="mt-1 text-xs text-muted-foreground">Tìm địa điểm câu cá trên Việt Nam và xem thời điểm nên đi.</p>
              </div>
            </div>
          </div>

          <section className="social-card mb-5 p-4 sm:p-5">
            <form onSubmit={submitSearch} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
              <div className="relative min-w-0">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Nhập hồ, sông, xã, huyện hoặc tỉnh..."
                  className="h-11 rounded-xl pl-10"
                />
              </div>
              <Button type="submit" className="h-11 rounded-xl">
                <Search className="h-4 w-4" />
                Tìm kiếm
              </Button>
              <Button type="button" variant="outline" onClick={useCurrentLocation} disabled={locating} className="h-11 rounded-xl">
                {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
                Gần tôi
              </Button>
            </form>

            <div className="mt-4 flex flex-wrap gap-2">
              {QUICK_SPOTS.map((spot) => (
                <button
                  key={spot}
                  type="button"
                  onClick={() => { setError(""); setQuery(spot); setSubmittedQuery(spot) }}
                  className="kinetic rounded-full bg-muted/65 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-primary/12 hover:text-primary"
                >
                  {spot}
                </button>
              ))}
            </div>
          </section>

          {error && (
            <div role="alert" className="mb-5 flex items-center gap-2 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="social-card flex min-h-80 items-center justify-center text-primary">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : report ? (
            <div className="space-y-5">
              <section className="water-panel overflow-hidden rounded-3xl p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="truncate">
                        {[report.place.name, report.place.admin2, report.place.admin1].filter(Boolean).join(", ")}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold">{report.current.status}</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                      Dữ liệu Open-Meteo được phân tích theo khí áp, nhiệt độ, gió, khả năng mưa và khung giờ cá thường ăn mạnh.
                    </p>
                  </div>
                  <div className={`shrink-0 rounded-2xl border px-4 py-3 text-center ${metricTone(report.current.status)}`}>
                    <p className="text-xs font-semibold uppercase">Chỉ số</p>
                    <p className="text-3xl font-extrabold">{report.current.score}</p>
                  </div>
                </div>
              </section>

              <MapCard place={report.place} />

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard icon={Thermometer} label="Nhiệt độ" value={report.current.temperature} hint="Nhiệt độ quanh điểm câu" />
                <MetricCard icon={Compass} label="Khí áp" value={report.current.pressure} hint="Ổn định thường dễ câu hơn" />
                <MetricCard icon={Wind} label="Sức gió" value={report.current.wind} hint="Gió nhẹ giúp kiểm soát phao/mồi" />
                <MetricCard icon={Droplets} label="Độ ẩm" value={report.current.humidity} hint="Theo dữ liệu thời tiết hiện tại" />
              </div>

              <section className="social-card p-4 sm:p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <h2 className="text-base font-bold">Giờ đẹp hôm nay</h2>
                </div>
                <div className="grid gap-2 sm:grid-cols-5">
                  {report.bestHours.map((hour) => (
                    <div key={`${hour.time}-${hour.score}`} className="rounded-2xl bg-muted/45 p-3 text-center ring-1 ring-border/50">
                      <p className="text-lg font-bold">{hour.time}</p>
                      <p className="mt-1 text-xs font-semibold text-primary">{hour.score}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">{hour.label}</p>
                    </div>
                  ))}
                </div>
              </section>

              <div className="grid gap-5 lg:grid-cols-2">
                <section className="social-card p-4 sm:p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Compass className="h-5 w-5 text-primary" />
                    <h2 className="text-base font-bold">Vì sao chấm điểm này</h2>
                  </div>
                  <div className="space-y-2">
                    {report.reasons.map((reason) => (
                      <div key={reason} className="flex items-center gap-2 rounded-xl bg-muted/45 px-3 py-2 text-sm">
                        <span className="h-2 w-2 rounded-full bg-primary" />
                        {reason}
                      </div>
                    ))}
                  </div>
                </section>

                <section className="social-card p-4 sm:p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Fish className="h-5 w-5 text-primary" />
                    <h2 className="text-base font-bold">Mồi gợi ý</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {report.bait.map((bait) => (
                      <span key={bait} className="rounded-full bg-primary/12 px-3 py-1.5 text-xs font-bold text-primary">
                        {bait}
                      </span>
                    ))}
                  </div>
                  <p className="mt-4 text-xs leading-5 text-muted-foreground">
                    Khi đăng bài, bạn có thể ghi lại địa điểm này ở phần điểm câu để cộng đồng dễ tìm kinh nghiệm thực tế hơn.
                  </p>
                </section>
              </div>

              {places.length > 1 && (
                <section className="social-card p-4 sm:p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <h2 className="text-base font-bold">Địa điểm liên quan</h2>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {places.slice(1).map((place) => (
                      <button
                        key={place.id}
                        type="button"
                        onClick={() => selectPlace(place)}
                        className="kinetic rounded-2xl bg-muted/45 px-4 py-3 text-left hover:bg-muted"
                      >
                        <p className="font-semibold">{place.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {[place.admin2, place.admin1].filter(Boolean).join(", ") || place.country}
                        </p>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <div className="text-center text-xs text-muted-foreground">
                Cập nhật: {new Date(report.updatedAt).toLocaleString("vi-VN")} · <Link href="/" className="font-semibold text-primary hover:underline">Quay lại bảng tin</Link>
              </div>
            </div>
          ) : null}
        </section>

        <div className="hidden min-w-0 justify-self-end lg:col-start-3 lg:block xl:col-start-5"><RightSidebar /></div>
      </div>
    </main>
  )
}
