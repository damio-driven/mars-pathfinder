# NASA Space Dashboard — Istruzioni per Claude Code

## Obiettivo
Costruire una web app visivamente spettacolare che consuma le NASA Open APIs.
Stack: .NET 8 Web API (backend proxy) + Angular 17+ (frontend standalone components).

## Struttura del progetto
```
nasa-space-dashboard/
├── backend/                  # .NET 8 Web API
│   └── NasaSpaceDashboard.Api/
└── frontend/                 # Angular 17+
    └── nasa-dashboard/
```

---

## BACKEND — .NET 8 Web API

### Setup
```bash
cd backend
dotnet new webapi -n NasaSpaceDashboard.Api --framework net8.0
cd NasaSpaceDashboard.Api
dotnet add package Microsoft.Extensions.Caching.Memory
```

### Configurazione (appsettings.json)
Aggiungere:
```json
{
  "NasaApi": {
    "BaseUrl": "https://api.nasa.gov",
    "ApiKey": "DEMO_KEY"
  }
}
```
> L'utente sostituirà DEMO_KEY con la propria chiave da https://api.nasa.gov/

### Endpoints da implementare

**1. APOD Controller** — `GET /api/apod`
- Query params: `date` (opzionale, YYYY-MM-DD), `count` (opzionale, per galleria random)
- Chiama: `https://api.nasa.gov/planetary/apod?api_key={key}&date={date}`
- Cache: 1 ora (stessa foto per tutta la giornata)
- Response DTO:
```csharp
public record ApodDto(string Title, string Date, string Explanation, 
                      string Url, string HdUrl, string MediaType, string Copyright);
```

**2. NEO Controller** — `GET /api/neo`
- Query params: `startDate`, `endDate` (range max 7 giorni)
- Chiama: `https://api.nasa.gov/neo/rest/v1/feed?start_date={}&end_date={}&api_key={key}`
- Response DTO (lista appiattita):
```csharp
public record NeoDto(string Id, string Name, bool IsPotentiallyHazardous,
                     double DiameterMinKm, double DiameterMaxKm,
                     double MissDistanceKm, double RelativeVelocityKmH,
                     string CloseApproachDate);
```

**3. Mars Rover Controller** — `GET /api/mars`
- Query params: `rover` (curiosity|opportunity|spirit|perseverance), `sol`, `camera` (opzionale), `page`
- Chiama: `https://api.nasa.gov/mars-photos/api/v1/rovers/{rover}/photos?sol={sol}&camera={cam}&page={page}&api_key={key}`
- Cache: 30 minuti
- Response DTO:
```csharp
public record MarsPhotoDto(int Id, string ImgSrc, string CameraFullName,
                           string CameraAbbreviation, string RoverName,
                           string EarthDate, int Sol);
```

### Servizi
Creare `NasaApiService` con `HttpClient` (registrato con `AddHttpClient`).
Usare `IMemoryCache` per la cache.
Aggiungere CORS per `http://localhost:4200`.

### Program.cs essenziale
```csharp
builder.Services.AddMemoryCache();
builder.Services.AddHttpClient<NasaApiService>();
builder.Services.AddCors(o => o.AddPolicy("Angular", p => 
    p.WithOrigins("http://localhost:4200").AllowAnyMethod().AllowAnyHeader()));
// ...
app.UseCors("Angular");
```

---

## FRONTEND — Angular 17+

### Setup
```bash
cd frontend
ng new nasa-dashboard --standalone --routing --style=scss
cd nasa-dashboard
npm install three @types/three
npm install d3 @types/d3
npm install @angular/animations
```

### Struttura componenti
```
src/app/
├── core/
│   ├── services/
│   │   ├── nasa-api.service.ts       # HTTP calls al backend .NET
│   │   └── theme.service.ts
│   └── models/
│       ├── apod.model.ts
│       ├── neo.model.ts
│       └── mars-photo.model.ts
├── features/
│   ├── apod/
│   │   ├── apod-hero/                # Immagine del giorno full-screen
│   │   └── apod-gallery/             # Griglia storica APOD
│   ├── asteroid-radar/
│   │   ├── radar-canvas/             # Visualizzazione canvas 2D tipo radar
│   │   └── asteroid-list/            # Lista con badge pericolosità
│   └── mars-explorer/
│       ├── rover-selector/           # Selezione rover e sol
│       └── photo-grid/               # Griglia foto con lightbox
├── shared/
│   ├── components/
│   │   ├── nav-bar/
│   │   ├── loading-spinner/
│   │   └── star-background/          # Canvas con stelle animate
│   └── directives/
│       └── parallax.directive.ts
└── app.routes.ts
```

### Design System — OBBLIGATORIO
**Tema**: spazio profondo — sfondo quasi nero, accenti neon/cyan/arancio
```scss
// styles.scss - variabili globali
:root {
  --bg-deep: #0a0e1a;
  --bg-card: #0f1629;
  --bg-card-hover: #161d35;
  --accent-cyan: #00d4ff;
  --accent-orange: #ff6b35;
  --accent-purple: #7c3aed;
  --text-primary: #e8eaf6;
  --text-secondary: #8892b0;
  --danger-red: #ff4444;
  --safe-green: #00ff88;
  --border-subtle: rgba(0, 212, 255, 0.15);
}

* { box-sizing: border-box; }
body { 
  background: var(--bg-deep); 
  color: var(--text-primary);
  font-family: 'Inter', 'Segoe UI', sans-serif;
  margin: 0;
}
```

### Routing
```typescript
// app.routes.ts
export const routes: Routes = [
  { path: '', redirectTo: 'apod', pathMatch: 'full' },
  { path: 'apod', loadComponent: () => import('./features/apod/apod.component') },
  { path: 'asteroids', loadComponent: () => import('./features/asteroid-radar/asteroid-radar.component') },
  { path: 'mars', loadComponent: () => import('./features/mars-explorer/mars-explorer.component') },
];
```

---

## FEATURE 1: APOD Theater

### apod-hero component
Layout full-viewport con:
- Immagine/video di sfondo che occupa l'intero schermo con overlay gradient scuro in basso
- Titolo grande in basso a sinistra con animazione fade-in-up
- Data e copyright in piccolo
- Bottone "HD" che apre l'immagine originale in nuova tab
- "Explanation" panel che scorre dal basso con click/tap
- Frecce per navigare ai giorni precedenti/successivi

### apod-gallery component  
- Griglia CSS (auto-fill, minmax 250px) di card APOD
- Ogni card: immagine thumbnail, data, titolo
- Infinite scroll o paginazione
- Click su card → mostra l'APOD di quel giorno nell'hero

---

## FEATURE 2: Asteroid Radar

### Concept visivo
Un canvas 2D che simula un radar rotante:
- Centro = Terra (icona/cerchio blu)
- Anelli concentrici = distanze (1 LD, 10 LD, 50 LD — Lunar Distance)
- Ogni asteroide = punto colorato in base alla pericolosità:
  - Rosso brillante + glow = potentially hazardous
  - Cyan = sicuro
  - Arancio = attenzione
- Dimensione del punto proporzionale al diametro stimato
- Sweep line rotante (effetto radar classico)
- Hover sul punto → tooltip con nome, distanza, velocità, diametro
- Click → pannello laterale con dettagli completi

### radar-canvas component
Usare `<canvas>` con `requestAnimationFrame` per il sweep.
Calcolare posizione X/Y degli asteroidi mappando la miss distance a raggio sul canvas.

### asteroid-list component
Lista laterale con:
- Badge "HAZARDOUS" rosso lampeggiante per i pericolosi
- Barra di distanza visuale
- Sort per distanza/dimensione/pericolosità
- Date range picker per cambiare il periodo

---

## FEATURE 3: Mars Explorer

### rover-selector component
- 4 card rover con foto/icona, nome, status (active/complete)
- Slider per il SOL (giorno marziano) con preview del range disponibile
- Dropdown camera: FHAZ, RHAZ, MAST, CHEMCAM, MAHLI, MARDI, NAVCAM, etc.

### photo-grid component
- Griglia masonry-style delle foto Mars
- Ogni foto: overlay con camera name e sol
- Click → lightbox full-screen con navigazione prev/next
- Effetto hover: scala + reveal info panel
- Lazy loading delle immagini con placeholder shimmer

---

## Navbar

Componente sticky con:
- Logo NASA (SVG) + "Space Dashboard"  
- Link alle 3 sezioni con icone
- Indicatore sezione attiva con underline animato cyan
- Su mobile: hamburger menu

---

## Star Background (shared)

Canvas con stelle animate in sottofondo su tutte le pagine:
```typescript
// Genera N stelle casuali, le anima con parallax leggero
// Layer multipli per effetto profondità (stelle vicine più grandi e veloci)
// Performance: usa requestAnimationFrame, cancella su destroy
```

---

## Note implementative importanti

1. **API Key**: mai committare la chiave reale. Usare `appsettings.Development.json` (già in .gitignore di dotnet).
2. **Error handling**: ogni chiamata NASA può fallire (rate limit con DEMO_KEY). Mostrare stato di errore elegante.
3. **Loading states**: skeleton loader per ogni sezione, non spinner generici.
4. **Responsive**: la app deve funzionare su mobile. Il radar si ridimensiona col canvas.
5. **Performance**: le foto Mars sono tante — paginare a 25 elementi, lazy load immagini.
6. **DEMO_KEY limits**: 30 req/ora, 50/giorno per IP. Il backend con cache riduce drasticamente le chiamate.

---

## Comandi di avvio

```bash
# Backend
cd backend/NasaSpaceDashboard.Api
dotnet run
# → http://localhost:5000

# Frontend  
cd frontend/nasa-dashboard
ng serve
# → http://localhost:4200
```

---

## Ordine di sviluppo consigliato

1. Setup backend (.NET project + NasaApiService + 3 controller)
2. Verifica endpoint con Swagger/curl
3. Setup Angular + routing + theme/variables
4. Star background + navbar
5. Feature APOD (hero + gallery)
6. Feature Asteroid Radar (canvas + lista)
7. Feature Mars Explorer (selector + grid + lightbox)
8. Polish: animazioni, transizioni di route, responsive

