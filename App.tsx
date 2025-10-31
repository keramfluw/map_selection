import React, { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

// Fix default marker icons (when bundling with Vite)
const DefaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})
;(L.Marker.prototype as any).options.icon = DefaultIcon

type City = { name: string; lat: number; lon: number }

const CITIES: City[] = [
  { name: 'Berlin', lat: 52.520008, lon: 13.404954 },
  { name: 'Hamburg', lat: 53.551086, lon: 9.993682 },
  { name: 'München', lat: 48.137154, lon: 11.576124 },
  { name: 'Köln', lat: 50.937531, lon: 6.960279 },
  { name: 'Frankfurt am Main', lat: 50.110924, lon: 8.682127 },
  { name: 'Stuttgart', lat: 48.77845, lon: 9.180013 },
  { name: 'Düsseldorf', lat: 51.227741, lon: 6.773456 },
  { name: 'Dortmund', lat: 51.513587, lon: 7.465298 },
  { name: 'Essen', lat: 51.455643, lon: 7.011555 },
  { name: 'Leipzig', lat: 51.339695, lon: 12.373075 },
  { name: 'Bremen', lat: 53.079296, lon: 8.801694 },
  { name: 'Dresden', lat: 51.050409, lon: 13.737262 },
  { name: 'Hannover', lat: 52.375892, lon: 9.73201 },
  { name: 'Nürnberg', lat: 49.452103, lon: 11.076665 },
  { name: 'Duisburg', lat: 51.434408, lon: 6.762329 },
  { name: 'Bochum', lat: 51.481845, lon: 7.216236 },
  { name: 'Wuppertal', lat: 51.256213, lon: 7.150764 },
  { name: 'Bielefeld', lat: 52.030228, lon: 8.532471 },
  { name: 'Bonn', lat: 50.73743, lon: 7.098207 },
  { name: 'Münster', lat: 51.960665, lon: 7.626135 },
  { name: 'Karlsruhe', lat: 49.00689, lon: 8.403653 },
  { name: 'Mannheim', lat: 49.487459, lon: 8.466039 },
  { name: 'Augsburg', lat: 48.370545, lon: 10.89779 },
  { name: 'Wiesbaden', lat: 50.078218, lon: 8.239761 },
  { name: 'Gelsenkirchen', lat: 51.517744, lon: 7.085717 },
  { name: 'Mönchengladbach', lat: 51.180457, lon: 6.442804 },
  { name: 'Braunschweig', lat: 52.268874, lon: 10.52677 },
  { name: 'Chemnitz', lat: 50.827845, lon: 12.92137 },
  { name: 'Kiel', lat: 54.323293, lon: 10.122765 },
  { name: 'Aachen', lat: 50.775346, lon: 6.083887 },
]

const FitBoundsOnData = ({ bounds }: { bounds: L.LatLngBounds | null }) => {
  const map = useMap()
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [20, 20] })
    }
  }, [bounds, map])
  return null
}

export default function App() {
  const [statesData, setStatesData] = useState<any | null>(null)
  const [selectedState, setSelectedState] = useState<string | null>(null)
  const [allBounds, setAllBounds] = useState<L.LatLngBounds | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const mapWrapRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const urls = [
          'https://raw.githubusercontent.com/isellsoap/deutschlandGeoJSON/main/2_bundeslaender/1_sehr_hoch.geo.json',
          'https://raw.githubusercontent.com/isellsoap/deutschlandGeoJSON/main/2_bundeslaender/2_hoch.geo.json',
        ]
        let data: any = null
        for (const u of urls) {
          try {
            const r = await fetch(u)
            if (r.ok) {
              data = await r.json()
              break
            }
          } catch {}
        }
        if (!data) throw new Error('GeoJSON konnte nicht geladen werden.')
        setStatesData(data)
        const bounds = L.geoJSON(data as any).getBounds()
        setAllBounds(bounds)
      } catch (e) {
        console.error(e)
      }
    })()
  }, [])

  const stateStyle = (feature: any): L.PathOptions => {
    const name =
      feature.properties?.NAME_1 || feature.properties?.name || feature.properties?.NAME
    const isSelected = selectedState === name
    return {
      fillColor: isSelected ? '#22c55e' : '#60a5fa',
      weight: isSelected ? 2 : 1,
      opacity: 1,
      color: isSelected ? '#166534' : '#1e3a8a',
      dashArray: isSelected ? '' : '3',
      fillOpacity: isSelected ? 0.5 : 0.2,
    }
  }

  const onEachState = (feature: any, layer: L.Layer) => {
    const name = feature.properties?.NAME_1 || feature.properties?.name || feature.properties?.NAME
    if (name) (layer as any).bindTooltip(name, { sticky: true })
    ;(layer as any).on({
      click: () => setSelectedState(name || null),
      mouseover: function () {
        ;(this as any).setStyle({ weight: 2, fillOpacity: 0.35 })
      },
      mouseout: function () {
        ;(this as any).setStyle(stateStyle(feature))
      },
    })
  }

  const exportPdf = async () => {
    if (!mapWrapRef.current) return
    const node = mapWrapRef.current
    const canvas = await html2canvas(node, { scale: 2, useCORS: true })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height)
    const w = canvas.width * ratio
    const h = canvas.height * ratio
    const x = (pageWidth - w) / 2
    const y = (pageHeight - h) / 2
    pdf.addImage(imgData, 'PNG', x, y, w, h)
    const date = new Date().toISOString().slice(0, 10)
    pdf.save(`Deutschlandkarte_${selectedState ? selectedState.replace(/\s+/g, '_') + '_' : ''}${date}.pdf`)
  }

  const cityIcon = useMemo(
    () =>
      new L.DivIcon({
        html: `<div class="rounded-full p-1 bg-white shadow"><svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24'><path fill="currentColor" d="M12 2C8.14 2 5 5.14 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/></svg></div>`,
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
    []
  )

  return (
    <div className="w-full min-h-screen p-4">
      <div className="max-w-6xl mx-auto grid gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Interaktive Deutschlandkarte</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm">Auswahl:</span>
            <span className={"text-sm px-2 py-1 rounded " + (selectedState ? "bg-emerald-100" : "bg-gray-200")}>
              {selectedState ?? "kein Bundesland ausgewählt"}
            </span>
            {selectedState && (
              <button
                className="text-sm underline decoration-dotted"
                onClick={() => setSelectedState(null)}
              >
                Auswahl löschen
              </button>
            )}
            <button
              className="ml-2 px-3 py-2 rounded bg-black text-white text-sm"
              onClick={exportPdf}
            >
              PDF exportieren
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-[2fr,1fr] gap-4 items-start">
          <div ref={mapWrapRef} className="rounded-2xl overflow-hidden border shadow bg-white">
            <MapContainer
              ref={(m) => (mapRef.current = (m as any) || null)}
              style={{ height: 600, width: '100%' }}
              center={[51.1657, 10.4515]}
              zoom={6}
              scrollWheelZoom
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {statesData && (
                <>
                  <GeoJSON data={statesData as any} style={stateStyle} onEachFeature={onEachState} />
                  <FitBoundsOnData bounds={allBounds} />
                </>
              )}
              {CITIES.map((c) => (
                <Marker key={c.name} position={[c.lat, c.lon]} icon={cityIcon}>
                  <Popup>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-gray-600">
                      {c.lat.toFixed(4)}, {c.lon.toFixed(4)}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl border bg-white shadow-sm">
              <h3 className="text-lg font-semibold mb-2">Bedienung</h3>
              <ul className="list-disc ml-5 text-sm space-y-1">
                <li>In die Karte klicken, um ein Bundesland zu markieren.</li>
                <li>Die größten Städte sind als Marker mit Popup hinterlegt.</li>
                <li>Mit dem Button <em>PDF exportieren</em> wird die aktuelle Kartenansicht als PDF gespeichert.</li>
                <li>Mit <em>Auswahl löschen</em> können Sie die Markierung zurücksetzen.</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl border bg-white shadow-sm">
              <h3 className="text-lg font-semibold mb-2">Größte Städte (Auswahl)</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {CITIES.map((c) => (
                  <div key={c.name} className="truncate">• {c.name}</div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl border bg-white shadow-sm text-xs text-gray-600">
              Datenquellen: Bundesländer-GeoJSON (GitHub @isellsoap/deutschlandGeoJSON), Basiskarte © OpenStreetMap-Mitwirkende.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
