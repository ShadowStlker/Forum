import request from 'supertest';
import app from './app';
import prisma from '../src/db';

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Posts API', () => {
  const user = { email: 'postuser@example.com', password: 'Password123!' };
  let token: string;

  beforeAll(async () => {
    // Register user
    await request(app).post('/auth/register').send(user);
    const res = await request(app).post('/auth/login').send(user);
    token = res.body.token;
  });

  it('should create a post when authenticated', async () => {
    const res = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test Post', body: 'This is a test.' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe('Test Post');
  });

  it('should reject creating post without auth', async () => {
    const res = await request(app).post('/posts').send({ title: 'No Auth', body: 'Oops' });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message', 'Unauthorized');
  });

  it('should get all posts', async () => {
    const res = await request(app).get('/posts');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
