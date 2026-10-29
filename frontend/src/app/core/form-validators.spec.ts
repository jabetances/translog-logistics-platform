import { FormControl } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { trimmedMinLength, trimmedRequired } from './form-validators';

describe('trimmed form validators', () => {
  it('rejects text made only of whitespace', () => {
    expect(trimmedRequired(new FormControl('   '))).toEqual({ required: true });
  });

  it('measures minimum length after trimming', () => {
    expect(trimmedMinLength(3)(new FormControl('  A  '))).toEqual({
      minlength: { requiredLength: 3, actualLength: 1 },
    });
    expect(trimmedMinLength(3)(new FormControl('  Calle  '))).toBeNull();
  });
});
