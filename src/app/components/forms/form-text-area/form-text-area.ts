import { Component, input, output, ChangeDetectionStrategy, forwardRef } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators, ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-text-area',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './form-text-area.html',
  styleUrl: './form-text-area.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormTextArea),
      multi: true
    }
  ]
})
export class FormTextArea implements ControlValueAccessor {
  label = input<string>('');
  placeholder = input<string>('');
  controlId = input<string>('');
  rows = input<number>(3);
  required = input<boolean>(false);
  

  value: any = '';
  isDisabled: boolean = false;
  onChange = (value: any) => {};
  onTouched = () => {};

  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.value = value;
    this.onChange(value);
  }

  onBlur(): void {
    this.onTouched();
  }
}
