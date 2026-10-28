import { Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';

@Injectable()
export class SpanishPaginatorIntl extends MatPaginatorIntl {
  constructor() {
    super();
    this.itemsPerPageLabel = 'Filas por página';
    this.nextPageLabel = 'Página siguiente';
    this.previousPageLabel = 'Página anterior';
    this.firstPageLabel = 'Primera página';
    this.lastPageLabel = 'Última página';
    this.getRangeLabel = (page, pageSize, length) => {
      if (length === 0 || pageSize === 0) return '0 de ' + length;
      const startIndex = page * pageSize;
      const endIndex = Math.min(startIndex + pageSize, length);
      return (startIndex + 1) + '–' + endIndex + ' de ' + length;
    };
  }
}
