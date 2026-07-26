import { Pipe, PipeTransform, inject } from '@angular/core';
import { MarketDirectoryService } from '../services/market-directory.service';

@Pipe({
  name: 'marketLabel',
  standalone: true,
  pure: false
})
export class MarketLabelPipe implements PipeTransform {
  private readonly marketDirectory = inject(MarketDirectoryService);

  transform(code: string | undefined | null): string {
    return this.marketDirectory.label(code);
  }
}
