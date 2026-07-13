import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('logs in the seeded admin user and returns a token', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@ignore.com', password: '123' })
      .expect(200);
    expect(res.body.data.user).toEqual({ email: 'admin@ignore.com' });
    expect(typeof res.body.data.token).toBe('string');
  });

  it('rejects a wrong password with a wrapped error', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@ignore.com', password: 'wrong' })
      .expect(401);
    expect(res.body.error.message).toContain('Invalid email or password');
  });

  it('rejects a malformed body with 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'not-an-email' })
      .expect(400);
    expect(res.body.error.message).toBeDefined();
  });
});
