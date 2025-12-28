import request from 'supertest';
import app from './app';
import prisma from '../src/db';

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('AI Post API', () => {
  const user = { email: 'aiuser@example.com', password: 'Password123!' };
  let token: string;

  beforeAll(async () => {
    // Register user if not already registered
    await request(app).post('/auth/register').send(user);
    const res = await request(app).post('/auth/login').send(user);
    token = res.body.token;
  });

  it('should create a post with AI content', async () => {
    const aiBody = `Artificial Intelligence (AI) has rapidly evolved from theoretical research to mainstream applications. Recent breakthroughs include:

- **Large Language Models**: GPT-4 and successors demonstrate advanced language understanding and generation.
- **AI in Healthcare**: AI-driven diagnostics and personalized medicine are improving patient outcomes.
- **Generative AI**: Tools like DALL·E and Stable Diffusion generate images, music, and code.
- **AI Ethics & Governance**: Discussions around bias, transparency, and accountability are shaping policy.

These developments highlight AI's transformative potential across industries.`;

    const res = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'AI in Modern Tech', body: aiBody });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe('AI in Modern Tech');
    expect(res.body.body).toContain('Artificial Intelligence');
  });
});
