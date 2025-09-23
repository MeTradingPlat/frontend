import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { FormSelect } from './form-select';
import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';

interface SelectOption {
  key: string;
  value: string;
}

@Component({
  standalone: true,
  imports: [FormSelect, ReactiveFormsModule, CommonModule],
  template: `
    <app-form-select
      [label]="hostLabel()"
      [controlId]="hostControlId()"
      [options]="hostOptions()"
      [placeholder]="hostPlaceholder()"
      [required]="hostRequired()"
      (valueChange)="onValueChange($event)"
    ></app-form-select>
  `,
})
class TestHostComponent {
  hostLabel = signal('Test Select');
  hostControlId = signal('testSelect');
  hostOptions = signal<SelectOption[]>([
    { key: 'option1', value: 'Option 1' },
    { key: 'option2', value: 'Option 2' },
    { key: 'option3', value: 'Option 3' },
  ]);
  hostPlaceholder = signal('Select an option');
  hostRequired = signal(false);
  emittedValue: string = '';

  onValueChange(value: string) {
    this.emittedValue = value;
  }
}

describe('FormSelect', () => {
  let hostComponent: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let formSelectComponent: FormSelect;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    formSelectComponent = fixture.debugElement.children[0].componentInstance;
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(hostComponent).toBeTruthy();
    expect(formSelectComponent).toBeTruthy();
  });

  it('should display the label and placeholder', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('label').textContent).toContain('Test Select');
    expect(compiled.querySelector('option[disabled]').textContent).toContain('Select an option');
  });

  it('should emit valueChange event when select value changes', () => {
    const selectElement: HTMLSelectElement = fixture.nativeElement.querySelector('select');
    const testValue = 'option2';

    selectElement.value = testValue;
    selectElement.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(hostComponent.emittedValue).toBe(testValue);
  });

  it('should update formControl value when select changes', () => {
    const selectElement: HTMLSelectElement = fixture.nativeElement.querySelector('select');
    const testValue = 'option3';

    selectElement.value = testValue;
    selectElement.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(formSelectComponent.formControl.value).toBe(testValue);
  });

  it('should mark formControl as required if required input is true', () => {
    hostComponent.hostRequired.set(true);
    fixture.detectChanges(); // Trigger change detection to update the input

    formSelectComponent.ngOnInit(); // Re-initialize to apply validators
    fixture.detectChanges();

    expect(formSelectComponent.formControl.hasError('required')).toBeTrue();

    const selectElement: HTMLSelectElement = fixture.nativeElement.querySelector('select');
    selectElement.value = 'option1';
    selectElement.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(formSelectComponent.formControl.hasError('required')).toBeFalse();
  });
});
