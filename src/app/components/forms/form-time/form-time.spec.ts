import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormControl, FormsModule, Validators } from '@angular/forms';
import { FormTime } from './form-time';
import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';

@Component({
  standalone: true,
  imports: [FormTime, ReactiveFormsModule, FormsModule, CommonModule],
  template: `
    <app-form-time
      [label]="hostLabel()"
      [placeholder]="hostPlaceholder()"
      [controlId]="hostControlId()"
      [required]="hostRequired()"
      [formControl]="timeControl"
    ></app-form-time>
  `,
})
class TestHostComponent {
  hostLabel = signal('Test Time');
  hostPlaceholder = signal('HH:MM');
  hostControlId = signal('testTime');
  hostRequired = signal(false);
  timeControl = new FormControl('');

  constructor() {
    if (this.hostRequired()) {
      this.timeControl.setValidators(Validators.required);
    }
  }
}

describe('FormTime', () => {
  let hostComponent: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let formTimeComponent: FormTime;
  let inputElement: HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    
    fixture.detectChanges();
    inputElement = fixture.nativeElement.querySelector('input');
  });

  it('should create', () => {
    expect(hostComponent).toBeTruthy();
    expect(formTimeComponent).toBeTruthy();
  });

  it('should display the label and placeholder', () => {
    expect(fixture.nativeElement.querySelector('label').textContent).toContain('Test Time');
    expect(inputElement.placeholder).toContain('HH:MM');
  });

  it('should update the host form control when time input value changes', () => {
    const testValue = '14:30';
    inputElement.value = testValue;
    inputElement.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(hostComponent.timeControl.value).toBe(testValue);
    expect(formTimeComponent.value).toBe(testValue);
  });

  it('should update the input when the host form control value changes', () => {
    const testValue = '10:00';
    hostComponent.timeControl.setValue(testValue);
    fixture.detectChanges();

    expect(inputElement.value).toBe(testValue);
    expect(formTimeComponent.value).toBe(testValue);
  });

  it('should mark the host form control as touched on blur', () => {
    inputElement.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(hostComponent.timeControl.touched).toBeTrue();
  });

  it('should disable the input when the host form control is disabled', () => {
    hostComponent.timeControl.disable();
    fixture.detectChanges();

    expect(inputElement.disabled).toBeTrue();
    expect(formTimeComponent.isDisabled).toBeTrue();
  });

  it('should enable the input when the host form control is enabled', () => {
    hostComponent.timeControl.disable();
    fixture.detectChanges();
    hostComponent.timeControl.enable();
    fixture.detectChanges();

    expect(inputElement.disabled).toBeFalse();
    expect(formTimeComponent.isDisabled).toBeFalse();
  });

  it('should show required validation message if required and untouched', () => {
    hostComponent.hostRequired.set(true);
    hostComponent.timeControl.setValidators(Validators.required);
    hostComponent.timeControl.updateValueAndValidity();
    fixture.detectChanges();

    expect(hostComponent.timeControl.hasError('required')).toBeTrue();
    expect(fixture.nativeElement.querySelector('.invalid-feedback')).toBeNull(); // Not touched yet

    inputElement.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.invalid-feedback')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.invalid-feedback').textContent).toContain('This field is required.');
  });

  it('should clear required validation message when value is provided', () => {
    hostComponent.hostRequired.set(true);
    hostComponent.timeControl.setValidators(Validators.required);
    hostComponent.timeControl.updateValueAndValidity();
    fixture.detectChanges();

    inputElement.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.invalid-feedback')).toBeTruthy();

    const testValue = '12:00';
    inputElement.value = testValue;
    inputElement.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(hostComponent.timeControl.hasError('required')).toBeFalse();
    expect(fixture.nativeElement.querySelector('.invalid-feedback')).toBeNull();
  });
});
