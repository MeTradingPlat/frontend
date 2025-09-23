import { Component, input, output, OnInit, ChangeDetectionStrategy, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-time',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './form-time.html',
  styleUrl: './form-time.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormTime),
      multi: true
    }
  ]
})
export class FormTime implements ControlValueAccessor, OnInit {
  label = input<string>('');
  placeholder = input<string>('');
  controlId = input<string>('');
  required = input<boolean>(false);

  value: string = '';
  isDisabled: boolean = false;
  onChange = (value: string) => {};
  onTouched = () => {};

  valueChange = output<string>();

  ngOnInit() {
    // No need to set validators here if it's a ControlValueAccessor
    // The parent form will handle validation.
  }

  writeValue(value: string): void {
    this.value = value;
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.value = value;
    this.onChange(value);
    this.valueChange.emit(value);
  }
}
