import { Test } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'test-secret' })],
      providers: [AuthService],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  it('returns a token and user for the seeded admin account', () => {
    const result = service.login('admin@ignore.com', '123');
    expect(result.user).toEqual({ email: 'admin@ignore.com' });
    expect(typeof result.token).toBe('string');
    expect(result.token.length).toBeGreaterThan(0);
  });

  it('throws UnauthorizedException for a wrong password', () => {
    expect(() => service.login('admin@ignore.com', 'wrong')).toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException for an unknown email', () => {
    expect(() => service.login('nobody@example.com', '123')).toThrow(UnauthorizedException);
  });
});
