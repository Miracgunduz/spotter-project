# Spotter — Trip Planner & ELD Log Generator

A full-stack tool for truck drivers and dispatchers: enter a current location, pickup, and dropoff, and Spotter plans the route, simulates FMCSA Hours-of-Service (HOS) rules for the trip, and renders the resulting daily log as an interactive map plus a classic ELD (Electronic Logging Device) log graph.

Backend deployed on Render: `https://spotter-project-b2z4.onrender.com`

## What it does

1. **Geocodes** the current, pickup, and dropoff locations (OpenStreetMap Nominatim).
2. **Calculates driving routes** between them — distance and duration (OSRM).
3. **Simulates HOS compliance** for the full trip, factoring in:
   - Pre-trip inspection and loading/unloading time
   - 30-minute break after 8 hours of continuous driving
   - Fuel stops every 1,000 miles
   - 70-hour/8-day cycle tracking, with an automatic 34-hour restart once the cycle is used up
   - A 10-hour sleep period at the end of the trip
4. **Renders the result**:
   - The route plotted on an interactive Leaflet map, with markers for each stop
   - A canvas-drawn ELD log grid (Off Duty / Sleeper Berth / Driving / On Duty lanes), matching the layout of a real paper driver's log

## Tech Stack

**Backend** — Django + Django REST Framework
- `POST /api/calculate-route/` — takes current/pickup/dropoff locations and cycle hours used, returns route details, waypoints, and a generated HOS log
- Geocoding via OpenStreetMap Nominatim, routing via the OSRM public API

**Frontend** — React + Vite
- `react-leaflet` for the interactive route map
- A `<canvas>`-based renderer for the ELD log graph, drawn to match the standard multi-lane duty-status chart used on paper driver logs

## Running Locally

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

By default the frontend calls the deployed backend URL; point it at `http://localhost:8000` in `App.jsx` to use your local backend instead.
