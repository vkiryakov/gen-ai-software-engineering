import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';

function makeContext(headers: Record<string, string>) {
  return {
    switchToHttp: () => ({ getRequest: () => ({ headers }) }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  const jwtService = new JwtService({ secret: 'test-secret' });
  const guard = new JwtAuthGuard(jwtService);

  it('allows a request with a valid Bearer token', () => {
    const token = jwtService.sign({ email: 'admin@ignore.com' });
    expect(guard.canActivate(makeContext({ authorization: `Bearer ${token}` }))).toBe(true);
  });

  it('rejects a request with no Authorization header', () => {
    expect(() => guard.canActivate(makeContext({}))).toThrow(UnauthorizedException);
  });

  it('rejects a request with a malformed token', () => {
    expect(() =>
      guard.canActivate(makeContext({ authorization: 'Bearer not-a-real-token' })),
    ).toThrow(UnauthorizedException);
  });
});
