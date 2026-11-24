import { z } from 'zod';
import prisma from '../lib/prisma.js';

const approvalSchema = z.object({ status: z.enum(['PENDING', 'APPROVED', 'REJECTED']) });

export const listUsers = async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { NOT: { role: 'ADMIN' } },
      select: { id: true, name: true, email: true, role: true, department: true, requestedRole: true, requestedDepartment: true, approvalStatus: true, approvedAt: true, createdAt: true, updatedAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ users });
  } catch (error) { next(error); }
};

export const reviewUser = async (req, res, next) => {
  try {
    const { status } = approvalSchema.parse(req.body);
    const applicant = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!applicant) return res.status(404).json({ message: 'Applicant not found' });
    if (applicant.role === 'ADMIN') return res.status(400).json({ message: 'Administrator accounts cannot be changed here' });

    const user = await prisma.user.update({
      where: { id: applicant.id },
      data: {
        approvalStatus: status,
        role: status === 'APPROVED' ? applicant.requestedRole : applicant.role,
        department: status === 'APPROVED' && applicant.requestedRole === 'MANAGER' ? applicant.requestedDepartment : null,
        approvedAt: status === 'APPROVED' ? new Date() : null,
        approvedById: req.user.id,
      },
      select: { id: true, name: true, email: true, role: true, department: true, approvalStatus: true },
    });
    const messages = { APPROVED: 'Account approved', PENDING: 'Account approval revoked', REJECTED: 'Application rejected' };
    res.json({ user, message: messages[status] });
  } catch (error) { next(error); }
};

