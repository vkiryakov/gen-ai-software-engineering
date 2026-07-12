import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { LoginResponse } from '@repo/contracts';

interface StoredUser {
  email: string;
  passwordHash: string;
}

@Injectable()
export class AuthService {
  private readonly users: StoredUser[] = [
    { email: 'admin@ignore.com', passwordHash: bcrypt.hashSync('123', 10) },
  ];

  constructor(private readonly jwtService: JwtService) {}

  login(email: string, password: string): LoginResponse {
    const user = this.users.find((u) => u.email === email);
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    const token = this.jwtService.sign({ email: user.email });
    return { token, user: { email: user.email } };
  }
}
