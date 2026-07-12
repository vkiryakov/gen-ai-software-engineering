import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { EnvelopeInterceptor } from './envelope.interceptor';

describe('EnvelopeInterceptor', () => {
  const interceptor = new EnvelopeInterceptor();
  const context = {} as ExecutionContext;

  it('wraps a defined value in { data }', (done) => {
    const handler: CallHandler = { handle: () => of({ id: '1' }) };
    interceptor.intercept(context, handler).subscribe((result) => {
      expect(result).toEqual({ data: { id: '1' } });
      done();
    });
  });

  it('wraps an array value in { data }', (done) => {
    const handler: CallHandler = { handle: () => of([1, 2, 3]) };
    interceptor.intercept(context, handler).subscribe((result) => {
      expect(result).toEqual({ data: [1, 2, 3] });
      done();
    });
  });

  it('passes undefined through unwrapped (for 204 responses)', (done) => {
    const handler: CallHandler = { handle: () => of(undefined) };
    interceptor.intercept(context, handler).subscribe((result) => {
      expect(result).toBeUndefined();
      done();
    });
  });
});
