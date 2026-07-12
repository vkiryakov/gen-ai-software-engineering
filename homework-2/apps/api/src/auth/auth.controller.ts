import { Body, Controller, HttpCode, HttpStatus, Post, UseInterceptors } from '@nestjs/common';
import { LoginInput, LoginInputSchema } from '@repo/contracts';
import { EnvelopeInterceptor } from '../common/envelope.interceptor';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AuthService } from './auth.service';

@Controller('auth')
@UseInterceptors(EnvelopeInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body(new ZodValidationPipe(LoginInputSchema)) body: LoginInput) {
    return this.authService.login(body.email, body.password);
  }
}
