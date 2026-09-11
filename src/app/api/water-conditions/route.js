import { handleRouteError, json, RequestError } from "@/lib/http"

const VIETNAM_BOUNDS = {
  minLat: 8.18,
  maxLat: 23.4,
  minLon: 102.1,
  maxLon: 109.6,
}

const KNOWN_FISHING_PLACES = [
  { id: "tri-an", name: "Hồ Trị An", admin1: "Đồng Nai", admin2: "Vĩnh Cửu", country: "Việt Nam", latitude: 11.12, longitude: 107.03 },
  { id: "ba-be", name: "Hồ Ba Bể", admin1: "Bắc Kạn", admin2: "Ba Bể", country: "Việt Nam", latitude: 22.41, longitude: 105.62 },
  { id: "dau-tieng", name: "Hồ Dầu Tiếng", admin1: "Tây Ninh", admin2: "Dương Minh Châu", country: "Việt Nam", latitude: 11.35, longitude: 106.34 },
  { id: "thac-ba", name: "Hồ Thác Bà", admin1: "Yên Bái", admin2: "Yên Bình", country: "Việt Nam", latitude: 21.75, longitude: 105.03 },
  { id: "nui-coc", name: "Hồ Núi Cốc", admin1: "Thái Nguyên", admin2: "Đại Từ", country: "Việt Nam", latitude: 21.58, longitude: 105.69 },
  { id: "can-gio", name: "Cần Giờ", admin1: "TP. Hồ Chí Minh", admin2: "Cần Giờ", country: "Việt Nam", latitude: 10.41, longitude: 106.96 },
  { id: "song-hong", name: "Sông Hồng", admin1: "Hà Nội", admin2: "", country: "Việt Nam", latitude: 21.04, longitude: 105.85 },
  { id: "song-dong-nai", name: "Sông Đồng Nai", admin1: "Đồng Nai", admin2: "Biên Hòa", country: "Việt Nam", latitude: 10.95, longitude: 106.82 },
]

function normalizeText(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
}

function knownPlaceMatches(query) {
  const normalizedQuery = normalizeText(query)
  return KNOWN_FISHING_PLACES.filter((place) => {
    const haystack = normalizeText([place.name, place.admin2, place.admin1].filter(Boolean).join(" "))
    return haystack.includes(normalizedQuery) || normalizedQuery.includes(normalizeText(place.name))
  })
}

function clampCoordinate(value, min, max, name) {
  const number = Number(value)
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new RequestError(`${name} không nằm trong khu vực Việt Nam`, 400)
  }
  return number
}

function isVietnamPlace(place) {
  return place?.country_code === "VN" || place?.country === "Vietnam" || place?.country === "Việt Nam"
}

function formatPlace(place) {
  return {
    id: String(place.id || `${place.latitude}-${place.longitude}`),
    name: place.name,
    admin1: place.admin1 || "",
    admin2: place.admin2 || "",
    country: place.country || "Việt Nam",
    latitude: place.latitude,
    longitude: place.longitude,
  }
}

function scoreHour(hour) {
  let score = 6.8
  const reasons = []

  if (hour.pressure >= 1008 && hour.pressure <= 1018) {
    score += 1.1
    reasons.push("Khí áp ổn định")
  } else if (hour.pressure < 1002 || hour.pressure > 1024) {
    score -= 1.0
    reasons.push("Khí áp lệch vùng đẹp")
  }

  if (hour.wind <= 12) {
    score += 0.9
    reasons.push("Gió nhẹ")
  } else if (hour.wind > 24) {
    score -= 1.3
    reasons.push("Gió mạnh")
  }

  if (hour.temperature >= 23 && hour.temperature <= 31) {
    score += 0.7
    reasons.push("Nhiệt độ dễ chịu")
  } else if (hour.temperature < 18 || hour.temperature > 35) {
    score -= 0.8
    reasons.push("Nhiệt độ kém thuận lợi")
  }

  if (hour.precipitation <= 35) {
    score += 0.4
    reasons.push("Ít khả năng mưa")
  } else if (hour.precipitation > 70) {
    score -= 0.9
    reasons.push("Khả năng mưa cao")
  }

  const date = new Date(hour.time)
  const localHour = date.getHours()
  if ((localHour >= 5 && localHour <= 8) || (localHour >= 16 && localHour <= 19)) {
    score += 0.8
    reasons.push("Khung giờ cá ăn mạnh")
  }

  return {
    ...hour,
    score: Number(Math.min(9.8, Math.max(3.5, score)).toFixed(1)),
    reasons,
  }
}

function statusForScore(score) {
  if (score >= 8.2) return "Rất tốt để câu"
  if (score >= 7) return "Có thể đi câu"
  if (score >= 5.8) return "Trung bình"
  return "Không khuyến nghị"
}

function baitForPlace(name = "") {
  const lower = name.toLowerCase()
  if (lower.includes("biển") || lower.includes("cần giờ") || lower.includes("cửa")) {
    return ["Tôm sống", "Cá đối nhỏ", "Mồi giả ánh bạc"]
  }
  if (lower.includes("sông") || lower.includes("kênh")) {
    return ["Trùn", "Tép", "Mồi thơm tan chậm"]
  }
  if (lower.includes("hồ") || lower.includes("đầm")) {
    return ["Cám thơm", "Giun", "Lure nhỏ"]
  }
  return ["Giun", "Tôm", "Mồi thơm"]
}

async function findPlaces(query) {
  const searches = [query, `${query} Việt Nam`]
  const found = [...knownPlaceMatches(query)]
  const seen = new Set()
  for (const place of found) seen.add(`${place.name}-${place.latitude}-${place.longitude}`)

  for (const term of searches) {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search")
    url.searchParams.set("name", term)
    url.searchParams.set("count", "10")
    url.searchParams.set("language", "vi")
    url.searchParams.set("format", "json")

    const response = await fetch(url, { next: { revalidate: 60 * 60 * 24 } })
    if (!response.ok) continue
    const data = await response.json()
    for (const place of data.results || []) {
      if (!isVietnamPlace(place)) continue
      const key = `${place.name}-${place.latitude}-${place.longitude}`
      if (seen.has(key)) continue
      seen.add(key)
      found.push(formatPlace(place))
    }
  }

  return found.slice(0, 8)
}

async function getForecast({ latitude, longitude }) {
  const url = new URL("https://api.open-meteo.com/v1/forecast")
  url.searchParams.set("latitude", String(latitude))
  url.searchParams.set("longitude", String(longitude))
  url.searchParams.set("current", "temperature_2m,surface_pressure,wind_speed_10m,relative_humidity_2m,precipitation")
  url.searchParams.set("hourly", "temperature_2m,surface_pressure,wind_speed_10m,precipitation_probability,cloud_cover")
  url.searchParams.set("forecast_days", "1")
  url.searchParams.set("timezone", "Asia/Ho_Chi_Minh")

  const response = await fetch(url, { next: { revalidate: 60 * 10 } })
  if (!response.ok) throw new Error("Không thể tải dữ liệu thời tiết")
  return response.json()
}

function buildPayload({ place, forecast }) {
  const current = forecast.current || {}
  const hourly = forecast.hourly || {}
  const hours = (hourly.time || []).slice(0, 24).map((time, index) => scoreHour({
    time,
    temperature: Math.round(hourly.temperature_2m?.[index] || current.temperature_2m || 0),
    pressure: Math.round(hourly.surface_pressure?.[index] || current.surface_pressure || 0),
    wind: Math.round(hourly.wind_speed_10m?.[index] || current.wind_speed_10m || 0),
    precipitation: Math.round(hourly.precipitation_probability?.[index] || 0),
    cloud: Math.round(hourly.cloud_cover?.[index] || 0),
  }))
  const currentHour = scoreHour({
    time: current.time || new Date().toISOString(),
    temperature: Math.round(current.temperature_2m || 0),
    pressure: Math.round(current.surface_pressure || 0),
    wind: Math.round(current.wind_speed_10m || 0),
    precipitation: Math.round(current.precipitation || 0),
    cloud: 0,
  })
  const bestHours = [...hours].sort((a, b) => b.score - a.score).slice(0, 5)
  const topReasons = [...new Set(bestHours.flatMap((hour) => hour.reasons))].slice(0, 4)

  return {
    place,
    current: {
      temperature: `${currentHour.temperature}°C`,
      pressure: `${currentHour.pressure} hPa`,
      wind: `${currentHour.wind} km/h`,
      humidity: `${Math.round(current.relative_humidity_2m || 0)}%`,
      score: `${currentHour.score}/10`,
      status: statusForScore(currentHour.score),
    },
    bestHours: bestHours.map((hour) => ({
      time: new Date(hour.time).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      score: `${hour.score}/10`,
      label: statusForScore(hour.score),
    })),
    reasons: topReasons,
    bait: baitForPlace(place.name),
    updatedAt: current.time || new Date().toISOString(),
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")?.trim().slice(0, 80)
    const lat = searchParams.get("lat")
    const lon = searchParams.get("lon")

    let place = null
    let places = []

    if (lat && lon) {
      place = {
        id: "current-location",
        name: searchParams.get("name")?.trim().slice(0, 80) || "Vị trí hiện tại",
        admin1: "Gần bạn",
        admin2: "",
        country: "Việt Nam",
        latitude: clampCoordinate(lat, VIETNAM_BOUNDS.minLat, VIETNAM_BOUNDS.maxLat, "Vĩ độ"),
        longitude: clampCoordinate(lon, VIETNAM_BOUNDS.minLon, VIETNAM_BOUNDS.maxLon, "Kinh độ"),
      }
    } else if (query) {
      places = await findPlaces(query)
      place = places[0] || null
    } else {
      places = await findPlaces("Hồ Trị An")
      place = places[0] || KNOWN_FISHING_PLACES[0]
    }

    if (!place) return json({ places: [], error: "Không tìm thấy địa điểm phù hợp tại Việt Nam." }, 404)

    const forecast = await getForecast(place)
    return json({ places, report: buildPayload({ place, forecast }) })
  } catch (caught) {
    return handleRouteError("water-conditions", caught, request)
  }
}
