import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

export enum CONTROL_TYPE {
  TEXT,
  TEXTAREA,
  SELECT,
  TIME,
  CHECKBOX_GROUP, // New control type for multiple checkboxes
}

export interface FormField {
  key: string;
  type: CONTROL_TYPE;
  label: string;
  placeholder?: string;
  options?: { key: string; value: string; checked?: boolean }[]; // Added checked property for checkboxes
  value?: any;
  validators?: any[];
  icon?: string;
}

@Component({
  selector: 'app-forms',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './forms.html',
  styleUrls: ['./forms.css'],
})
export class Forms implements OnInit {
  @Input() formFields: FormField[] = [];
  @Input() isHorizontal: boolean = false; // New input property
  form!: FormGroup;

  CONTROL_TYPE = CONTROL_TYPE;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({});
    this.formFields.forEach((field) => {
      const validators = field.validators || [];
      const control = this.fb.control(field.value || '', validators);
      this.form.addControl(field.key, control);
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      console.log('Formulario enviado:', this.form.value);
    }
  }
}
