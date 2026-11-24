import { z } from 'zod';
import prisma from '../lib/prisma.js';

const eventFields = z.object({
  title: z.string().trim().min(3),
  description: z.string().trim().min(10),
  category: z.enum(['COMMUNITY_SERVICE', 'SPORTS', 'PUBLIC_SAFETY', 'EDUCATION', 'ENVIRONMENT', 'CULTURAL_ACTIVITIES']),
  type: z.enum(['IN_PERSON', 'VIRTUAL', 'HYBRID']).default('IN_PERSON'),
  location: z.string().trim().min(2),
  address: z.string().trim().optional().nullable(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  isFree: z.boolean().default(true),
  price: z.coerce.number().min(0).optional().nullable(),
  capacity: z.coerce.number().int().positive().optional().nullable(),
  imageUrl: z.string().url().optional().nullable().or(z.literal('')),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
});
const eventSchema = eventFields.refine((v) => v.endsAt > v.startsAt, { message: 'End time must be after start time', path: ['endsAt'] });

const eventInclude = { _count: { select: { registrations: true } } };

export const listEvents = async (req, res, next) => {
  try {
    const { category, location, type, cost, date, sort = 'soonest', search } = req.query;
    const where = {
      published: true,
      blocked: false,
      startsAt: { gte: date ? new Date(`${date}T00:00:00`) : new Date() },
      ...(category && { category }),
      ...(type && { type }),
      ...(cost === 'free' && { isFree: true }),
      ...(cost === 'paid' && { isFree: false }),
      ...(location && { location: { contains: location, mode: 'insensitive' } }),
      ...(search && { OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ] }),
    };
    const orderBy = sort === 'popular'
      ? { registrations: { _count: 'desc' } }
      : sort === 'newest' ? { createdAt: 'desc' } : { startsAt: 'asc' };
    const events = await prisma.event.findMany({ where, include: eventInclude, orderBy });
    res.json({ events });
  } catch (error) { next(error); }
};

export const getEvent = async (req, res, next) => {
  try {
    const event = await prisma.event.findUnique({ where: { id: req.params.id }, include: eventInclude });
    if (!event || event.blocked) return res.status(404).json({ message: 'Event not found' });
    res.json({ event });
  } catch (error) { next(error); }
};

export const createEvent = async (req, res, next) => {
  try {
    const data = eventSchema.parse(req.body);
    const event = await prisma.event.create({ data: { ...data, imageUrl: data.imageUrl || null, creatorId: req.user.id }, include: eventInclude });
    res.status(201).json({ event });
  } catch (error) { next(error); }
};

export const updateEvent = async (req, res, next) => {
  try {
    const data = eventFields.partial().parse(req.body);
    if (data.startsAt && data.endsAt && data.endsAt <= data.startsAt) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }
    const event = await prisma.event.update({ where: { id: req.params.id }, data, include: eventInclude });
    res.json({ event });
  } catch (error) { next(error); }
};

export const deleteEvent = async (req, res, next) => {
  try {
    await prisma.event.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (error) { next(error); }
};

export const registerForEvent = async (req, res, next) => {
  try {
    const event = await prisma.event.findUnique({ where: { id: req.params.id }, include: eventInclude });
    if (!event || event.blocked || !event.published) return res.status(404).json({ message: 'Event is not available' });
    if (event.capacity && event._count.registrations >= event.capacity) return res.status(409).json({ message: 'This event is full' });
    await prisma.eventRegistration.upsert({
      where: { userId_eventId: { userId: req.user.id, eventId: req.params.id } },
      update: {}, create: { userId: req.user.id, eventId: req.params.id },
    });
    res.status(201).json({ message: 'You are registered for this event' });
  } catch (error) { next(error); }
};

