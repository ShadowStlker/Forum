import request from 'supertest';
import app from './app';
import prisma from '../src/db';

// Helper to clear DB between tests
beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Auth API', () => {
  const userData = { email: 'test@example.com', password: 'Password123!' };

  it('should register a new user', async () => {
    const res = await request(app).post('/auth/register').send(userData);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.email).toBe(userData.email);
  });

  it('should not register with existing email', async () => {
    const res = await request(app).post('/auth/register').send(userData);
    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('message', 'Email already in use');
  });

  it('should login with correct credentials', async () => {
    const res = await request(app).post('/auth/login').send(userData);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: userData.email, password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message', 'Invalid credentials');
  });
});
