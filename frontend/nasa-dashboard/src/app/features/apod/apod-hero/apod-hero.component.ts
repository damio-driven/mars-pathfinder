import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, NgSwitch, NgSwitchCase } from '@angular/common';
import { Router } from '@angular/router';
import { NasaApiService } from '../../../core/services/nasa-api.service';
import { ApodDto } from '../../../core/models/apod.model';

@Component({
  selector: 'app-apod-hero',
  standalone: true,
  imports: [CommonModule, DatePipe, NgSwitch, NgSwitchCase],
  template: `
    <div class="apod-hero">
      <div class="hero-content">
        <div class="hero-header">
          <h1>{{ apod?.title }}</h1>
          <p class="hero-date">{{ formatDate(apod?.date) }}</p>
          <p class="hero-copyright">{{ apod?.copyright }}</p>
        </div>

        <div class="hero-media">
          <div *ngIf="!apod && !loading" class="hero-placeholder">
            <span class="placeholder-icon">🖼️</span>
            <p>Waiting for data...</p>
          </div>
          <ng-container *ngIf="apod" [ngSwitch]="apod.mediaType">
            <ng-container *ngSwitchCase="'image'">
              <img [src]="apod.url"
                   [alt]="apod.title"
                   (error)="onMediaError($event)"
                   class="hero-image">
            </ng-container>
            <ng-container *ngSwitchCase="'video'">
              <video [src]="apod.url"
                     class="hero-video"
                     controls autoplay muted playsinline></video>
              <div class="video-overlay">
                <button (click)="openLink(apod.url)" class="btn-primary">
                  <span>HD</span>
                </button>
              </div>
            </ng-container>
            <div *ngSwitchDefault class="hero-placeholder">
              <span class="placeholder-icon">🖼️</span>
              <p>Unsupported media type</p>
            </div>
          </ng-container>
        </div>

        <div class="hero-actions">
          <button (click)="loadPrevious()" class="btn-secondary" [disabled]="loading">
            &larr; Precedente
          </button>
          <button (click)="loadNext()" class="btn-secondary" [disabled]="loading || isToday()">
            Successivo &rarr;
          </button>
        </div>

        <button (click)="showExplanation()" class="btn-explanation" [disabled]="loading || !apod">
          Mostra Explanation &darr;
        </button>
      </div>

      <div *ngIf="explanationPanel" class="explanation-panel">
        <h3>Explanation</h3>
        <p [innerHTML]="explanationPanel"></p>
      </div>

      <div *ngIf="error" class="error-message">
        {{ error }}
        <button (click)="refresh()" class="btn-secondary">Riprova</button>
      </div>

      <div class="loader-overlay" *ngIf="loading">
        <p class="loader-text">Caricamento immagine...</p>
        <div class="progress-bar-wrapper">
          <div class="progress-bar-fill"></div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      @keyframes progressShimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }

      .loader-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.65);
        z-index: 200;
        backdrop-filter: blur(4px);
        border-radius: 12px;
        gap: 16px;
      }

      .progress-bar-wrapper {
        width: 320px;
        height: 4px;
        background: rgba(255, 255, 255, 0.15);
        border-radius: 4px;
        overflow: hidden;
        position: relative;
      }

      .progress-bar-fill {
        position: absolute;
        inset: 0;
        background: linear-gradient(90deg, var(--accent-cyan), var(--accent-purple), var(--accent-cyan));
        background-size: 200% 100%;
        border-radius: 4px;
        transform: translateX(-100%);
        animation: progressShimmer 1.8s ease-in-out infinite;
      }

      .loader-text {
        color: var(--text-primary);
        font-size: 0.9rem;
        opacity: 0.85;
        margin: 0;
      }

      .apod-hero {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 48px 24px;
        background: linear-gradient(180deg, var(--bg-deep) 0%, var(--bg-card) 100%);
      }

      .hero-content {
        max-width: 1200px;
        width: 100%;
        text-align: center;
      }

      .hero-header h1 {
        font-size: 2.5rem;
        margin: 0 0 8px 0;
        color: var(--text-primary);
      }

      .hero-date {
        font-size: 1.1rem;
        color: var(--accent-cyan);
        margin: 0 0 4px 0;
      }

      .hero-copyright {
        font-size: 0.85rem;
        color: var(--text-secondary);
        margin: 0;
      }

      .hero-media {
        margin: 32px auto;
        max-width: 900px;
        height: 60vh;
        border-radius: 12px;
        overflow: hidden;
        background: var(--bg-card);
        border: 1px solid var(--border-subtle);
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .hero-media img.hero-image {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      .hero-media video.hero-video {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      .video-overlay {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }

      .hero-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        color: var(--text-secondary);
      }

      .hero-placeholder .placeholder-icon {
        font-size: 3rem;
        opacity: 0.5;
      }

      .hero-media:hover .btn-primary::before {
        opacity: 0;
      }

      .hero-actions {
        display: flex;
        justify-content: center;
        gap: 16px;
        margin-top: 24px;
      }

      .btn-secondary {
        background: var(--bg-card);
        border: 1px solid var(--border-subtle);
        color: var(--text-secondary);
        padding: 10px 24px;
        border-radius: 8px;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover:not(:disabled) {
          background: var(--bg-card-hover);
          color: var(--text-primary);
          border-color: var(--accent-cyan);
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      .btn-explanation {
        margin-top: 16px;
        background: var(--accent-cyan);
        border: none;
        color: var(--bg-deep);
        padding: 12px 32px;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover:not(:disabled) {
          background: var(--accent-purple);
          color: white;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      .explanation-panel {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: var(--bg-card);
        border-top: 1px solid var(--border-subtle);
        padding: 24px;
        max-height: 60vh;
        overflow-y: auto;
        z-index: 50;
      }

      .explanation-panel h3 {
        margin: 0 0 12px 0;
        color: var(--accent-cyan);
      }

      .explanation-panel p {
        margin: 0;
        color: var(--text-secondary);
        line-height: 1.6;
      }

      .error-message {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: var(--bg-deep);
        gap: 16px;
      }

      .error-message p {
        color: var(--danger-red);
        font-size: 1.1rem;
        margin: 0;
      }
    `
  ]
})
export class ApodHeroComponent implements OnInit {
  apod: ApodDto | null = null;
  explanationPanel: string | null = null;
  error: string | null = null;
  loading: boolean = true;
  currentDate: string = '';

  constructor(
    private nasaApi: NasaApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const today = new Date();
    this.currentDate = today.toISOString().split('T')[0];
    this.refresh();
  }

  refresh(): void {
    this.loading = true;
    this.error = null;
    this.explanationPanel = null;
    this.currentDate = new Date().toISOString().split('T')[0];

    this.nasaApi.getApod().subscribe({
      next: (apod) => {
        this.apod = apod;
        this.currentDate = apod.date;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Errore nel caricamento dell\'APOD. Riprova più tardi.';
        this.loading = false;
      }
    });
  }

  loadPrevious(): void {
    if (!this.currentDate) return;
    const prevDate = new Date(new Date(this.currentDate).setDate(new Date(this.currentDate).getDate() - 1))
      .toISOString()
      .split('T')[0];
    this.loading = true;
    this.nasaApi.getApod(prevDate).subscribe({
      next: (apod) => {
        this.apod = apod;
        this.currentDate = apod.date;
        this.loading = false;
      }
    });
  }

  loadNext(): void {
    if (!this.currentDate) return;

    // Disable if already on today
    const today = new Date().toISOString().split('T')[0];
    if (this.currentDate === today) return;

    const nextDate = new Date(new Date(this.currentDate).setDate(new Date(this.currentDate).getDate() + 1))
      .toISOString()
      .split('T')[0];

    // Also prevent fetching a future date from frontend side
    if (nextDate > today) {
      return;
    }

    this.loading = true;
    this.nasaApi.getApod(nextDate).subscribe({
      next: (apod) => {
        this.apod = apod;
        this.currentDate = apod.date;
        this.loading = false;
      },
      error: (err) => {
        if (err.status === 400) {
          this.error = err.error?.message || 'Data non valida.';
        } else {
          this.error = 'Errore nel caricamento dell\'APOD. Riprova più tardi.';
        }
        this.loading = false;
      }
    });
  }

  openLink(url: string | undefined): void {
    if (url) {
      window.open(url, '_blank');
    }
  }

  showExplanation(): void {
    if (this.apod) {
      this.explanationPanel = this.apod.explanation;
    }
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  isToday(): boolean {
    if (!this.currentDate) return false;
    const today = new Date().toISOString().split('T')[0];
    return this.currentDate === today;
  }

  onMediaError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const placeholder = img.parentElement?.querySelector('.hero-placeholder') as HTMLElement;
    if (placeholder) placeholder.style.display = 'flex';
  }
}
