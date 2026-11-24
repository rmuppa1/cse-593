import { z } from 'zod';
import prisma from '../lib/prisma.js';

const createSchema = z.object({
  targetType: z.enum(['EVENT', 'SERVICE_REQUEST']),
  targetId: z.string().min(1),
  reason: z.string().trim().min(10, 'Please provide at least 10 characters').max(1000),
});
const reviewSchema = z.object({
  action: z.enum(['BLOCK', 'DISMISS', 'REOPEN', 'UNBLOCK']),
  adminNote: z.string().trim().max(1000).optional().nullable(),
});

const targetExists = async (targetType, targetId) => targetType === 'EVENT'
  ? prisma.event.findUnique({ where: { id: targetId }, select: { id: true, blocked: true } })
  : prisma.serviceRequest.findUnique({ where: { id: targetId }, select: { id: true, blocked: true } });

export const createFlag = async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const target = await targetExists(data.targetType, data.targetId);
    if (!target) return res.status(404).json({ message: 'Content not found' });
    if (target.blocked) return res.status(409).json({ message: 'This content has already been blocked' });
    const existing = await prisma.contentFlag.findFirst({
      where: { targetType: data.targetType, targetId: data.targetId, reporterId: req.user.id, status: 'OPEN' },
    });
    if (existing) return res.status(409).json({ message: 'You already submitted a flag for this content' });
    const flag = await prisma.contentFlag.create({ data: { ...data, reporterId: req.user.id } });
    res.status(201).json({ flag, message: 'Your flag was sent to city administrators for review' });
  } catch (error) { next(error); }
};

export const listFlags = async (_req, res, next) => {
  try {
    const flags = await prisma.contentFlag.findMany({
      include: { reporter: { select: { id: true, name: true, email: true } } },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
    const enriched = await Promise.all(flags.map(async (flag) => {
      const target = flag.targetType === 'EVENT'
        ? await prisma.event.findUnique({ where: { id: flag.targetId }, select: { title: true, blocked: true } })
        : await prisma.serviceRequest.findUnique({ where: { id: flag.targetId }, select: { title: true, reference: true, blocked: true } });
      return { ...flag, target };
    }));
    res.json({ flags: enriched });
  } catch (error) { next(error); }
};

export const reviewFlag = async (req, res, next) => {
  try {
    const { action, adminNote } = reviewSchema.parse(req.body);
    const flag = await prisma.contentFlag.findUnique({ where: { id: req.params.id } });
    if (!flag) return res.status(404).json({ message: 'Flag not found' });
    if (action === 'BLOCK' && flag.status !== 'OPEN') return res.status(409).json({ message: 'Only an open flag can block content' });
    if (action === 'REOPEN') {
      const target = await targetExists(flag.targetType, flag.targetId);
      if (target?.blocked) return res.status(409).json({ message: 'Unblock the content before reopening its flag' });
    }

    await prisma.$transaction(async (tx) => {
      if (action === 'BLOCK') {
        if (flag.targetType === 'EVENT') await tx.event.update({ where: { id: flag.targetId }, data: { blocked: true, published: false } });
        else await tx.serviceRequest.update({ where: { id: flag.targetId }, data: { blocked: true } });
        await tx.contentFlag.updateMany({ where: { targetType: flag.targetType, targetId: flag.targetId, status: 'OPEN' }, data: { status: 'BLOCKED', reviewedAt: new Date(), adminNote } });
      } else if (action === 'DISMISS') {
        await tx.contentFlag.update({ where: { id: flag.id }, data: { status: 'DISMISSED', reviewedAt: new Date(), adminNote } });
      } else if (action === 'REOPEN') {
        await tx.contentFlag.update({ where: { id: flag.id }, data: { status: 'OPEN', reviewedAt: null, adminNote } });
      } else {
        if (flag.targetType === 'EVENT') await tx.event.update({ where: { id: flag.targetId }, data: { blocked: false, published: true } });
        else await tx.serviceRequest.update({ where: { id: flag.targetId }, data: { blocked: false } });
        await tx.contentFlag.updateMany({ where: { targetType: flag.targetType, targetId: flag.targetId, status: 'BLOCKED' }, data: { status: 'DISMISSED', reviewedAt: new Date(), adminNote } });
      }
    });
    const messages = { BLOCK: 'Content blocked by administrator', DISMISS: 'Flag dismissed', REOPEN: 'Flag reopened for review', UNBLOCK: 'Content restored and flag retained in history' };
    res.json({ message: messages[action] });
  } catch (error) { next(error); }
};

