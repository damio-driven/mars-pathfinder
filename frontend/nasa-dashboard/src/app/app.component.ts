import { Component } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { NavBarComponent } from './shared/components/nav-bar/nav-bar.component';
import { StarBackgroundComponent } from './shared/components/star-background/star-background.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavBarComponent, StarBackgroundComponent],
  template: `
    <app-nav-bar></app-nav-bar>
    <div class="main-content">
      <div class="content-wrapper">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [
    `
      .app-layout {
        display: flex;
        flex-direction: column;
        height: 100vh;
      }

      nav-bar {
        position: sticky;
        top: 0;
        z-index: 100;
      }

      .main-content {
        flex: 1;
        position: relative;
        overflow-y: auto;
        padding-top: env(safe-area-inset-top);
        padding-bottom: env(safe-area-inset-bottom);
      }

      .content-wrapper {
        position: relative;
        z-index: 1;
        background: var(--bg-deep);
        min-height: calc(100vh - 64px);
      }
    `
  ]
})
export class AppComponent {
  currentRoute: string = '/apod';

  constructor(private router: Router) {
    this.router.events.subscribe(() => {
      this.currentRoute = this.router.url;
    });
  }
}
