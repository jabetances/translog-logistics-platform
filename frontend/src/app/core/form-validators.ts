import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const trimmedRequired: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  typeof control.value === 'string' && control.value.trim().length > 0 ? null : { required: true };

export function trimmedMinLength(requiredLength: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const actualLength = typeof control.value === 'string' ? control.value.trim().length : 0;
    return actualLength >= requiredLength ? null : { minlength: { requiredLength, actualLength } };
  };
}
