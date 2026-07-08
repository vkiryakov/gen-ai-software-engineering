import { BadRequestException, ValidationError } from '@nestjs/common';

export interface ValidationDetail {
  field: string;
  message: string;
}

export interface ValidationErrorResponse {
  error: 'Validation failed';
  details: ValidationDetail[];
}

/**
 * Build the response shape required by the API contract from class-validator
 * errors. Nested children are flattened into dotted paths (e.g. `items.0.sku`).
 */
export function validationExceptionFactory(
  errors: ValidationError[],
): BadRequestException {
  const body: ValidationErrorResponse = {
    error: 'Validation failed',
    details: flattenValidationErrors(errors),
  };
  return new BadRequestException(body);
}

function flattenValidationErrors(
  errors: ValidationError[],
  parentPath = '',
): ValidationDetail[] {
  const out: ValidationDetail[] = [];
  for (const err of errors) {
    const field = parentPath ? `${parentPath}.${err.property}` : err.property;

    if (err.constraints) {
      for (const message of Object.values(err.constraints)) {
        out.push({ field, message });
      }
    }
    if (err.children?.length) {
      out.push(...flattenValidationErrors(err.children, field));
    }
  }
  return out;
}
