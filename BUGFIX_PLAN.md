# Mars Pathfinder — Piano di Correzione Bugs

## Riepilogo Bugs Trovati

### 🔴 Backend — Bugs Critici

| # | File | Bug | Impatto |
|---|-----|-----|---------|
| B1 | `appsettings.json` | DEMO_KEY in production — NASA rate limit = 1 req/or → tutte le API falliscono | Quasi tutti i dati tornano null |
| B2 | `appsettings.Development.json` | API key personale esposta nel repo | Security risk |
| B3 | `NeoController.cs` | Default: `today → today+7` quando mancano entrambi, `today → today` quando ne manca uno — incoerente | Date sbagliate per NEOs |
| B4 | `NasaApiService.cs` | HttpClient senza timeout — si blocca se NASA non risponde | Timeout infiniti |

### 🔴 Frontend — Bugs Critici

| # | File | Bug | Impatto |
|---|-----|-----|---------|
| F1 | `mars-explorer.component.ts` | Default sol=2000, maxSol=3000 — Nessun dato reale su quell'intervallo | Galleria vuota |
| F2 | `nasa-api.service.ts` | page=1 invece di page=0 (NASA API è 0-indexed) | Salta prima pagina foto |
| F3 | `apod-gallery.component.ts` | getApod() senza `count` — chiama `/api/apod` senza `?count=10` | Galleria mostra 1 item |
| F4 | `apod-gallery.component.ts` | `getThumbnailUrl` toglie `https://` → URL rovinati | Tutte le thumbnail rotte |
| F5 | `apod-gallery.component.ts` | `[class.active]="apod.url === apod?.url"` — confronto con se stesso | Card sempre active |
| F6 | `asteroid-radar.component.ts` | Canvas non animato: manca AfterViewInit, nessun ngAfterViewInit che avvia loop | Radar statico |
| F7 | `asteroid-radar.component.ts` | Doppio @ViewChild (#canvas + #canvasElement) ma nel template sono #canvas e #radarCanvas | Canvas null |

### 🟡 Frontend — Bugs Moderati

| # | File | Bug |
|---|-----|-----|
| F8 | `apod-hero.component.ts` | Nessun `<video>` tag — APOD videos non visualizzabili |
| F9 | `apod-hero.component.ts` | MediaType fallback hardcoded `"image"` — se URL è .mp4, `<img>` fallisce |
| F10 | `mars-explorer.component.ts` | Error handler vuoto — errori silenziosi |
| F11 | `mars-explorer.component.html` | Typo "Distanza di missio" → "avvicinamento" |
| F12 | `mars-explorer.component.ts` | Camere hardcodate — non reali per setiap rover |
| F13 | `nasa-api.service.ts` | Nessuna retry/error logging su HttpClient |

### 🟡 Backend — Bugs Moderati

| # | File | Bug |
|---|-----|-----|
| B5 | `ImagesController.cs` | Duplicazione con `MarsController.GetPhoto` |

---

## Piano di Correzione

### Fase 1 — Backend

#### 1.1 appsettings — Spostare API key su user secrets
- Modificare `appsettings.json` per usare DEMO_KEY come fallback sicuro
- Aggiungere un warning in `Program.cs` se DEMO_KEY è attivo
- Istruzioni nel file per l'uso di user secrets

#### 1.2 NeoController — Fix default date range
- Quando entrambi null: `startDate=today, endDate=today+1`
- Quando solo uno null: same logic coerente

#### 1.3 HttpClient timeout
- Aggiungere `HttpClient.Timeout = TimeSpan.FromSeconds(30)` in `NasaApiService`

#### 1.4 Consolidare image proxy
- Rimuovere `/api/mars/photo` da `MarsController`
- Usare `/api/images/proxy` ovunque (già disponibile)
- Aggiornare proxy URL nei dati Mars foto → `/api/images/proxy?url=...`

### Fase 2 — Frontend Critici

#### 2.1 MarsExplorerComponent — Default sol e maxSol
- `selectedSol = 0` (inizia dal primo sol di Curiosity)
- `maxSol = 4500` (dato reale Curiosity ~sol 4500+)
- Quando rover cambia, resettare sol al max possibile

#### 2.2 NasaApiService — page=0
- Cambiare `page` da `'1'` a `'0'` in `getMarsPhotos()`

#### 2.3 getApodGallery — Endpoint batch
- Aggiungere `getApodGallery(count: number = 10)` → `GET /api/apod?count=N`
- Aggiungere `ApodDto[]` return type (già supportato dal backend)

#### 2.4 ApodGalleryComponent — 3 fix
a) Usare `getApodGallery(10)` invece di `getApod()`
b) `getThumbnailUrl`: restituire `apod.url` direttamente (non togliere protocollo)
c) `[class.active]`: confrontare con `currentApodUrl` o `selectedApodId`

#### 2.5 MarsExplorerComponent — imgSrc proxy fix
- Il backend trasforma `imgSrc` in `/api/mars/photo?url=...`
- Cambiare in `/api/images/proxy?url=...` (proxy consolidato)

#### 2.6 AsteroidRadarComponent — AfterViewInit
- Implementare `AfterViewInit`
- **Rimuovere** `@ViewChild('canvasElement')` — tenere solo `@ViewChild('canvas')`
- In `ngAfterViewInit`: call `renderRadar()`
- In `loadAsteroids`: call `calculatePositions()` e poi `renderRadar()`

### Fase 3 — Frontend Moderati

#### 3.1 ApodHeroComponent — <video> tag
- Aggiungere `<video *ngIf="apod?.mediaType === 'video'">` con `controls`, `autoplay`, `muted`
- Se `mediaType === 'image'`, mostrare `<img>` con placeholder SVG su errore
- Gestione error su `<img>` con `(error)` → mostra placeholder

#### 3.2 MarsExplorerComponent — Error handler
- In `loadPhotos()`, cambiare `error: () => { this.loading = false; }` → 
  `error: (err) => { this.error = 'Errore nel caricamento foto. Riprova.'; this.loading = false; }`

#### 3.3 Per-rover camera mapping
- Creare mappa fissa: `{ curiosity: ['MAHLI', 'MAST', 'CHEMCAM', 'RHAZ', 'FHAZ'], perseverance: ['MAHLI', 'MEDA', 'MARDI', 'NavCam'], spirit: ['PANCAM', 'MINISTRY'], opportunity: ['PANCAM', 'MINISTRY'] }`

#### 3.4 NasaApiService — Error logging + retry
- Aggiungere error logging in ogni metodo (console.warn o via injected logger)
- Retry 2 volte su 5xx con delay di 500ms

#### 3.5 Typo fix
- `apod-hero.component.html`: nessuna modifica (typos in asteroid-radar)
- `asteroid-radar.component.html`: "Distanza di missio" → "Distanza di avvicinamento"

#### 3.6 ParallaxDirective
- Rimuovere o implementare parallax semplice (CSS `transform: translateX` su scroll)

### Fase 4 — Build & Verifica

4.1. Build backend: `dotnet build`
4.2. Build frontend: `npm run build`
4.3. Testare manualmente ogni endpoint API
4.4. Testare ogni pagina frontend:
   - `/apod` — APOD hero con img/video, navigazione
   - `/apod/gallery` — Griglia con 10 immagini
   - `/asteroids` — Radar animato + lista
   - `/mars` — Galleria rover con dati reali

## Ordine Esecuzione

1. Fase 1 (Backend) → 2. Fase 2 (Frontend critici) → 3. Fase 3 (Frontend moderati) → 4. Fase 4 (Build & Test)
