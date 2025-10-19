export const SAMAYAC_CENTER = { lat: 14.57, lng: -91.47 }

export function randomPointSamayac(radiusMeters = 3500) {
  const R_LAT = 111_320
  const latRad = (SAMAYAC_CENTER.lat * Math.PI) / 180
  const R_LNG = Math.cos(latRad) * R_LAT
  const u = Math.random()
  const v = Math.random()
  const r = Math.sqrt(u) * radiusMeters
  const theta = 2 * Math.PI * v
  const dLat = (r * Math.cos(theta)) / R_LAT
  const dLng = (r * Math.sin(theta)) / R_LNG
  return {
    lat: +(SAMAYAC_CENTER.lat + dLat).toFixed(6),
    lng: +(SAMAYAC_CENTER.lng + dLng).toFixed(6),
  }
}

