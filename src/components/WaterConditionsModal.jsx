"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Waves, Wind, Compass, Clock, Thermometer, Droplets, X, CheckCircle2, MapPin, Loader2 } from "lucide-react"

const SPOTS = [
  {
    id: "trian",
    name: "Hồ Trị An",
    location: "Đồng Nai",
    lat: 11.12,
    lon: 107.03,
    waterType: "Hồ nước ngọt lớn",
    waterDepth: "1.8 m",
    tideInfo: "Nước xả ban mai 05:30 & 17:00",
    baitTip: "Mồi thìa (spoon) ánh bạc hoặc lure tôm giả sát đáy.",
  },
  {
    id: "cangio",
    name: "Cửa biển Cần Giờ",
    location: "TP. Hồ Chí Minh",
    lat: 10.41,
    lon: 106.96,
    waterType: "Vùng nước lợ / Cửa sông",
    waterDepth: "3.2 m",
    tideInfo: "Đỉnh triều 06:15 sáng & 18:45 chiều",
    baitTip: "Mồi sống (tôm đất, cá đối nhỏ) thả trôi theo con nước lớn.",
  },
  {
    id: "babe",
    name: "Hồ Ba Bể",
    location: "Bắc Kạn",
    lat: 22.41,
    lon: 105.62,
    waterType: "Hồ kiến tạo trên núi đá vôi",
    waterDepth: "2.4 m",
    tideInfo: "Nước êm quanh năm, cá ăn sáng sớm",
    baitTip: "Mồi cám thơm hỗn hợp hoặc mồi câu đài tự nhiên.",
  },
]

export function WaterConditionsModal({ isOpen, onClose }) {
  const [selectedSpot, setSelectedSpot] = useState(SPOTS[0])
  const [weatherData, setWeatherData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isOpen) return

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${selectedSpot.lat}&longitude=${selectedSpot.lon}&current=temperature_2m,surface_pressure,wind_speed_10m,relative_humidity_2m&timezone=Asia%2FHo_Chi_Minh`

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data?.current) {
          const temp = Math.round(data.current.temperature_2m)
          const pressure = Math.round(data.current.surface_pressure)
          const wind = Math.round(data.current.wind_speed_10m)
          const humidity = Math.round(data.current.relative_humidity_2m)

          // Calculate a realistic fishing index based on pressure and temperature
          // Ideal pressure for freshwater/coastal fish is 1010 - 1016 hPa
          let score = 8.5
          if (pressure >= 1010 && pressure <= 1018) score += 0.7
          else if (pressure < 1005 || pressure > 1022) score -= 1.2

          if (temp >= 24 && temp <= 30) score += 0.4
          else if (temp < 18 || temp > 35) score -= 1.0

          const finalScore = Math.min(9.8, Math.max(6.0, score)).toFixed(1)

          setWeatherData({
            temp: `${temp}°C`,
            pressure: `${pressure} hPa`,
            wind: `${wind} km/h`,
            humidity: `${humidity}%`,
            score: `${finalScore}/10`,
            isOptimal: Number(finalScore) >= 8.0,
          })
        }
      })
      .catch(() => {
        // Fallback default
        setWeatherData({
          temp: "27°C",
          pressure: "1013 hPa",
          wind: "11 km/h",
          humidity: "78%",
          score: "8.8/10",
          isOptimal: true,
        })
      })
      .finally(() => setLoading(false))
  }, [isOpen, selectedSpot])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="bg-card w-full max-w-lg rounded-3xl border border-border/80 shadow-2xl p-6 sm:p-7 relative overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-5 top-5 p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Title */}
          <div className="flex items-center gap-3 mb-5">
            <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Waves className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Bản Tin Điều Kiện Mặt Nước & Thời Tiết</h3>
              <p className="text-xs text-muted-foreground">
                Dữ liệu khí tượng thuỷ văn thời gian thực (Open-Meteo)
              </p>
            </div>
          </div>

          {/* Spot Selector Tabs */}
          <div className="flex gap-2 mb-5 p-1 rounded-2xl bg-muted/50">
            {SPOTS.map((spot) => (
              <button
                key={spot.id}
              onClick={() => { setLoading(true); setSelectedSpot(spot) }}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold transition-all ${
                  selectedSpot.id === spot.id
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {spot.name}
              </button>
            ))}
          </div>

          {/* Prime Fishing Rating Banner */}
          <div className="mb-5 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <div className="text-xs flex-1">
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                  {weatherData?.isOptimal ? "Thời điểm vàng để buông cần" : "Thời điểm câu cá trung bình"}
                </span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                  Chỉ số: {weatherData?.score || "8.8/10"}
                </span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Tại {selectedSpot.name} ({selectedSpot.location}), {selectedSpot.waterType.toLowerCase()}. Khí áp ổn định tạo điều kiện lý tưởng để cá săn mồi đi kiếm ăn.
              </p>
            </div>
          </div>

          {/* Grid Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
            <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/40">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Thermometer className="h-3.5 w-3.5 text-primary" />
                <span>Nhiệt độ</span>
              </div>
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground my-1" />
              ) : (
                <p className="text-xl font-bold text-foreground">{weatherData?.temp || "27°C"}</p>
              )}
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Ấm vừa phải</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/40">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Compass className="h-3.5 w-3.5 text-primary" />
                <span>Khí áp</span>
              </div>
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground my-1" />
              ) : (
                <p className="text-xl font-bold text-foreground">{weatherData?.pressure || "1013 hPa"}</p>
              )}
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Cá thở dễ, ăn mạnh</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/40">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Wind className="h-3.5 w-3.5 text-primary" />
                <span>Sức gió</span>
              </div>
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground my-1" />
              ) : (
                <p className="text-xl font-bold text-foreground">{weatherData?.wind || "11 km/h"}</p>
              )}
              <span className="text-[10px] text-muted-foreground font-medium">Gió nhẹ thuận lợi</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/40">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Droplets className="h-3.5 w-3.5 text-primary" />
                <span>Độ trong</span>
              </div>
              <p className="text-xl font-bold text-foreground">{selectedSpot.waterDepth}</p>
              <span className="text-[10px] text-muted-foreground font-medium">Độ sâu lý tưởng</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/40 col-span-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span>Chu kỳ Nước lớn / Thuỷ triều</span>
              </div>
              <p className="text-sm font-bold text-foreground">{selectedSpot.tideInfo}</p>
              <span className="text-[10px] text-muted-foreground">Khung giờ cá hoạt động mạnh nhất</span>
            </div>
          </div>

          {/* Recommendations */}
          <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/10 text-xs space-y-1">
            <span className="font-bold text-primary block">Gợi ý mồi câu tại {selectedSpot.name}:</span>
            <p className="text-muted-foreground">
              {selectedSpot.baitTip}
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
