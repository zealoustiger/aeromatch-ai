'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import Link from 'next/link'
import 'leaflet/dist/leaflet.css'
import type { MapPin } from './PartnershipsMapView'

// Leaflet's default marker icon references bundler-relative image paths that
// don't resolve under Next's asset pipeline — point them at the same CDN
// version already pinned in package.json instead.
const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

export default function PartnershipsLeafletMap({ pins }: { pins: MapPin[] }) {
  const center: [number, number] = [
    pins.reduce((sum, p) => sum + p.lat, 0) / pins.length,
    pins.reduce((sum, p) => sum + p.lng, 0) / pins.length,
  ]

  return (
    <MapContainer
      center={center}
      zoom={4}
      scrollWheelZoom={false}
      style={{ height: 384, width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {pins.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={markerIcon}>
          <Popup>
            <div className="text-sm">
              <div className="font-semibold text-slate-900">
                {p.make} {p.model}
              </div>
              <div className="text-slate-600">
                {p.airport_name || p.home_airport}
                {p.city ? ` · ${p.city}, ${p.state}` : ''}
              </div>
              {p.buy_in_price != null && (
                <div className="mt-1 text-slate-700">
                  Buy-in: ${p.buy_in_price.toLocaleString()}
                </div>
              )}
              <Link
                href={`/partnerships/${p.id}`}
                className="mt-1 inline-block font-medium text-sky-600 hover:underline"
              >
                View listing →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
