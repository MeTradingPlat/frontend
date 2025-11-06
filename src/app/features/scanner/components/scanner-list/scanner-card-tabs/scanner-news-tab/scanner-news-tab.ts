import { ChangeDetectionStrategy, Component, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { Escaner } from '../../../../models/escaner.interface';

interface NewsRow {
  fecha: string;
  noticia: string;
  accion: string;
}

@Component({
  selector: 'app-scanner-news-tab',
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    TranslatePipe
  ],
  templateUrl: './scanner-news-tab.html',
  styleUrl: './scanner-news-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScannerNewsTab implements OnInit {
  scanner = input.required<Escaner>();

  displayedColumns: string[] = ['fecha', 'noticia', 'accion', 'details'];
  dataSource = signal<NewsRow[]>([]);
  loading = signal<boolean>(false);

  ngOnInit(): void {
    this.loadNews();
  }

  loadNews(): void {
    this.loading.set(true);

    // TODO: Implementar llamada al backend cuando esté disponible
    // Por ahora simulamos que no hay noticias
    setTimeout(() => {
      this.dataSource.set([]);
      this.loading.set(false);
    }, 500);
  }

  onViewDetails(news: NewsRow): void {
    console.log('Ver detalles de noticia:', news);
    // TODO: Implementar modal o navegación para ver detalles
  }
}
