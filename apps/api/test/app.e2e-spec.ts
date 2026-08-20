import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ApiExceptionFilter } from '../src/common/api-exception.filter';

describe('Referral API (e2e)', () => {
  let app: INestApplication;
  let aliceToken: string;
  let invitationToken: string;

  beforeAll(async () => {
    process.env.DATABASE_PATH = ':memory:';
    process.env.JWT_SECRET = 'e2e-secret-at-least-32-characters-long';
    process.env.DEMO_INVITER_PASSWORD = 'AliceDemo1234';
    const { AppModule } = await import('../src/app.module');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'AliceDemo1234' })
      .expect(200);
    aliceToken = login.body.accessToken as string;
  });

  afterAll(async () => {
    await app.close();
    delete process.env.DATABASE_PATH;
    delete process.env.JWT_SECRET;
    delete process.env.DEMO_INVITER_PASSWORD;
  });

  it('serves health and rejects unauthenticated protected access', async () => {
    await request(app.getHttpServer()).get('/api/health').expect(200, { status: 'ok', database: 'up' });
    await request(app.getHttpServer())
      .get('/api/users/me/referral-summary')
      .expect(401)
      .expect(({ body }) => expect(body).toMatchObject({ code: 'AUTHENTICATION_REQUIRED' }));
  });

  it('creates an invitation and returns the authenticated summary', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/users/me/invitation')
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(201);
    invitationToken = created.body.token as string;
    expect(invitationToken).toMatch(/^[A-HJ-NP-Z2-9]{12}$/);
    await request(app.getHttpServer())
      .get('/api/users/me/referral-summary')
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(200)
      .expect(({ body }) => expect(body).toMatchObject({ invitation: { token: invitationToken }, successfulReferralCount: 0 }));
  });

  it('rejects invalid input and a missing invitation', async () => {
    await request(app.getHttpServer())
      .post(`/api/invitations/${invitationToken}/accept`)
      .send({ name: '', email: 'not-an-email', unexpected: true })
      .expect(400)
      .expect(({ body }) => expect(body).toMatchObject({ code: 'VALIDATION_FAILED' }));
    await request(app.getHttpServer())
      .get('/api/invitations/INVALID')
      .expect(404)
      .expect(({ body }) => expect(body).toMatchObject({ code: 'INVITATION_NOT_FOUND' }));
  });

  it('accepts a referral but blocks privileged access until password reset', async () => {
    const accepted = await request(app.getHttpServer())
      .post(`/api/invitations/${invitationToken}/accept`)
      .send({ name: 'Bob', email: 'bob@example.com' })
      .expect(201);
    const bobLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'bob@example.com', password: accepted.body.temporaryPassword })
      .expect(200);
    await request(app.getHttpServer())
      .post('/api/users/me/invitation')
      .set('Authorization', `Bearer ${bobLogin.body.accessToken as string}`)
      .expect(403)
      .expect(({ body }) => expect(body).toMatchObject({ code: 'PASSWORD_RESET_REQUIRED' }));
  });
});
