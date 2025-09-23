import { Component, input, output, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormArray, FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, distinctUntilChanged, debounceTime } from 'rxjs';

interface CheckboxOption {
  key: string;
  value: string;
}

@Component({
  selector: 'app-form-checkbox',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './form-checkbox.html',
  styleUrl: './form-checkbox.css'
})
export class FormCheckbox implements OnInit, OnDestroy {
  label = input<string>('');
  controlId = input<string>('');
  options = input<CheckboxOption[]>([]);
  formArray = input.required<FormArray>();
  valueChange = output<string[]>();

  private destroy$ = new Subject<void>();

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    // Configurar listener para cambios en el FormArray
    this.formArray().valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(50), // Pequeño debounce para evitar múltiples emisiones
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
    ).subscribe(values => {
      const selectedValues = this.options()
        .filter((option, i) => values[i])
        .map(option => option.key);
      
      this.valueChange.emit(selectedValues);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getCheckboxControl(index: number): FormControl<boolean> {
    return this.formArray().controls[index] as FormControl<boolean>;
  }

  getSelectedKeys(): string[] {
    return this.options()
      .filter((option, i) => this.getCheckboxControl(i)?.value)
      .map(option => option.key);
  }

  isChecked(index: number): boolean {
    return this.getCheckboxControl(index)?.value || false;
  }
}