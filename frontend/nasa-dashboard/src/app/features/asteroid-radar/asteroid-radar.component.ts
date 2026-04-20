import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NasaApiService } from '../../core/services/nasa-api.service';
import { NeoDto } from '../../core/models/neo.model';

@Component({
  selector: 'app-asteroid-radar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="asteroid-radar-container">
      <header class="radar-header">
        <h1>Radar degli Asteroidi</h1>
        <p class="radar-description">Monitoraggio degli asteroidi in avvicinamento alla Terra</p>
      </header>

      <div class="radar-controls">
        <div class="date-range">
          <label for="startDate">Data inizio:</label>
          <input type="date" id="startDate" [(ngModel)]="startDate" [min]="today" [max]="datePlusDays(today, 7)">
        </div>
        <div class="date-range">
          <label for="endDate">Data fine:</label>
          <input type="date" id="endDate" [(ngModel)]="endDate" [min]="startDate" [max]="datePlusDays(today, 7)">
        </div>
        <button (click)="loadAsteroids()" class="btn-secondary" [disabled]="loading">
          {{ loading ? 'Caricamento...' : 'Aggiorna' }}
        </button>
      </div>

      <div class="radar-layout">
        <div class="radar-section">
          <div class="radar-canvas-wrapper">
            <canvas #canvas></canvas>
          </div>
          <div class="legend">
            <div class="legend-item">
              <div class="dot safe"></div>
              <span>Safe (Sicuro)</span>
            </div>
            <div class="legend-item">
              <div class="dot warning"></div>
              <span>Warning (Attenzione)</span>
            </div>
            <div class="legend-item">
              <div class="dot dangerous"></div>
              <span>Danger (Pericoloso)</span>
            </div>
          </div>
        </div>

        <div class="asteroid-list-section">
          <div class="list-header">
            <h2>Lista Asteroidi</h2>
            <span class="count">{{ asteroids.length }}</span>
          </div>

          <div class="asteroid-list">
            <div
              *ngFor="let asteroid of asteroids"
              (click)="selectAsteroid(asteroid)"
              (mouseenter)="onHover($event, asteroid)"
              (mouseleave)="onLeave()"
              class="asteroid-item"
              [class.active]="selectedAsteroid?.id === asteroid.id"
              [class.potentially-hazardous]="asteroid.isPotentiallyHazardous">
              <div class="asteroid-icon">
                <svg [attr.aria-label]="'Asteroid icon'" viewBox="0 0 24 24" fill="none">
                  <ellipse cx="12" cy="5" rx="8" ry="3" stroke="currentColor" stroke-width="1.5"/>
                  <ellipse cx="12" cy="22" rx="8" ry="3" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M12 8v8M5 15l5-2 5 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="asteroid-info">
                <h3>{{ asteroid.name }}</h3>
                <div class="asteroid-details">
                  <span class="detail">{{ formatDate(asteroid.closeApproachDate) }}</span>
                  <span class="distance">{{ formatDistance(asteroid.missDistanceKm) }}</span>
                </div>
              </div>
              <div class="asteroid-badge" [class]="'badge-' + getDangerLevel(asteroid)">
                {{ getDangerLevel(asteroid) }}
              </div>
            </div>

            <div *ngIf="asteroids.length === 0" class="list-empty">
              <p>Nessun asteroide rilevato per questo periodo.</p>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="selectedAsteroid" class="asteroid-details-panel">
        <h2>{{ selectedAsteroid.name }}</h2>
        <div class="detail-row">
          <span>ID:</span>
          <span>{{ selectedAsteroid.id }}</span>
        </div>
        <div class="detail-row">
          <span>Diametro stimato:</span>
          <span>{{ formatDiameter(selectedAsteroid) }}</span>
        </div>
        <div class="detail-row">
          <span>Distanza di avvicinamento:</span>
          <span>{{ formatDistance(selectedAsteroid.missDistanceKm) }}</span>
        </div>
        <div class="detail-row">
          <span>Velocità relativa:</span>
          <span>{{ formatVelocity(selectedAsteroid.relativeVelocityKmH) }}</span>
        </div>
        <div class="detail-row">
          <span>Data di avvicinamento:</span>
          <span>{{ formatDate(selectedAsteroid.closeApproachDate) }}</span>
        </div>
        <div class="detail-row">
          <span>Pericoloso:</span>
          <span [class]="'badge-' + (selectedAsteroid.isPotentiallyHazardous ? 'dangerous' : 'safe')">
            {{ selectedAsteroid.isPotentiallyHazardous ? 'SI' : 'NO' }}
          </span>
        </div>
      </div>

      <div *ngIf="error" class="error-message">
        {{ error }}
        <button (click)="loadAsteroids()" class="btn-secondary">Riprova</button>
      </div>
    </div>
  `,
  styles: [
    `
      .asteroid-radar-container {
        padding: 24px;
        max-width: 1600px;
        margin: 0 auto;
      }

      .radar-header {
        text-align: center;
        margin-bottom: 24px;
      }

      .radar-header h1 {
        font-size: 2rem;
        margin: 0 0 8px 0;
        color: var(--text-primary);
      }

      .radar-description {
        color: var(--text-secondary);
        margin: 0;
        font-size: 1rem;
      }

      .radar-controls {
        display: flex;
        gap: 16px;
        align-items: flex-end;
        margin-bottom: 24px;
        background: var(--bg-card);
        padding: 16px;
        border-radius: 12px;
        border: 1px solid var(--border-subtle);
        flex-wrap: wrap;
      }

      .date-range {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .date-range label {
        font-size: 0.85rem;
        color: var(--text-secondary);
      }

      .date-range input {
        background: var(--bg-deep);
        border: 1px solid var(--border-subtle);
        color: var(--text-primary);
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 0.9rem;
      }

      .btn-secondary {
        background: var(--accent-cyan);
        border: none;
        color: var(--bg-deep);
        padding: 10px 24px;
        border-radius: 8px;
        font-size: 0.9rem;
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

      .radar-layout {
        display: grid;
        grid-template-columns: 1fr 320px;
        gap: 24px;
      }

      .radar-section {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .radar-canvas-wrapper {
        background: var(--bg-card);
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid var(--border-subtle);
        height: 500px;
      }

      canvas {
        width: 100%;
        height: 100%;
        display: block;
      }

      .legend {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 16px;
        background: var(--bg-card);
        border-radius: 12px;
        border: 1px solid var(--border-subtle);

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: var(--text-secondary);

          .dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
          }

          .dot.safe {
            background: var(--safe-green);
          }

          .dot.warning {
            background: var(--accent-orange);
          }

          .dot.dangerous {
            background: var(--danger-red);
          }
        }
      }

      .asteroid-list-section {
        display: flex;
        flex-direction: column;
      }

      .list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .list-header h2 {
        font-size: 1.2rem;
        margin: 0;
        color: var(--text-primary);
      }

      .count {
        background: var(--accent-cyan);
        color: var(--bg-deep);
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 600;
      }

      .asteroid-list {
        flex: 1;
        overflow-y: auto;
        border: 1px solid var(--border-subtle);
        border-radius: 12px;
        background: var(--bg-card);
      }

      .asteroid-item {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid var(--border-subtle);
        cursor: pointer;
        transition: all 0.3s ease;
        gap: 12px;

        &:hover {
          background: var(--bg-card-hover);
        }

        &.active {
          background: var(--bg-card-hover);
        }

        &.potentially-hazardous:hover,
        &.potentially-hazardous.active {
          background: rgba(255, 68, 68, 0.1);
        }

        &:last-child {
          border-bottom: none;
        }

        .asteroid-icon {
          flex-shrink: 0;
          color: var(--text-secondary);

          svg {
            width: 24px;
            height: 24px;
          }
        }

        .asteroid-info {
          flex: 1;
          min-width: 0;

          h3 {
            margin: 0 0 4px 0;
            font-size: 0.95rem;
            color: var(--text-primary);
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .asteroid-details {
            display: flex;
            gap: 12px;
            font-size: 0.8rem;
            color: var(--text-secondary);

            .detail {
              color: var(--accent-cyan);
            }

            .distance {
              color: var(--text-secondary);
            }
          }
        }

        .asteroid-badge {
          font-size: 0.7rem;
          padding: 4px 8px;
          border-radius: 4px;
          text-transform: uppercase;
          font-weight: bold;
          white-space: nowrap;
        }

        .badge-dangerous {
          background: var(--danger-red);
          color: white;
        }

        .badge-warning {
          background: var(--accent-orange);
          color: white;
        }

        .badge-safe {
          background: var(--safe-green);
          color: #000;
        }
      }

      .list-empty {
        padding: 32px;
        text-align: center;
        color: var(--text-secondary);
      }

      .asteroid-details-panel {
        background: var(--bg-card);
        border-radius: 12px;
        padding: 24px;
        border: 1px solid var(--border-subtle);
      }

      .asteroid-details-panel h2 {
        margin: 0 0 16px 0;
        color: var(--text-primary);
        font-size: 1.2rem;
      }

      .detail-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 12px;
        font-size: 0.9rem;

        &:last-child {
          margin-bottom: 0;
        }

        span:first-child {
          color: var(--text-secondary);
        }

        span:last-child {
          color: var(--text-primary);
        }
      }

      .badge-dangerous {
        background: var(--danger-red);
        color: white;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: bold;
      }

      .badge-safe {
        background: var(--safe-green);
        color: #000;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: bold;
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

      @media (max-width: 1024px) {
        .radar-layout {
          grid-template-columns: 1fr;
        }

        .asteroid-list-section {
          max-height: 400px;
        }
      }
    `
  ]
})
export class AsteroidRadarComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  get canvas(): ElementRef<HTMLCanvasElement> | null {
    return this.canvasRef ? { nativeElement: this.canvasRef.nativeElement } : null;
  }

  asteroids: NeoDto[] = [];
  selectedAsteroid: NeoDto | null = null;
  loading: boolean = true;
  error: string | null = null;
  today: string = new Date().toISOString().split('T')[0];
  startDate: string = this.today;
  endDate: string = new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0];
  animationFrameId: number | null = null;
  sweepAngle: number = 0;
  asteroidPositions: Map<string, { x: number; y: number }> = new Map();
  startedAnimationLoop = false;

  constructor(
    private nasaApi: NasaApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAsteroids();
  }

  ngAfterViewInit(): void {
    this.calculatePositions();
    this.renderRadar();
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  loadAsteroids(): void {
    this.loading = true;
    this.error = null;
    this.asteroids = [];
    this.asteroidPositions = new Map();

    this.nasaApi.getNeos(this.startDate, this.endDate).subscribe({
      next: (data) => {
        this.asteroids = data;
        this.calculatePositions();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Errore nel caricamento degli asteroidi.';
        this.loading = false;
      }
    });
  }

  calculatePositions(): void {
    const maxDistance = 2500000;
    const minRadius = 50;
    const maxRadius = 300;

    this.asteroidPositions.clear();

    this.asteroids.forEach(asteroid => {
      const normalizedDistance = asteroid.missDistanceKm / maxDistance;
      const radius = minRadius + (1 - normalizedDistance) * (maxRadius - minRadius);
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      this.asteroidPositions.set(asteroid.id, { x, y });
    });
  }

  renderRadar(): void {
    const canvas = this.canvas?.nativeElement;
    const ctx = canvas?.getContext('2d');

    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    this.drawEarth(ctx, centerX, centerY);

    const radii = [50, 100, 200, 350, 500];

    radii.forEach((radius, index) => {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = index % 2 === 0 ? 'rgba(0, 212, 255, 0.1)' : 'rgba(0, 212, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    const endX = centerX + Math.cos(this.sweepAngle * Math.PI / 180) * 350;
    const endY = centerY + Math.sin(this.sweepAngle * Math.PI / 180) * 350;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();

    this.asteroidPositions.forEach((pos, id) => {
      const asteroid = this.asteroids.find(a => a.id === id);
      if (asteroid) {
        const radius = Math.sqrt(asteroid.missDistanceKm / 50000);
        const opacity = asteroid.isPotentiallyHazardous ? 0.8 : 0.5;

        ctx.beginPath();
        ctx.arc(pos.x + centerX, pos.y + centerY, Math.min(radius, 8), 0, Math.PI * 2);
        ctx.fillStyle = asteroid.isPotentiallyHazardous ? 'rgba(255, 68, 68, ' + opacity + ')' : 'rgba(0, 212, 255, ' + opacity + ')';
        ctx.fill();
      }
    });

    this.sweepAngle += 2;
    if (this.sweepAngle >= 360) {
      this.sweepAngle = 0;
    }

    this.animationFrameId = requestAnimationFrame(() => this.renderRadar());
  }

  drawEarth(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.beginPath();
    ctx.arc(x, y, 25, 0, Math.PI * 2);
    ctx.fillStyle = '#1a3a5c';
    ctx.fill();
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0e1a';
    ctx.fill();
  }

  drawRings(ctx: CanvasRenderingContext2D, centerX: number, centerY: number): void {
    const radii = [50, 100, 200, 350, 500];

    radii.forEach((radius, index) => {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = index % 2 === 0 ? 'rgba(0, 212, 255, 0.1)' : 'rgba(0, 212, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }

  drawSweepLine(ctx: CanvasRenderingContext2D, centerX: number, centerY: number): void {
    const endX = centerX + Math.cos(this.sweepAngle * Math.PI / 180) * 350;
    const endY = centerY + Math.sin(this.sweepAngle * Math.PI / 180) * 350;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  drawAsteroid(ctx: CanvasRenderingContext2D, x: number, y: number, asteroid: NeoDto): void {
    const radius = Math.sqrt(asteroid.missDistanceKm / 50000);
    const opacity = asteroid.isPotentiallyHazardous ? 0.8 : 0.5;

    ctx.beginPath();
    ctx.arc(x, y, Math.min(radius, 8), 0, Math.PI * 2);
    ctx.fillStyle = asteroid.isPotentiallyHazardous ? 'rgba(255, 68, 68, ' + opacity + ')' : 'rgba(0, 212, 255, ' + opacity + ')';
    ctx.fill();
  }

  onHover(event: MouseEvent, asteroid: NeoDto): void {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const canvas = this.canvas?.nativeElement;
    const ctx = canvas?.getContext('2d');

    if (canvas && ctx) {
      const canvasRect = canvas.getBoundingClientRect();
      const centerX = canvasRect.width / 2;
      const centerY = canvasRect.height / 2;
      const maxRadius = 350;
      const normalizedDistance = asteroid.missDistanceKm / 2500000;
      const radius = 50 + (1 - normalizedDistance) * (350 - 50);

      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < radius + 10) {
        this.selectAsteroid(asteroid);
      }
    }
  }

  onLeave(): void {
    this.selectedAsteroid = null;
  }

  selectAsteroid(asteroid: NeoDto): void {
    this.selectedAsteroid = asteroid;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDistance(km: number): string {
    const ld = km / 384400;
    return ld >= 1 ? ld.toFixed(2) + ' LD' : km.toFixed(0) + ' km';
  }

  formatVelocity(kmh: number): string {
    return (kmh / 1000).toFixed(1) + ' km/s';
  }

  formatDiameter(asteroid: NeoDto): string {
    const min = asteroid.diameterMinKm * 1000;
    const max = asteroid.diameterMaxKm * 1000;
    return min.toFixed(0) + ' - ' + max.toFixed(0) + ' m';
  }

  getDangerLevel(asteroid: NeoDto): string {
    if (asteroid.isPotentiallyHazardous) return 'dangerous';
    if (asteroid.missDistanceKm < 1000000) return 'warning';
    return 'safe';
  }

  datePlusDays(date: string, days: number): string {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }
}
