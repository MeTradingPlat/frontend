import { ValidatorFn } from '@angular/forms';
import { enumControlType } from '../enums/enum-control-type';

export interface FormField {
  key: string;
  type: enumControlType;
  label: string;
  placeholder?: string;
  validators?: ValidatorFn[];
  validationMessages?: { [key: string]: string };
  options?: { key: string; value: string; checked?: boolean }[];
  value?: any;
  icon?: string;
  isHorizontal?: boolean;
}