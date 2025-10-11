import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilterSelectedCard } from './filter-selected-card';
import { FiltroDtoRespuesta } from '../../../models/filtro.model';
import { CommonModule } from '@angular/common';
import { signal } from '@angular/core';

describe('FilterSelectedCard', () => {
  let component: FilterSelectedCard;
  let fixture: ComponentFixture<FilterSelectedCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterSelectedCard, CommonModule]
    }).compileComponents();

    fixture = TestBed.createComponent(FilterSelectedCard);
    component = fixture.componentInstance;

    // Simulación del InputSignal<FiltroDtoRespuesta>
    const mockFiltro: FiltroDtoRespuesta = {
      enumFiltro: {} as any,
      etiquetaNombre: 'Test Filter',
      etiquetaDescripcion: 'Test Description',
      objCategoria: { etiqueta: 'Test Category' } as any,
      parametros: []
    };

    // Asignar el signal directamente si el input es InputSignal
    (component as any).filtro = signal(mockFiltro);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display filter name from input', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector('input');
    expect(input?.value).toContain('Test Filter');
  });

  it('should display filter category from input', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const categorySpan = compiled.querySelector('.filter-selected-card-type span');
    expect(categorySpan?.textContent).toContain('Test Category');
  });

  it('should call onRemoveFilter when button is clicked', () => {
    spyOn(component, 'onRemoveFilter');
    const button = fixture.nativeElement.querySelector('.btn-icon');
    button?.click();
    expect(component.onRemoveFilter).toHaveBeenCalled();
  });
});