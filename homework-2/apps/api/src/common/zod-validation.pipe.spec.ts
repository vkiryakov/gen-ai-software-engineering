import { z } from 'zod';
import { BadRequestException } from '@nestjs/common';
import { ZodValidationPipe } from './zod-validation.pipe';

describe('ZodValidationPipe', () => {
  const schema = z.object({ name: z.string().min(1) });
  const pipe = new ZodValidationPipe(schema);
  const metadata = { type: 'body' } as const;

  it('returns the parsed value when valid', () => {
    expect(pipe.transform({ name: 'Alice' }, metadata)).toEqual({ name: 'Alice' });
  });

  it('throws BadRequestException with a readable message when invalid', () => {
    expect(() => pipe.transform({ name: '' }, metadata)).toThrow(BadRequestException);
  });

  it('includes the field path in the error message', () => {
    try {
      pipe.transform({ name: '' }, metadata);
      fail('expected transform to throw');
    } catch (e) {
      expect((e as BadRequestException).message).toContain('name');
    }
  });

  it('falls back to "value" in the error message for a root-level issue with no field path', () => {
    const rootSchema = z.string();
    const rootPipe = new ZodValidationPipe(rootSchema);
    try {
      rootPipe.transform(12345, metadata);
      fail('expected transform to throw');
    } catch (e) {
      expect((e as BadRequestException).message).toContain('value');
    }
  });
});
