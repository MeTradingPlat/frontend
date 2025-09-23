import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { FormText } from './form-text';
import { Component, signal } from '@angular/core';

@Component({
  standalone: true,
  imports: [FormText, ReactiveFormsModule],
  template: `
    <app-form-text
      [label]="hostLabel()"
      [placeholder]="hostPlaceholder()"
      [type]="hostType()"
      [controlId]="hostControlId()"
      (valueChange)="onValueChange($event)"
    ></app-form-text>
  `,
})
class TestHostComponent {
  hostLabel = signal('Test Label');
  hostPlaceholder = signal('Test Placeholder');
  hostType = signal('text');
  hostControlId = signal('testControlId');
  emittedValue: string = '';

  onValueChange(value: string) {
    this.emittedValue = value;
  }
}

describe('FormText', () => {
  let hostComponent: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let formTextComponent: FormText;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    formTextComponent = fixture.debugElement.children[0].componentInstance;
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(hostComponent).toBeTruthy();
    expect(formTextComponent).toBeTruthy();
  });

  it('should display the label and placeholder', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('label').textContent).toContain('Test Label');
    expect(compiled.querySelector('input').placeholder).toContain('Test Placeholder');
  });

  it('should emit valueChange event when input value changes', () => {
    const inputElement: HTMLInputElement = fixture.nativeElement.querySelector('input');
    const testValue = 'new value';

    inputElement.value = testValue;
    inputElement.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(hostComponent.emittedValue).toBe(testValue);
  });

  it('should update formControl value when input changes', () => {
    const inputElement: HTMLInputElement = fixture.nativeElement.querySelector('input');
    const testValue = 'another value';

    inputElement.value = testValue;
    inputElement.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(formTextComponent.formControl.value).toBe(testValue);
  });
});
