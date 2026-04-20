import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NasaApiService } from '../../core/services/nasa-api.service';
import { MarsPhotoDto } from '../../core/models/mars-photo.model';

@Component({
  selector: 'app-mars-explorer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mars-explorer.component.html',
  styleUrls: ['./mars-explorer.component.scss']
})
export class MarsExplorerComponent implements OnInit, OnDestroy {
  rovers: ({ name: string; icon: string; status: string })[] = [];
  selectedRover: string = 'curiosity';
  selectedSol: number = 0;
  selectedCamera: string = '';
  cameras: string[] = [];
  photos: MarsPhotoDto[] = [];
  photoCount: number = 0;
  loading: boolean = false;
  lightboxOpen: boolean = false;
  lightboxPhoto: MarsPhotoDto | null = null;
  error: string | null = null;
  maxSol: number = 4500;

  constructor(private nasaApi: NasaApiService) {}

  ngOnInit(): void {
    this.rovers = [
      { name: 'curiosity', icon: this.roverIconSvg('curiosity'), status: 'Attivo' },
      { name: 'opportunity', icon: this.roverIconSvg('opportunity'), status: 'Mission completed' },
      { name: 'spirit', icon: this.roverIconSvg('spirit'), status: 'Mission completed' },
      { name: 'perseverance', icon: this.roverIconSvg('perseverance'), status: 'Attivo' }
    ];
    this.loadPhotos();
  }

  ngOnDestroy(): void {}

  getCamerasForRover(rover: string): string[] {
    const camerasPerRover: Record<string, string[]> = {
      curiosity: ['FHAZ', 'RHAZ', 'MAST', 'CHEMCAM', 'MAHLI'],
      perseverance: ['NAVCAM', 'SkyCam', 'MASTMARDI', 'Pancam'],
      spirit: ['PANCAM', 'MINISTRY', 'RHAZ'],
      opportunity: ['PANCAM', 'MINISTRY', 'RHAZ']
    };
    return camerasPerRover[rover] || [];
  }

  roverIconSvg(name: string): string {
    const s = '%23';
    const icons: Record<string, string> = {
      curiosity: `data:image/svg+xml,${s}00d4ff` +
        `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'>` +
        `<circle cx='100' cy='100' r='80' fill='none' stroke='` + s + '00d4ff' + `' stroke-width='3'/><circle cx='100' cy='100' r='55' fill='none' stroke='` + s + '00d4ff' + `' stroke-width='2' opacity='0.5'/><line x1='100' y1='45' x2='100' y2='35' stroke='` + s + 'ff6b35' + `' stroke-width='3' stroke-linecap='round'/><line x1='100' y1='155' x2='100' y2='165' stroke='` + s + 'ff6b35' + `' stroke-width='3' stroke-linecap='round'/><line x1='45' y1='100' x2='35' y2='100' stroke='` + s + 'ff6b35' + `' stroke-width='3' stroke-linecap='round'/><line x1='155' y1='100' x2='165' y2='100' stroke='` + s + 'ff6b35' + `' stroke-width='3' stroke-linecap='round'/><text x='100' y='110' text-anchor='middle' font-family='Arial' font-size='22' font-weight='bold' fill='` + s + '00d4ff' + `'>C</text></svg>`
          ,
      opportunity: `data:image/svg+xml,${s}00ff88` +
        `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'>` +
        `<circle cx='100' cy='100' r='80' fill='none' stroke='` + s + '00ff88' + `' stroke-width='3'/><circle cx='100' cy='100' r='55' fill='none' stroke='` + s + '00ff88' + `' stroke-width='2' opacity='0.5'/><path d='M60 80 Q100 50 140 80' fill='none' stroke='` + s + 'ff6b35' + `' stroke-width='3' stroke-linecap='round'/><path d='M60 120 Q100 150 140 120' fill='none' stroke='` + s + 'ff6b35' + `' stroke-width='3' stroke-linecap='round'/><circle cx='100' cy='100' r='25' fill='none' stroke='` + s + 'ff6b35' + `' stroke-width='2'/><text x='100' y='110' text-anchor='middle' font-family='Arial' font-size='22' font-weight='bold' fill='` + s + '00ff88' + `'>O</text></svg>`
          ,
      spirit: `data:image/svg+xml,${s}00d4ff` +
        `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'>` +
        `<circle cx='100' cy='100' r='80' fill='none' stroke='` + s + '00d4ff' + `' stroke-width='3' stroke-dasharray='8,4'/><circle cx='100' cy='100' r='55' fill='none' stroke='` + s + '8892b0' + `' stroke-width='2' opacity='0.4'/><ellipse cx='100' cy='100' rx='45' ry='30' fill='none' stroke='` + s + 'ff6b35' + `' stroke-width='2.5' transform='rotate(-15 100 100)'/><text x='100' y='108' text-anchor='middle' font-family='Arial' font-size='22' font-weight='bold' fill='` + s + '8892b0' + `'>S</text></svg>`
          ,
      perseverance: `data:image/svg+xml,${s}7c3aed` +
        `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'>` +
        `<circle cx='100' cy='100' r='80' fill='none' stroke='` + s + '7c3aed' + `' stroke-width='3'/><circle cx='100' cy='100' r='55' fill='none' stroke='` + s + '7c3aed' + `' stroke-width='2' opacity='0.5'/><rect x='85' y='75' width='30' height='50' rx='5' fill='none' stroke='` + s + '7c3aed' + `' stroke-width='2.5'/><line x1='75' y1='75' x2='75' y2='125' stroke='` + s + 'ff6b35' + `' stroke-width='2.5' stroke-linecap='round'/><line x1='125' y1='75' x2='125' y2='125' stroke='` + s + 'ff6b35' + `' stroke-width='2.5' stroke-linecap='round'/><text x='100' y='108' text-anchor='middle' font-family='Arial' font-size='22' font-weight='bold' fill='` + s + '7c3aed' + `'>P</text></svg>`
          ,
    };
    return icons[name] || icons.curiosity;
  }

  selectRover(rover: string): void {
    this.selectedRover = rover;
    this.selectedSol = 0;
    this.selectedCamera = '';
    this.cameras = this.getCamerasForRover(rover);
    this.loadPhotos();
  }

  onSolChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.selectedSol = Number(target.value);
  }

  onImageLoad(event: Event): void {}

  openLightbox(photo: MarsPhotoDto): void {
    this.lightboxPhoto = photo;
    this.lightboxOpen = true;
  }

  closeLightbox(): void {
    this.lightboxOpen = false;
    setTimeout(() => { this.lightboxPhoto = null; }, 300);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('it-IT', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  loadPhotos(): void {
    this.loading = true;
    this.nasaApi.getMarsPhotos(this.selectedRover, this.selectedSol, this.selectedCamera).subscribe({
      next: (data) => {
        this.photos = data;
        this.photoCount = data.length;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Errore nel caricamento delle foto. Controlla la connessione e riprova.';
        this.loading = false;
      }
    });
  }
}
