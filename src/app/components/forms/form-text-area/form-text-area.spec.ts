import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { FormTextArea } from './form-text-area';
import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';

@Component({
  standalone: true,
  imports: [FormTextArea, ReactiveFormsModule, CommonModule],
  template: `
    <app-form-text-area
      [label]="hostLabel()"
      [placeholder]="hostPlaceholder()"
      [controlId]="hostControlId()"
      [rows]="hostRows()"
      [required]="hostRequired()"
      (valueChange)="onValueChange($event)"
    ></app-form-text-area>
  `,
})
class TestHostComponent {
  hostLabel = signal('Test Text Area');
  hostPlaceholder = signal('Enter text here');
  hostControlId = signal('testTextArea');
  hostRows = signal(5);
  hostRequired = signal(false);
  emittedValue: string = '';

  onValueChange(value: string) {
    this.emittedValue = value;
  }
}

describe('FormTextArea', () => {
  let hostComponent: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let formTextAreaComponent: FormTextArea;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    formTextAreaComponent = fixture.debugElement.children[0].componentInstance;
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(hostComponent).toBeTruthy();
    expect(formTextAreaComponent).toBeTruthy();
  });

  it('should display the label and placeholder', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('label').textContent).toContain('Test Text Area');
    expect(compiled.querySelector('textarea').placeholder).toContain('Enter text here');
  });

  it('should emit valueChange event when textarea value changes', () => {
    const textareaElement: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    const testValue = 'new text value';

    textareaElement.value = testValue;
    textareaElement.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(hostComponent.emittedValue).toBe(testValue);
  });

  it('should update formControl value when textarea changes', () => {
    const textareaElement: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    const testValue = 'another text value';

    textareaElement.value = testValue;
    textareaElement.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(formTextAreaComponent.formControl.value).toBe(testValue);
  });

  it('should mark formControl as required if required input is true', () => {
    hostComponent.hostRequired.set(true);
    fixture.detectChanges(); // Trigger change detection to update the input

    formTextAreaComponent.ngOnInit(); // Re-initialize to apply validators
    fixture.detectChanges();

    expect(formTextAreaComponent.formControl.hasError('required')).toBeTrue();

    const textareaElement: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    textareaElement.value = 'some text';
    textareaElement.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(formTextAreaComponent.formControl.hasError('required')).toBeFalse();
  });
});
