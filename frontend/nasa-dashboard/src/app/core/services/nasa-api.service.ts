import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, retry, throwError, catchError } from 'rxjs';
import { ApodDto } from '../models/apod.model';
import { NeoDto } from '../models/neo.model';
import { MarsPhotoDto } from '../models/mars-photo.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NasaApiService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getApod(date?: string): Observable<ApodDto> {
    let params = new HttpParams();
    if (date) {
      params = params.set('date', date);
    }
    return this.http.get<ApodDto>(`${this.baseUrl}/api/apod`, { params }).pipe(
      retry(2),
      catchError(err => this.handleError(err, 'Errore caricamento APOD'))
    );
  }

  getApodGallery(count: number = 10): Observable<ApodDto[]> {
    return this.http.get<ApodDto[]>(`${this.baseUrl}/api/apod`, {
      params: new HttpParams().set('count', count.toString())
    }).pipe(
      retry(2),
      catchError(err => this.handleError(err, 'Errore caricamento galleria APOD'))
    );
  }

  getNeos(startDate: string, endDate: string): Observable<NeoDto[]> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http.get<NeoDto[]>(`${this.baseUrl}/api/neo`, { params }).pipe(
      retry(2),
      catchError(err => this.handleError(err, 'Errore caricamento asteroidi'))
    );
  }

  getMarsPhotos(rover: string, sol: number, camera?: string): Observable<MarsPhotoDto[]> {
    let params = new HttpParams()
      .set('rover', rover)
      .set('sol', sol.toString())
      .set('page', '0');

    if (camera) {
      params = params.set('camera', camera);
    }

    return this.http.get<MarsPhotoDto[]>(`${this.baseUrl}/api/mars`, { params }).pipe(
      retry(2),
      catchError(err => this.handleError(err, 'Errore caricamento foto Mars'))
    );
  }

  private handleError(err: any, defaultMessage: string): Observable<never> {
    console.warn(`[NasaApiService] ${defaultMessage}:`, err);
    const status = (err.status || err.error?.statusCode) ?? '';
    const message = (err.error?.message ?? err.error ?? err.message) ?? defaultMessage;
    return throwError(() => new Error(message));
  }
}
