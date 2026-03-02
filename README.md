# Rekhans GIS — Project Documentation

## **Project Overview**
- **Name:** Rekhans GIS
- **Purpose:** A single-page interactive GIS dashboard for map visualization, measurements (distance & angle), location selection, and station/location comparison. The UI is focused on Leaflet-based mapping with integrated measurement and comparison tools implemented as React components.

## **Features**
- **Interactive Map Display:** Leaflet map with custom overlays and controls.
- **Measurement Tools:** Panels for measuring distances and angles and visualizing results on the map.
- **Selection & Comparison:** Selection guide and location comparison panel to inspect and compare station/location attributes.
- **Modals & Notifications:** Reusable modals and toast messages for user interactions.
- **Pages & Layout:** Dashboard, Analytics, Approvals, Users and Login pages with header, sidebar and status bar.
- **Mock Data Support:** Built-in mock datasets for offline development and prototyping.

## **Components & Tools You Developed (and Actions They Perform)**
This project wraps your developed tools as React components — each component acts as a tool that enables specific actions in the app.

- **Map Orchestration** — `src/components/map/GISMap.jsx` and `src/components/map/LeafletMap.jsx`:
  - Initializes and renders the Leaflet map.
  - Loads and manages map layers, markers and overlays.
  - Listens for map events (click, move, zoom) and propagates them to app state.
  - Action examples: center map on coordinates, add/remove layer, export map view.

- **Selection Guide** — `src/components/map/SelectionGuide.jsx`:
  - Provides an on-map UI for selecting points/areas.
  - Action examples: start selection, confirm selection, cancel selection.

- **Measurement Panels** — `src/components/panels/DistancePanel.jsx`, `src/components/panels/AnglePanel.jsx`:
  - UI for initiating measurements, showing results, and toggling visual aids.
  - Action examples: start distance measure, compute geodesic length, draw measurement overlay, clear measurements.

- **Location Comparison Tool** — `src/components/panels/LocationComparisonPanel.jsx`:
  - Compares attributes of selected stations/locations side-by-side.
  - Action examples: select two stations, compute differences, export comparison report.

- **Modal / Toast Utilities** — `src/components/modals/LocationModal.jsx`, `src/components/layout/Toast.jsx`:
  - Generic UI primitives to display details and transient messages.
  - Action examples: open location details, show success/error messages.

- **Layout & Navigation** — `src/components/layout/Header.jsx`, `src/components/layout/Sidebar.jsx`, `src/components/layout/StatusBar.jsx`:
  - App chrome and navigation, toggling panels and global controls.
  - Action examples: switch active page, toggle sidebar visibility, display app status.

- **API Wrappers** — `src/api/authApi.js`, `src/api/stationsApi.js`:
  - Encapsulate remote HTTP interactions and authentication flows.
  - Action examples: authenticate user, fetch station data, post measurement results.

- **Global State** — `src/context/AppContext.jsx`, `src/context/reducer.js`:
  - Centralized state store for map status, selected features, and UI state.
  - Action examples: dispatch selection change, update selected measurement, persist user prefs.

- **Utility Libraries** — `src/utils/geoUtils.js`, `src/utils/triangleUtils.js`, `src/utils/roleUtils.js`:
  - Shared geospatial helpers (distance calculations, bearing/angle math) and role utilities.
  - Action examples: compute bearing between two coordinates, convert units, validate role permissions.

## **Technology Stack**
- **Frontend Framework:** React (react, react-dom)
- **Map Engine:** Leaflet (map rendering, layers, interactions)
- **Build / Dev:** Vite with `@vitejs/plugin-react` (see `vite.config.js`)
- **Language:** Modern JavaScript (ES Modules)
- **Styling:** Plain CSS (global styles under `src/styles/global.css` and `src/style.css`)
- **Package Manager / Scripts:** npm (see `package.json` — `dev`, `build`, `preview`)

## **Architecture & Data Flow**
- SPA (client-side routing) with a central `AppContext` for state.
- `GISMap` acts as the event hub for map interactions; components dispatch actions to the reducer and subscribe to relevant state.
- API wrappers centralize network calls; during development these can be swapped with mock data from `src/data`.

## **How to Run (Developer)**
1. Install dependencies:

```bash
npm install
```

2. Start dev server (Vite opens at port configured in `vite.config.js`):

```bash
npm run dev
```

3. Build production bundle:

```bash
npm run build
npm run preview
```

## **Files to Inspect First**
- `package.json` — project metadata and scripts.
- `vite.config.js` — dev server and plugin config.
- `src/components/map/GISMap.jsx` — main map orchestration.
- `src/context/AppContext.jsx` and `src/context/reducer.js` — global app state.
- `src/api/stationsApi.js` — example API usage.

## **Developer Workflow & Recommendations**
- Add TypeScript for type safety of geo objects and components.
- Add ESLint + Prettier for code consistency.
- Add unit tests with Jest and React Testing Library for components and utils.
- Add CI (GitHub Actions) to run lint/test/build on pushes.
- Consider lazy-loading heavy map layers to improve initial load times.

## **Suggested Next Steps I Can Help With**
- Generate this README into the repo (done).
- Add ESLint + Prettier configuration and scripts.
- Add a basic GitHub Actions workflow for lint/test/build.
- Migrate selected modules to TypeScript (I can convert `src/utils/geoUtils.js` first).

---
_If you want, I can now add ESLint, Prettier, or a CI workflow — tell me which you'd like next._

## **Tools as Components — Actions & Usage**
This section maps the components you developed to the concrete actions they expose or perform. Use these descriptions to call, wire or extend each tool from other components or from the global `AppContext`.

- **`GISMap` / `LeafletMap`**
  - Purpose: central map orchestration and layer management.
  - Actions: `centerMap(lat,lng,zoom)`, `addLayer(layerId, layerConfig)`, `removeLayer(layerId)`, `exportMapView()`.
  - Usage example (conceptual):

    ```js
    // from a component with access to map ref or context
    mapRef.current.centerMap(12.34, 56.78, 13)
    dispatch({ type: 'MAP_ADD_LAYER', payload: { id: 'heat', config: { /* ... */ } } })
    ```

- **`SelectionGuide`**
  - Purpose: on-map selection UI for points/areas.
  - Actions: `startSelection(mode)`, `confirmSelection()`, `cancelSelection()`.
  - Usage example:

    ```js
    dispatch({ type: 'SELECTION_START', payload: { mode: 'rectangle' } })
    // after user selects
    dispatch({ type: 'SELECTION_CONFIRM', payload: selectedGeometry })
    ```

- **`DistancePanel` / `AnglePanel`**
  - Purpose: start/stop measurement tools and display computed values.
  - Actions: `startDistanceMeasure()`, `clearMeasurements()`, `computeAngle(pointA, pointB, pointC)`.
  - Usage example:

    ```js
    dispatch({ type: 'MEASURE_START', payload: { tool: 'distance' } })
    // result written to context
    const { activeMeasurement } = state
    ```

- **`LocationComparisonPanel`**
  - Purpose: compare and export differences between two or more locations.
  - Actions: `selectForCompare(id)`, `compare(ids)`, `exportComparison(format)`.

- **`LocationModal` / `Toast`**
  - Purpose: show details or transient messages.
  - Actions: `openModal(data)`, `closeModal()`, `showToast(message, {type})`.

- **API wrappers (`authApi`, `stationsApi`)**
  - Purpose: performed network operations.
  - Actions: `authApi.login(credentials)`, `stationsApi.fetchStations(params)`, `stationsApi.postMeasurement(measurement)`.
  - Usage example:

    ```js
    const stations = await stationsApi.fetchStations({ bbox })
    dispatch({ type: 'STATIONS_LOADED', payload: stations })
    ```

- **Utilities (`geoUtils`, `triangleUtils`)**
  - Purpose: low-level geospatial calculations called by components or panels.
  - Actions: `geoUtils.distance(a,b)`, `geoUtils.bearing(a,b)`, `triangleUtils.angle(a,b,c)`.

Notes:
- Where possible, components expose actions by dispatching reducer events (see `src/context/reducer.js`) or by exposing a `ref` (for map methods). Search the reducer for action names to wire new behavior.
- These examples are conceptual; adapt the function names to the actual exports in the codebase when implementing.
