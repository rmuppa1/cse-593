const prisma = require('../utils/prismaClient');

const SORT_FIELDS = ['date', 'registeredCount', 'createdAt'];
const REQUIRED_FIELDS = ['title', 'description', 'category', 'date', 'location'];

function creatorSelect() {
  return { select: { id: true, name: true, email: true } };
}

// GET /api/events
async function getAllEvents(req, res) {
  try {
    const {
      category,
      startDate,
      endDate,
      location,
      isFree,
      sortBy = 'date',
      page = 1,
      limit = 10,
      includeBlocked,
    } = req.query;

    const where = {};

    if (category) where.category = category;
    if (location) where.location = { contains: location, mode: 'insensitive' };
    if (isFree !== undefined) where.isFree = isFree === 'true';

    // Blocked events are hidden everywhere, including for the admin, on the public Home/Events pages.
    // Only the admin dashboard's event management table explicitly opts in via includeBlocked=true.
    const canSeeBlocked = includeBlocked === 'true' && req.user?.role === 'CITY_ADMIN';
    if (!canSeeBlocked) {
      where.isBlocked = false;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const orderBy = { [SORT_FIELDS.includes(sortBy) ? sortBy : 'date']: 'asc' };

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 10, 1);
    const skip = (pageNum - 1) * limitNum;

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: { createdBy: creatorSelect() },
      }),
      prisma.event.count({ where }),
    ]);

    return res.status(200).json({
      events,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch events', error: err.message });
  }
}

// GET /api/events/:id
async function getEventById(req, res) {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: { createdBy: creatorSelect() },
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    return res.status(200).json({ event });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch event', error: err.message });
  }
}

// POST /api/events - requires CITY_ADMIN
async function createEvent(req, res) {
  try {
    const { title, description, category, date, location, capacity, isFree, price } = req.body;

    const missing = REQUIRED_FIELDS.filter((field) => !req.body[field]);
    if (missing.length > 0) {
      return res.status(400).json({ success: false, message: `Missing required fields: ${missing.join(', ')}` });
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        category,
        date: new Date(date),
        location,
        capacity: capacity !== undefined ? parseInt(capacity, 10) : null,
        isFree: isFree !== undefined ? Boolean(isFree) : true,
        price: price !== undefined ? parseFloat(price) : 0,
        createdById: req.user.id,
      },
    });

    return res.status(201).json({ event });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create event', error: err.message });
  }
}

// PUT /api/events/:id - requires CITY_ADMIN
async function updateEvent(req, res) {
  try {
    const { id } = req.params;
    const { title, description, category, date, location, capacity, isFree, price } = req.body;

    const existingEvent = await prisma.event.findUnique({ where: { id } });
    if (!existingEvent) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(location !== undefined && { location }),
        ...(capacity !== undefined && { capacity: parseInt(capacity, 10) }),
        ...(isFree !== undefined && { isFree: Boolean(isFree) }),
        ...(price !== undefined && { price: parseFloat(price) }),
      },
    });

    return res.status(200).json({ event });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update event', error: err.message });
  }
}

// DELETE /api/events/:id - requires CITY_ADMIN
async function deleteEvent(req, res) {
  try {
    const { id } = req.params;

    const existingEvent = await prisma.event.findUnique({ where: { id } });
    if (!existingEvent) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    await prisma.event.delete({ where: { id } });

    return res.status(200).json({ success: true, message: 'Event deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete event', error: err.message });
  }
}

// POST /api/events/:id/register - requires authentication
async function registerForEvent(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.capacity !== null && event.registeredCount >= event.capacity) {
      return res.status(400).json({ success: false, message: 'Event has reached full capacity' });
    }

    const existingRegistration = await prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId: id, userId } },
    });

    if (existingRegistration) {
      return res.status(409).json({ success: false, message: 'You are already registered for this event' });
    }

    await prisma.$transaction([
      prisma.eventRegistration.create({ data: { eventId: id, userId } }),
      prisma.event.update({ where: { id }, data: { registeredCount: { increment: 1 } } }),
    ]);

    return res.status(201).json({ success: true, message: 'Successfully registered for event' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to register for event', error: err.message });
  }
}

// GET /api/events/categories
async function getEventCategories(req, res) {
  try {
    const counts = await prisma.event.groupBy({
      by: ['category'],
      _count: { category: true },
    });

    const categories = counts.map((c) => ({ category: c.category, count: c._count.category }));

    return res.status(200).json({ categories });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch event categories', error: err.message });
  }
}

// POST /api/events/:id/flag - requires authentication, any role
async function flagEvent(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'A reason is required to flag this event' });
    }

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const flag = await prisma.eventFlag.create({
      data: {
        eventId: id,
        flaggedById: req.user.id,
        reason: reason.trim(),
      },
    });

    return res.status(201).json({ success: true, message: 'Thank you, your report has been submitted to the admin', flag });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to flag event', error: err.message });
  }
}

// GET /api/events/flags - requires CITY_ADMIN
async function getEventFlags(req, res) {
  try {
    const flags = await prisma.eventFlag.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        event: { select: { id: true, title: true, isBlocked: true } },
        flaggedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return res.status(200).json({ flags });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch flagged content', error: err.message });
  }
}

// PUT /api/events/:id/block - requires CITY_ADMIN
// Toggles whether an event is hidden from public listings; also marks its flags as reviewed
async function setEventBlockedStatus(req, res) {
  try {
    const { id } = req.params;
    const { isBlocked } = req.body;

    if (typeof isBlocked !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isBlocked must be a boolean' });
    }

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const [updatedEvent] = await prisma.$transaction([
      prisma.event.update({ where: { id }, data: { isBlocked } }),
      prisma.eventFlag.updateMany({ where: { eventId: id, status: 'PENDING' }, data: { status: 'REVIEWED' } }),
    ]);

    return res.status(200).json({ event: updatedEvent });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update event status', error: err.message });
  }
}

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  getEventCategories,
  flagEvent,
  getEventFlags,
  setEventBlockedStatus,
};
