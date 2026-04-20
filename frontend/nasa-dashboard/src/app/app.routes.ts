import { Routes } from '@angular/router';
import { ApodHeroComponent } from './features/apod/apod-hero/apod-hero.component';
import { ApodGalleryComponent } from './features/apod/apod-gallery/apod-gallery.component';
import { AsteroidRadarComponent } from './features/asteroid-radar/asteroid-radar.component';
import { MarsExplorerComponent } from './features/mars-explorer/mars-explorer.component';

export const routes: Routes = [
  { path: '', redirectTo: 'apod', pathMatch: 'full' },
  { path: 'apod', component: ApodHeroComponent },
  { path: 'apod/gallery', component: ApodGalleryComponent },
  { path: 'asteroids', component: AsteroidRadarComponent },
  { path: 'mars', component: MarsExplorerComponent },
];
