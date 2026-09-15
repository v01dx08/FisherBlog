import { handleRouteError, json, RequestError } from "@/lib/http"

const VIETNAM_BOUNDS = {
  minLat: 8.18,
  maxLat: 23.4,
  minLon: 102.1,
  maxLon: 109.6,
}

const KNOWN_FISHING_PLACES = [
  { id: "tri-an", name: "Hồ Trị An", admin1: "Đồng Nai", admin2: "Vĩnh Cửu", latitude: 11.12, longitude: 107.03 },
  { id: "ba-be", name: "Hồ Ba Bể", admin1: "Bắc Kạn", admin2: "Ba Bể", latitude: 22.41, longitude: 105.62 },
  { id: "dau-tieng", name: "Hồ Dầu Tiếng", admin1: "Tây Ninh", admin2: "Dương Minh Châu", latitude: 11.35, longitude: 106.34 },
  { id: "thac-ba", name: "Hồ Thác Bà", admin1: "Yên Bái", admin2: "Yên Bình", latitude: 21.75, longitude: 105.03 },
  { id: "nui-coc", name: "Hồ Núi Cốc", admin1: "Thái Nguyên", admin2: "Đại Từ", latitude: 21.58, longitude: 105.69 },
  { id: "can-gio", name: "Cần Giờ", admin1: "TP. Hồ Chí Minh", admin2: "Cần Giờ", latitude: 10.41, longitude: 106.96 },
  { id: "song-hong", name: "Sông Hồng", admin1: "Hà Nội", admin2: "", latitude: 21.04, longitude: 105.85 },
  { id: "song-dong-nai", name: "Sông Đồng Nai", admin1: "Đồng Nai", admin2: "Biên Hòa", latitude: 10.95, longitude: 106.82 },
]

function normalizeText(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
}

function clampCoordinate(value, min, max, name) {
  const number = Number(value)
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new RequestError(`${name} không nằm trong khu vực Việt Nam`, 400)
  }
  return number
}

function distanceKm(from, to) {
  const earthRadius = 6371
  const dLat = (to.latitude - from.latitude) * Math.PI / 180
  const dLon = (to.longitude - from.longitude) * Math.PI / 180
  const lat1 = from.latitude * Math.PI / 180
  const lat2 = to.latitude * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function knownPlaceMatches(query) {
  const normalizedQuery = normalizeText(query)
  return KNOWN_FISHING_PLACES.filter((place) => {
    const haystack = normalizeText([place.name, place.admin2, place.admin1].filter(Boolean).join(" "))
    return haystack.includes(normalizedQuery) || normalizedQuery.includes(normalizeText(place.name))
  })
}

async function geocodeQuery(query) {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search")
  url.searchParams.set("name", `${query} Việt Nam`)
  url.searchParams.set("count", "1")
  url.searchParams.set("language", "vi")
  url.searchParams.set("format", "json")

  const response = await fetch(url, { next: { revalidate: 60 * 60 * 24 } })
  if (!response.ok) return null
  const data = await response.json()
  const place = data.results?.find((item) => item.country_code === "VN" || item.country === "Vietnam")
  if (!place) return null
  return {
    latitude: clampCoordinate(place.latitude, VIETNAM_BOUNDS.minLat, VIETNAM_BOUNDS.maxLat, "Vĩ độ"),
    longitude: clampCoordinate(place.longitude, VIETNAM_BOUNDS.minLon, VIETNAM_BOUNDS.maxLon, "Kinh độ"),
  }
}

function overpassQuery({ latitude, longitude, radius }) {
  return `
    [out:json][timeout:18];
    (
      nwr["leisure"="fishing"](around:${radius},${latitude},${longitude});
      nwr["sport"="fishing"](around:${radius},${latitude},${longitude});
      nwr["name"~"hồ câu|câu cá|khu câu cá|fishing",i](around:${radius},${latitude},${longitude});
    );
    out center tags 40;
  `
}

function parseOverpassElement(element, center) {
  const tags = element.tags || {}
  const latitude = Number(element.lat ?? element.center?.lat)
  const longitude = Number(element.lon ?? element.center?.lon)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  if (!tags.name) return null

  const place = {
    id: `osm-${element.type}-${element.id}`,
    name: tags.name,
    admin1: tags["addr:province"] || tags["addr:city"] || tags["addr:state"] || "",
    admin2: tags["addr:district"] || tags["addr:suburb"] || tags["addr:county"] || "",
    latitude,
    longitude,
    source: "OpenStreetMap",
  }
  return {
    ...place,
    distanceKm: Number(distanceKm(center, place).toFixed(1)),
  }
}

async function findOsmFishingSpots(center, radius) {
  try {
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: overpassQuery({ ...center, radius }),
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      next: { revalidate: 60 * 60 },
    })
    if (!response.ok) return []

    const data = await response.json()
    const seen = new Set()
    return (data.elements || [])
      .map((element) => parseOverpassElement(element, center))
      .filter(Boolean)
      .filter((place) => {
        const key = normalizeText(`${place.name}-${place.latitude.toFixed(4)}-${place.longitude.toFixed(4)}`)
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
  } catch {
    return []
  }
}

function knownNearby(center, query = "") {
  const matches = query ? knownPlaceMatches(query) : KNOWN_FISHING_PLACES
  return matches
    .map((place) => ({
      ...place,
      source: "FishViet",
      distanceKm: Number(distanceKm(center, place).toFixed(1)),
    }))
    .filter((place) => place.distanceKm <= 120 || query)
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")?.trim().slice(0, 80) || ""
    const lat = searchParams.get("lat")
    const lon = searchParams.get("lon")
    const radius = Math.min(50000, Math.max(5000, Number(searchParams.get("radius") || 30000)))

    let center = null
    if (lat && lon) {
      center = {
        latitude: clampCoordinate(lat, VIETNAM_BOUNDS.minLat, VIETNAM_BOUNDS.maxLat, "Vĩ độ"),
        longitude: clampCoordinate(lon, VIETNAM_BOUNDS.minLon, VIETNAM_BOUNDS.maxLon, "Kinh độ"),
      }
    } else if (query) {
      const known = knownPlaceMatches(query)[0]
      center = known ? { latitude: known.latitude, longitude: known.longitude } : await geocodeQuery(query)
    }

    if (!center) {
      return json({ items: [], error: "Không tìm thấy khu vực phù hợp để dò hồ câu." }, 404)
    }

    const [osmItems, knownItems] = await Promise.all([
      findOsmFishingSpots(center, radius),
      Promise.resolve(knownNearby(center, query)),
    ])
    const seen = new Set()
    const items = [...osmItems, ...knownItems]
      .filter((place) => {
        const key = normalizeText(place.name)
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 12)

    return json({ center, items })
  } catch (caught) {
    return handleRouteError("fishing-spots", caught, request)
  }
}
