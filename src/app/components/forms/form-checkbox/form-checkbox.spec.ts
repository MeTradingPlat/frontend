import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormArray, FormControl, FormGroup } from '@angular/forms';
import { FormCheckbox } from './form-checkbox';
import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';

interface CheckboxOption {
  key: string;
  value: string;
  checked: boolean;
}

@Component({
  standalone: true,
  imports: [FormCheckbox, ReactiveFormsModule, CommonModule],
  template: `
    <app-form-checkbox
      [label]="hostLabel()"
      [controlId]="hostControlId()"
      [options]="hostOptions()"
      [formArray]="hostFormArray"
      (valueChange)="onValueChange($event)"
    ></app-form-checkbox>
  `,
})
class TestHostComponent {
  hostLabel = signal('Test Checkbox Group');
  hostControlId = signal('testCheckboxGroup');
  hostOptions = signal<CheckboxOption[]>([
    { key: 'option1', value: 'Option 1', checked: false },
    { key: 'option2', value: 'Option 2', checked: true },
    { key: 'option3', value: 'Option 3', checked: false },
  ]);
  emittedValue: string[] = [];

  hostFormArray = new FormArray([
    new FormControl(false),
    new FormControl(true),
    new FormControl(false)
  ]);

  onValueChange(value: string[]) {
    this.emittedValue = value;
  }
}

describe('FormCheckbox', () => {
  let hostComponent: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let formCheckboxComponent: FormCheckbox;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    formCheckboxComponent = fixture.debugElement.children[0].componentInstance;
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(hostComponent).toBeTruthy();
    expect(formCheckboxComponent).toBeTruthy();
  });

  it('should display the label', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('label').textContent).toContain('Test Checkbox Group');
  });

  it('should initialize form array with correct checked states', () => {
    expect(formCheckboxComponent.formArray().length).toBe(3);
    expect(formCheckboxComponent.formArray().controls[0].value).toBe(false);
    expect(formCheckboxComponent.formArray().controls[1].value).toBe(true);
    expect(formCheckboxComponent.formArray().controls[2].value).toBe(false);
  });

  it('should emit valueChange event when checkbox state changes', () => {
    const checkboxInput: HTMLInputElement = fixture.nativeElement.querySelector('#testCheckboxGroup-option1');
    
    checkboxInput.click(); // Simulate checking the first checkbox
    fixture.detectChanges();

    expect(hostComponent.emittedValue).toEqual(['option1', 'option2']);

    const checkboxInput2: HTMLInputElement = fixture.nativeElement.querySelector('#testCheckboxGroup-option2');
    checkboxInput2.click(); // Simulate unchecking the second checkbox
    fixture.detectChanges();

    expect(hostComponent.emittedValue).toEqual(['option1']);
  });

  it('should update formControl value when checkbox changes', () => {
    const checkboxInput: HTMLInputElement = fixture.nativeElement.querySelector('#testCheckboxGroup-option3');
    
    checkboxInput.click(); // Simulate checking the third checkbox
    fixture.detectChanges();

    expect(formCheckboxComponent.formArray().controls[2].value).toBe(true);
  });
});
