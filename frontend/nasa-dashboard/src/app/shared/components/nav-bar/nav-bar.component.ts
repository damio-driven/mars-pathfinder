import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
    selector: 'app-nav-bar',
    imports: [RouterLink, RouterLinkActive],
    template: `
    <header class="navbar" role="navigation" aria-label="Main navigation">
      <div class="navbar-container">
        <a class="navbar-logo" routerLink="/" [routerLinkActive]="'active'">
          <svg class="nasa-logo" aria-label="NASA Logo" viewBox="0 0 180 45">
            <text x="8" y="30" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white">
              NASA
            </text>
            <text x="63" y="30" font-family="Arial, sans-serif" font-size="16" font-weight="normal" fill="var(--accent-cyan)">
              Space Dashboard
            </text>
          </svg>
        </a>
        <nav class="navbar-links">
          <a
            class="nav-link {{ isActive === '/apod' ? 'active' : '' }}"
            routerLink="/apod"
            [routerLinkActive]="'active'"
            role="button"
            tabindex="0"
          >
            <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
              <path d="M12 3v18M3 12h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span>APOD</span>
          </a>
          <a
            class="nav-link {{ isActive === '/asteroids' ? 'active' : '' }}"
            routerLink="/asteroids"
            [routerLinkActive]="'active'"
            role="button"
            tabindex="0"
          >
            <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
              <ellipse cx="12" cy="5" rx="8" ry="3" stroke="currentColor" stroke-width="2"/>
              <ellipse cx="12" cy="22" rx="8" ry="3" stroke="currentColor" stroke-width="2"/>
              <path d="M12 8v8M5 15l5-2 5 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span>Asteroids</span>
          </a>
          <a
            class="nav-link {{ isActive === '/mars' ? 'active' : '' }}"
            routerLink="/mars"
            [routerLinkActive]="'active'"
            role="button"
            tabindex="0"
          >
            <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="2"/>
              <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span>Mars</span>
          </a>
        </nav>
        <div class="navbar-indicator" [class.active]="'active'">
          <div class="indicator-bar"></div>
        </div>
      </div>
    </header>
  `,
    styles: [
        `
      .navbar {
        display: flex;
        align-items: center;
        padding: 12px 24px;
        background: rgba(10, 14, 26, 0.95);
        backdrop-filter: blur(10px);
        border-bottom: 1px solid var(--border-subtle);
        position: sticky;
        top: 0;
        z-index: 100;
      }

      .navbar-container {
        display: flex;
        align-items: center;
        gap: 40px;
        max-width: 1200px;
        width: 100%;
      }

      .navbar-logo {
        display: flex;
        align-items: center;
        text-decoration: none;
        color: var(--text-primary);
        font-size: 1.25rem;
        flex-shrink: 0;
        transition: color 0.3s ease;
        overflow: visible;

        .nasa-logo text {
          white-space: normal;
          word-wrap: break-word;
        }

        &:hover {
          color: var(--accent-cyan);
        }
      }

      .nasa-logo {
        height: 28px;
      }

      .navbar-links {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .nav-link {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        color: var(--text-secondary);
        text-decoration: none;
        border-radius: 8px;
        font-size: 0.9rem;
        font-weight: 500;
        white-space: nowrap;
        transition: all 0.3s ease;
        position: relative;

        &:hover {
          background: var(--bg-card);
          color: var(--text-primary);
        }

        &.active {
          background: rgba(0, 212, 255, 0.15);
          color: var(--accent-cyan);

          & .nav-icon {
            stroke: var(--accent-cyan);
            filter: drop-shadow(0 0 4px var(--accent-cyan));
          }
        }

        .nav-icon {
          transition: stroke 0.3s ease, filter 0.3s ease;
        }

        span {
          font-weight: 500;
        }
      }

      .navbar-indicator {
        flex-shrink: 0;
        width: 4px;
        height: 32px;
        background: var(--bg-card);
        border-radius: 2px;
        overflow: hidden;
        margin-left: 12px;

        &.active {
          background: var(--accent-cyan);

          .indicator-bar {
            height: 100%;
            width: 100%;
            background: var(--accent-cyan);
            border-radius: 2px;
            animation: slide 0.4s ease-in-out;
          }
        }
      }

      @keyframes slide {
        0% { transform: translateY(-100%); }
        100% { transform: translateY(0); }
      }

      @media (max-width: 768px) {
        .navbar {
          padding: 8px 16px;
        }

        .navbar-logo {
          display: none;
        }

        .navbar-links {
          gap: 4px;

          .nav-link {
            padding: 6px 12px;
            font-size: 0.8rem;

            span {
              display: none;
            }
          }
        }
      }
    `
    ]
})
export class NavBarComponent {
  isActive: string = '/apod';

  constructor(private router: Router) {
    this.router.events.subscribe(() => {
      this.isActive = this.router.url;
    });
  }
}
