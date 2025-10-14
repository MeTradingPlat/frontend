import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { ParametroDTORespuesta } from '../../../models/parametro.model';
import { EnumCondicional } from '../../../enums/enum-condicional';
import { ChangeDetectionStrategy } from '@angular/core';
import { ValorCondicionalDTORespuesta } from '../../../models/valor.model';
import { EnumTipoValor } from '../../../enums/enum-tipo-valor';
import { FilterParameterConditional } from './filter-parameter-conditional';

@Component({
  template: `
    <app-filter-parameter-conditional
      [parametro]="parametroSignal()"
    ></app-filter-parameter-conditional>
  `,
  standalone: true,
  imports: [FilterParameterConditional]
})
class TestHostComponent {
  parametroSignal = signal<ParametroDTORespuesta>(null!);
}

describe('FilterParameterConditional', () => {
  let hostComponent: TestHostComponent;
  let hostFixture: ComponentFixture<TestHostComponent>;
  let component: FilterParameterConditional;
  let formBuilder: FormBuilder;

  const mockValorCondicional: ValorCondicionalDTORespuesta = {
    enumCondicional: EnumCondicional.MAYOR_QUE,
    valor1: 10,
    enumTipoValor: EnumTipoValor.CONDICIONAL,
    etiqueta: ''
  };

  const mockParametro: ParametroDTORespuesta = {
    enumParametro: null as any, // Replace with appropriate EnumParametro value
    etiqueta: 'Test Conditional Parameter',
    objValorSeleccionado: mockValorCondicional,
    opciones: []
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, ReactiveFormsModule],
      providers: [FormBuilder]
    })
    .overrideComponent(FilterParameterConditional, {
      set: { changeDetection: ChangeDetectionStrategy.Default }
    })
    .compileComponents();

    hostFixture = TestBed.createComponent(TestHostComponent);
    hostComponent = hostFixture.componentInstance;
    component = hostFixture.debugElement.children[0].componentInstance;
    formBuilder = TestBed.inject(FormBuilder);

    hostComponent.parametroSignal.set(mockParametro);
    hostFixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with correct values', () => {
    expect(component.conditionalForm).toBeDefined();
    expect(component.conditionalSelectControl.value).toBe(mockValorCondicional.enumCondicional);
    expect(component.value1Control.value).toBe(mockValorCondicional.valor1);
    expect(component.value2Control.value).toBeNull(); // Initially null for MAYOR_QUE
  });

  it('should show only value1 input for MAYOR_QUE', () => {
    component.conditionalSelectControl.setValue(EnumCondicional.MAYOR_QUE);
    hostFixture.detectChanges();
    const value2Input = hostFixture.nativeElement.querySelector('[controlId="value2"]');
    expect(value2Input).toBeNull();
  });

  it('should show both value1 and value2 inputs for ENTRE', () => {
    component.conditionalSelectControl.setValue(EnumCondicional.ENTRE);
    hostFixture.detectChanges();
    const value2Input = hostFixture.nativeElement.querySelector('[controlId="value2"]');
    expect(value2Input).not.toBeNull();
    // Check if the validator is present
    const validator = component.value2Control.validator;
    expect(validator && validator(new FormControl(null))).toEqual({ 'required': true });
  });

  it('should emit parameterChange on form value changes', () => {
    spyOn(component.parameterChange, 'emit');
    component.conditionalSelectControl.setValue(EnumCondicional.MENOR_QUE);
    hostFixture.detectChanges();
    expect(component.parameterChange.emit).toHaveBeenCalled();
  });

  it('should update value2 validators when conditional changes', () => {
    component.conditionalSelectControl.setValue(EnumCondicional.MAYOR_QUE);
    hostFixture.detectChanges();
    let validator = component.value2Control.validator;
    expect(validator && validator(new FormControl(null))).toBeNull(); // No required validator

    component.conditionalSelectControl.setValue(EnumCondicional.ENTRE);
    hostFixture.detectChanges();
    validator = component.value2Control.validator;
    expect(validator && validator(new FormControl(null))).toEqual({ 'required': true });
  });
});
