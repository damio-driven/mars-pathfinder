import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { NasaApiService } from '../../../core/services/nasa-api.service';
import { ApodDto } from '../../../core/models/apod.model';

@Component({
    selector: 'app-apod-gallery',
    imports: [CommonModule, DatePipe],
    template: `
    <div class="gallery-container">
      <header class="gallery-header">
        <h1>Galleria APOD</h1>
        <p class="gallery-description">Explore a selection of Astronomy Picture of the Day images from the past</p>
      </header>
    
      <div class="gallery-grid" [ngClass]="{ 'loading': loading }">
        @for (apod of apods; track apod; let i = $index) {
          <div
            (click)="viewApod(apod)"
            class="gallery-card"
            [class.active]="apod.url === currentApodUrl"
            [ngClass]="{ 'loading': loading }"
            [style.animation-delay]="i * 60 + 'ms'">
            <div class="card-image-wrapper">
              <img [src]="apod.url || '/assets/placeholder.svg'" [alt]="apod.title" (error)="onImageError($event)" loading="lazy">
              <div class="card-overlay">
                <span class="card-date">{{ apod.date | date:'shortDate' }}</span>
                <span class="card-type">{{ apod.mediaType || 'image' }}</span>
              </div>
            </div>
            <div class="card-info">
              <h3>{{ apod.title }}</h3>
              <p class="card-copyright">{{ apod.copyright }}</p>
            </div>
          </div>
        }
    
        @if (!loading && apods.length === 0) {
          <div class="gallery-empty">
            <p>Nessuna foto disponibile al momento.</p>
          </div>
        }
      </div>
    
      @if (error) {
        <div class="error-message">
          {{ error }}
          <button (click)="refresh()" class="btn-secondary">Riprova</button>
        </div>
      }
    </div>
    `,
    styles: [
        `
      .gallery-container {
        padding: 24px;
        max-width: 1400px;
        margin: 0 auto;
      }

      .gallery-header {
        text-align: center;
        margin-bottom: 32px;
      }

      .gallery-header h1 {
        font-size: 2rem;
        margin: 0 0 8px 0;
        color: var(--text-primary);
      }

      .gallery-description {
        color: var(--text-secondary);
        margin: 0;
        font-size: 1rem;
      }

      .gallery-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 24px;
      }

      .gallery-card {
        cursor: pointer;
        background: var(--bg-card);
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid var(--border-subtle);
        transition: all 0.3s ease;
        opacity: 0;
        transform: translateY(20px);

        &.loading {
          opacity: 0;
          transform: translateY(20px);
        }

        &.active {
          opacity: 1;
          transform: translateY(0);
          box-shadow: 0 8px 32px rgba(0, 212, 255, 0.15);
          border-color: var(--accent-cyan);
        }

        &:hover {
          transform: translateY(-8px);
          box-shadow: 0 8px 32px rgba(0, 212, 255, 0.15);
        }

        &.active:hover {
          transform: translateY(-8px);
        }
      }

      .card-image-wrapper {
        position: relative;
        aspect-ratio: 1 / 1;
        overflow: hidden;
        background: var(--bg-deep);
      }

      .card-image-wrapper img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.5s ease;
      }

      .card-image-wrapper:hover img {
        transform: scale(1.05);
      }

      .card-overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: linear-gradient(0deg, rgba(0, 0, 0, 0.8) 0%, transparent 100%);
      }

      .card-date {
        color: var(--accent-cyan);
        font-size: 0.85rem;
        font-weight: 600;
      }

      .card-type {
        color: var(--text-secondary);
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .card-info {
        padding: 16px;
      }

      .card-info h3 {
        margin: 0 0 8px 0;
        font-size: 1rem;
        color: var(--text-primary);
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .card-copyright {
        margin: 0;
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      .gallery-empty {
        grid-column: 1 / -1;
        text-align: center;
        padding: 64px;
        color: var(--text-secondary);
      }

      .error-message {
        text-align: center;
        padding: 32px;
        background: var(--bg-card);
        border-radius: 12px;
        margin-top: 24px;

        p {
          color: var(--danger-red);
          margin: 0 0 16px 0;
        }
      }
    `
    ]
})
export class ApodGalleryComponent implements OnInit {
  apods: ApodDto[] = [];
  loading: boolean = true;
  error: string | null = null;
  currentApodUrl: string = '';

  constructor(
    private nasaApi: NasaApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading = true;
    this.error = null;
    this.apods = [];
    this.currentApodUrl = '';

    this.nasaApi.getApodGallery(10).subscribe({
      next: (data) => {
        this.apods = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Errore nel caricamento della galleria.';
        this.loading = false;
      }
    });
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/placeholder.svg';
  }

  viewApod(apod: ApodDto): void {
    this.currentApodUrl = apod.url;
    this.router.navigate(['/apod']);
  }
}
