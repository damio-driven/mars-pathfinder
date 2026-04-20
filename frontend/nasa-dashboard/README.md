# NASA Space Dashboard

Progetto Angular 17+ per il NASA Space Dashboard - Frontend.

## Prerequisiti

- Node.js 18+ 
- npm 9+

## Installazione

```bash
npm install
```

## Sviluppo

```bash
npm start
```

Il server sarà disponibile su http://localhost:4200

## Build

```bash
npm run build
```

## Struttura

```
src/app/
├── core/
│   ├── services/
│   │   └── nasa-api.service.ts
│   └── models/
│       ├── apod.model.ts
│       ├── neo.model.ts
│       └── mars-photo.model.ts
├── features/
│   ├── apod/
│   │   ├── apod-hero/
│   │   └── apod-gallery/
│   ├── asteroid-radar/
│   │   └── asteroid-radar/
│   └── mars-explorer/
│       └── mars-explorer/
├── shared/
│   ├── components/
│   │   ├── nav-bar/
│   │   └── star-background/
│   └── directives/
│       └── parallax.directive.ts
```

## Design System

Il progetto utilizza il design system "spazio profondo" con colori definiti in `src/styles.scss`:

- Sfondo profondo: `#0a0e1a`
- Accento ciano: `#00d4ff`
- Accento arancio: `#ff6b35`
- Testo primario: `#e8eaf6`

## Note

- Il backend .NET deve essere attivo su http://localhost:5000
- La chiave NASA API va configurata in `src/environments/environment.ts`
