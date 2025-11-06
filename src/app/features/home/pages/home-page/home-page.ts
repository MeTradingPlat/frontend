import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

interface Feature {
  icon: string;
  title: string;
  description: string;
  route?: string;
}

@Component({
  selector: 'app-home-page',
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    TranslatePipe
  ],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomePage {
  constructor(private router: Router) {}

  features: Feature[] = [
    {
      icon: 'bi-clipboard-data-fill',
      title: 'HOME.FEATURE1_TITLE',
      description: 'HOME.FEATURE1_DESC',
      route: '/escaneres'
    },
    {
      icon: 'bi-bar-chart-line-fill',
      title: 'HOME.FEATURE2_TITLE',
      description: 'HOME.FEATURE2_DESC'
    },
    {
      icon: 'bi-bell-fill',
      title: 'HOME.FEATURE3_TITLE',
      description: 'HOME.FEATURE3_DESC'
    },
    {
      icon: 'bi-newspaper',
      title: 'HOME.FEATURE4_TITLE',
      description: 'HOME.FEATURE4_DESC',
      route: '/noticias'
    },
    {
      icon: 'bi-archive-fill',
      title: 'HOME.FEATURE5_TITLE',
      description: 'HOME.FEATURE5_DESC'
    },
    {
      icon: 'bi-gear-fill',
      title: 'HOME.FEATURE6_TITLE',
      description: 'HOME.FEATURE6_DESC'
    }
  ];

  navigateTo(route?: string): void {
    if (route) {
      this.router.navigate([route]);
    }
  }

  getStarted(): void {
    this.router.navigate(['/escaneres']);
  }
}
