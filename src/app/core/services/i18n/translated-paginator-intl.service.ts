import { Injectable, inject } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class TranslatedPaginatorIntl extends MatPaginatorIntl {
  private readonly translate = inject(TranslateService);

  constructor() {
    super();
    this._updateLabels();
    this.translate.onLangChange.subscribe(() => this._updateLabels());
  }

  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0 || pageSize === 0) return `0 ${this.translate.instant('COMMON.PAGINATOR_RANGE_OF')} ${length}`;
    const start = page * pageSize + 1;
    const end = Math.min((page + 1) * pageSize, length);
    return `${start} – ${end} ${this.translate.instant('COMMON.PAGINATOR_RANGE_OF')} ${length}`;
  };

  private _updateLabels(): void {
    this.itemsPerPageLabel = this.translate.instant('COMMON.PAGINATOR_ITEMS_PER_PAGE');
    this.nextPageLabel = this.translate.instant('COMMON.PAGINATOR_NEXT_PAGE');
    this.previousPageLabel = this.translate.instant('COMMON.PAGINATOR_PREVIOUS_PAGE');
    this.firstPageLabel = this.translate.instant('COMMON.PAGINATOR_FIRST_PAGE');
    this.lastPageLabel = this.translate.instant('COMMON.PAGINATOR_LAST_PAGE');
    this.changes.next();
  }
}
