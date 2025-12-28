import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db';

const SALT_ROUNDS = 12;

export const registerUser = async (req: Request, res: Response) => {
  const { email, password, username } = req.body;
  if (!email || !password || !username) {
    return res.status(400).json({ message: 'Email, username, and password required' });
  }
  try {
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(409).json({ message: 'Email already in use' });
    }
    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      return res.status(409).json({ message: 'Username already in use' });
    }
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({ data: { email, username, passwordHash: hash } });
    res.status(201).json({ id: user.id, email: user.email, username: user.username });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed' });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      process.env.JWT_SECRET ?? 'secret',
      { expiresIn: '1h' }
    );
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Login failed' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  const { username, currentPassword, newPassword } = req.body;
  if (!username) {
    return res.status(400).json({ message: 'Username required' });
  }
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET ?? 'secret') as { id: number };
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password required to set new password' });
      }
      const passwordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!passwordValid) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }
      const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
      await prisma.user.update({
        where: { id: user.id },
        data: { username, passwordHash: newHash },
      });
    } else {
      const existingUsername = await prisma.user.findUnique({
        where: { username },
      });
      if (existingUsername && existingUsername.id !== user.id) {
        return res.status(409).json({ message: 'Username already in use' });
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { username },
      });
    }

    const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
    res.json({ username: updatedUser?.username, email: updatedUser?.email });
  } catch (err: any) {
    if (err.code === 'P2002') {
      return res.status(409).json({ message: 'Username already in use' });
    }
    res.status(500).json({ message: 'Profile update failed' });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET ?? 'secret') as { id: number };
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, username: true, createdAt: true },
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
};
