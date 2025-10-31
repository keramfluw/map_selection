# Interaktive Deutschlandkarte – Bundesländer & Großstädte (PDF-Export)

**Stack:** Vite + React + TypeScript + Tailwind + Leaflet (react-leaflet)

## Features
- Grenzen der 16 Bundesländer (GeoJSON)
- Marker für größte Städte inkl. Popup
- Klick auf Bundesland markiert es
- **PDF-Export** der aktuellen Kartenansicht (A4 landscape)

## Lokaler Start
```bash
npm install
npm run dev
```

Danach im Browser `http://localhost:5173/` öffnen.

## Build
```bash
npm run build
npm run preview
```

## Hinweise
- GeoJSON wird zur Laufzeit aus dem GitHub-Repo `isellsoap/deutschlandGeoJSON` geladen.
- Leaflet-Default-Icons werden aus dem CDN (unpkg) referenziert, damit sie im Vite-Bundle korrekt erscheinen.
