import { z } from 'zod';
import prisma from '../lib/prisma.js';

const createSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(2000),
  issueType: z.enum(['BROKEN_STREETLIGHT', 'POTHOLE', 'GRAFFITI', 'WATER_LEAK', 'NOISE_COMPLAINT', 'OTHER']),
  location: z.string().trim().min(4),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  imageUrl: z.string().url().optional().nullable().or(z.literal('')),
});

const updateSchema = z.object({
  status: z.enum(['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  managerId: z.string().nullable().optional(),
  assignedToName: z.string().trim().max(120).nullable().optional(),
  department: z.enum(['Public Works', 'Water Services', 'Public Safety', 'Parks and Recreation', 'Transportation', 'Neighborhood Services', 'Environmental Services']).nullable().optional(),
  resolution: z.string().trim().nullable().optional(),
});

const requestInclude = {
  citizen: { select: { id: true, name: true, email: true } },
  manager: { select: { id: true, name: true, department: true } },
};

const makeReference = () => `SC-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

export const createRequest = async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const serviceRequest = await prisma.serviceRequest.create({
      data: { ...data, imageUrl: data.imageUrl || null, citizenId: req.user.id, reference: makeReference() },
      include: requestInclude,
    });
    res.status(201).json({ serviceRequest });
  } catch (error) { next(error); }
};

export const listRequests = async (req, res, next) => {
  try {
    const { status, issueType, priority, search } = req.query;
    const access = req.user.role === 'CITIZEN'
      ? { citizenId: req.user.id }
      : {};
    const where = {
      ...access,
      ...(req.user.role !== 'ADMIN' && { blocked: false }),
      ...(status && { status }), ...(issueType && { issueType }), ...(priority && { priority }),
      ...(search && { AND: [{ OR: [
        { reference: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ] }] }),
    };
    const serviceRequests = await prisma.serviceRequest.findMany({ where, include: requestInclude, orderBy: { createdAt: 'desc' } });
    res.json({ serviceRequests });
  } catch (error) { next(error); }
};

export const getRequest = async (req, res, next) => {
  try {
    const serviceRequest = await prisma.serviceRequest.findUnique({ where: { id: req.params.id }, include: requestInclude });
    if (!serviceRequest || (serviceRequest.blocked && req.user.role !== 'ADMIN')) return res.status(404).json({ message: 'Service request not found' });
    const allowed = req.user.role !== 'CITIZEN' || serviceRequest.citizenId === req.user.id;
    if (!allowed) return res.status(403).json({ message: 'You cannot view this request' });
    res.json({ serviceRequest });
  } catch (error) { next(error); }
};

export const updateRequest = async (req, res, next) => {
  try {
    const data = updateSchema.parse(req.body);
    if (req.user.role === 'MANAGER') {
      delete data.managerId;
    }
    if ('assignedToName' in data) data.assignedToName = data.assignedToName || null;
    if (data.status === 'RESOLVED') data.resolvedAt = new Date();
    const serviceRequest = await prisma.serviceRequest.update({ where: { id: req.params.id }, data, include: requestInclude });
    res.json({ serviceRequest });
  } catch (error) { next(error); }
};

export const listManagers = async (_req, res, next) => {
  try {
    const managers = await prisma.user.findMany({ where: { role: 'MANAGER' }, select: { id: true, name: true, email: true, department: true } });
    res.json({ managers });
  } catch (error) { next(error); }
};

