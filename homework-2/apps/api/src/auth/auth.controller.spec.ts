import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: { login: jest.Mock };

  beforeEach(() => {
    authService = { login: jest.fn() };
    controller = new AuthController(authService as unknown as AuthService);
  });

  it('delegates login to AuthService with the given email and password', () => {
    const result = { token: 'signed-token', user: { email: 'admin@ignore.com' } };
    authService.login.mockReturnValue(result);

    const response = controller.login({ email: 'admin@ignore.com', password: '123' });

    expect(authService.login).toHaveBeenCalledWith('admin@ignore.com', '123');
    expect(response).toBe(result);
  });
});
