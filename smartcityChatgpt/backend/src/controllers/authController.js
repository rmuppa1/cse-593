import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../lib/prisma.js';

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().transform((v) => v.toLowerCase()),
  password: z.string().min(8).max(72),
  requestedRole: z.enum(['CITIZEN', 'MANAGER']),
  department: z.string().trim().max(100).optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.requestedRole === 'MANAGER' && !data.department) {
    ctx.addIssue({ code: 'custom', path: ['department'], message: 'Choose a department for a manager application' });
  }
});

const loginSchema = z.object({
  email: z.string().trim().email().transform((v) => v.toLowerCase()),
  password: z.string().min(1),
});

const publicUser = ({ password, ...user }) => user;
const issueToken = (user) => jwt.sign(
  { id: user.id, email: user.email, role: user.role, name: user.name },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
);

export const register = async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    if (await prisma.user.findUnique({ where: { email: data.email } })) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: await bcrypt.hash(data.password, 12),
        role: 'CITIZEN',
        requestedRole: data.requestedRole,
        requestedDepartment: data.requestedRole === 'MANAGER' ? data.department : null,
        approvalStatus: 'PENDING',
      },
    });
    res.status(201).json({
      pending: true,
      message: `Your ${data.requestedRole === 'MANAGER' ? 'department manager' : 'citizen'} application was submitted for administrator approval.`,
      user: publicUser(user),
    });
  } catch (error) { next(error); }
};

export const login = async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user || !(await bcrypt.compare(data.password, user.password))) {
      return res.status(401).json({ message: 'Incorrect email or password' });
    }
    if (user.approvalStatus === 'PENDING') {
      return res.status(403).json({ message: 'Your account is waiting for administrator approval' });
    }
    if (user.approvalStatus === 'REJECTED') {
      return res.status(403).json({ message: 'Your account application was not approved. Contact a city administrator for help' });
    }
    res.json({ token: issueToken(user), user: publicUser(user) });
  } catch (error) { next(error); }
};

export const me = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: publicUser(user) });
  } catch (error) { next(error); }
};

