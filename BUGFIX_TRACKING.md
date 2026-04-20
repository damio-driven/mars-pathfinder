# Mars Pathfinder — Tracking Correzioni Bugs

## Legenda
- ✅ = Completato
- 🔧 = In corso
- ⏳ = Da fare
- ❌ = Non necessario / non applicabile

---

## Fase 1 — Backend ✅ COMPLETATA
**Build**: ✅ RIUSCITA (zero errori, zero warning rilevanti)

| # | Task | Stato | Dettagli |
|---|---|-----|----|
| 1.1 | Appsettings — API key safe fallback | ✅ | `appsettings.json`: `"ApiKey": ""` + `RequestTimeoutSeconds: 30`. `appsettings.Development.json`: placeholder `"YOUR_NASA_API_KEY_HERE"` |
| 1.2 | Program.cs — Warning DEMO_KEY | ✅ | Middleware che mostra banner in Swagger quando API key non è configurata |
| 1.3 | HttpClient timeout | ✅ | `NasaApiService` HttpClient con 30s timeout (configurabile) |
| 1.4 | NeoController date range | ✅ | `today → today+1` coerente invece di `today → today+7` |
| 1.5 | Proxy image consolidato | ✅ | `/api/mars/photo` rimosso. Tutti puntano a `/api/images/proxy` |
| 1.6 | EnsureApiKey + logging | ✅ | Warning una tantum su DEMO_KEY in logs |

### File modificati:
- `backend/NasaSpaceDashboard.Api/appsettings.json` — API key vuota, timeout config
- `backend/NasaSpaceDashboard.Api/appsettings.Development.json` — placeholder al posto della key esposta
- `backend/NasaSpaceDashboard.Api/Program.cs` — warning banner + HttpClient timeout
- `backend/NasaSpaceDashboard.Api/Controllers/NeoController.cs` — date range coerente
- `backend/NasaSpaceDashboard.Api/Controllers/MarsController.cs` — proxy URL → `/api/images/proxy`, rimosso endpoint `/api/mars/photo`
- `backend/NasaSpaceDashboard.Api/Services/NasaApiService.cs` — EnsureApiKey() con logging

### Note:
- La chiave personale è stata rimossa da `appsettings.Development.json`
- Per usare tua key: vai su https://api.nasa.gov → registrati → copia in `appsettings.Development.json` o usa `dotnet user-secrets`

---

## Fase 2 — Frontend Critici ✅ COMPLETATA
**Build**: ✅ RIUSCITA (zero errori)

| # | Task | Stato | Dettagli |
|---|---|-----|----|
| 2.1 | MarsExplorerComponent: sol=0, maxSol=4500, error prop | ✅ | Default sol resettato a 0, maxSol a 4500, aggiunto prop error |
| 2.2 | NasaApiService: page=0, retry, error handling | ✅ | page=0, retry(2), catchError con messaggio leggibile |
| 2.3 | getApodGallery endpoint + frontend method | ✅ | Nuovo metodo `getApodGallery(count)` → `?count=N` |
| 2.4 | ApodGallery: thumbnail, endpoint, [class.active] | ✅ | `[class.active]="apod.url === currentApodUrl"` (non più hardcoded), mediaType badge corretto |
| 2.5 | MarsController imgSrc proxy → /api/images/proxy | ✅ | Già fatto in Fase 1 |
| 2.6 | AsteroidRadar: AfterViewInit, canvas init, single @ViewChild | ✅ | ngAfterViewInit → calculatePositions() + renderRadar(), RAF loop funzionante |

### File modificati in questa sessione:
- `frontend/.../apod-gallery/apod-gallery.component.ts` — `[class.active]` corretto, mediaType badge fixed
- `frontend/.../nasa-api.service.ts` — catchError importato, nullish coalescing fixed
- `frontend/.../asteroid-radar/asteroid-radar.component.ts` — startRadar sostituito con calculatePositions() + renderRadar()

---

## Fase 3 — Frontend Moderati ✅ COMPLETATA

| # | Task | Stato | Dettagli |
|---|---|-----|----|
| 3.1 | ApodHero: <video> tag, fallback placeholder | ✅ | `*ngSwitch` sulla mediaType: <img> per image, <video> per video, onMediaError per placeholder fallback |
| 3.2 | MarsExplorer: error handler visibile | ✅ | Error banner in HTML, stile SCSS, messaggio in error callback |
| 3.3 | Per-rover camera mapping | ✅ | `getCamerasForRover()` restituisce camere reali per rover (curiosity: FHAZ/RHAZ/MAST/CHEMCAM/MAHLI, perseverance: NAVCAM/SkyCam/MASTMARDI/Pancam, spirit/opportunity: PANCAM/MINISTRY/RHAZ). Cambio rover resetta cameras. |
| 3.4 | NasaApiService: error logging + retry | ✅ | retry(2) su tutti i metodi, handleError con console.warn |
| 3.5 | Typo "missio" → "avvicinamento" | ✅ | Fixed in template TS inline asteroid-radar |
| 3.6 | ParallaxDirective cleanup | ✅ | Comentato @deprecated, non usato in nessuno template |

---

## Fase 4 — Build & Test

| # | Task | Stato |
|---|---|-
| 4.1 | Build backend | ✅ `dotnet build` — 0 errori |
| 4.2 | Build frontend | ✅ `npm run build` — 0 errori (bundle: 360.83 kB minified) |
| 4.3 | Test manuale ogni pagina | ⏳ |

---

## Riepilogo Sessione — Bugs Corretti

1. **[2.4] ApodGallery** — `[class.active]` era hardcoded `active` su tutte le card → ora `[class.active]="apod.url === currentApodUrl"`
2. **[3.1] ApodHero** — Nessun media rendering condizionale → aggiunto `<video>` tag con `*ngSwitch` su mediaType, `onMediaError()` per placeholder fallback
3. **[3.2] MarsExplorer** — Error handler silenzioso → error banner visibile in HTML + SCSS + messaggio in error callback
4. **[3.5] Typo** — "Distanza di missio" → "Distanza di avvicinamento"
5. **[3.5] Gallery mediaType** — Badge hardcoded `'video'` → corretto `apod.mediaType || 'image'`
6. **[3.5] Null safety** — ApodHero wrapper con `*ngIf="apod"` per null safety
7. **Build fix — catchError** — Import mancante in nasa-api.service.ts aggiunto
8. **Build fix — nullish coalescing** — `||` + `??` mixing fix con parentesi
9. **Build fix — startRadar** — Metodo inesistente → sostituito con calculatePositions() + renderRadar()

**Build status:**
- ✅ Backend: `dotnet build` — 0 errori
- ✅ Frontend: `npm run build` — 0 errori (bundle: 360.83 kB minified)

---

## Remainder Tasks (non critici)

| # | Da fare |
|---|----|
| 3.3 | Per-rover camera mapping (mappa fissa per ogni rover con camere reali) |
| 3.6 | ParallaxDirective cleanup (implementare o rimuovere) |
| 4.3 | Test manuale ogni pagina del frontend |
