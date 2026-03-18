import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';
import { authRequired, requireRole } from '../middleware/auth.js';

export const enrollmentsRouter = Router();

const createEnrollmentSchema = z.object({
  courseId: z.number().int().positive()
});

enrollmentsRouter.post('/', authRequired, requireRole('STUDENT', 'ADMIN'), async (req, res) => {
  const parsed = createEnrollmentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input' });

  const userId = req.user.sub;
  const { courseId } = parsed.data;

  try {
    const enrollment = await prisma.$transaction(async (tx) => {
      const course = await tx.course.findFirst({ where: { id: courseId, published: true }, select: { id: true } });
      if (!course) {
        const err = new Error('Course not found');
        err.statusCode = 404;
        throw err;
      }

      return tx.enrollment.create({
        data: { userId, courseId },
        select: { id: true, userId: true, courseId: true, createdAt: true }
      });
    });

    return res.status(201).json(enrollment);
  } catch (e) {
    if (e?.code === 'P2002') return res.status(409).json({ message: 'Already enrolled' });
    if (e?.statusCode) return res.status(e.statusCode).json({ message: e.message });
    return res.status(500).json({ message: 'Server error' });
  }
});
