import { TestBed } from '@angular/core/testing';

import { Filtro } from './filtro';

describe('Filtro', () => {
  let service: Filtro;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Filtro);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
