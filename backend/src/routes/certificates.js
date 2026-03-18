import { Router } from 'express';

import { prisma } from '../lib/prisma.js';
import { authRequired, requireRole } from '../middleware/auth.js';

export const certificatesRouter = Router();

certificatesRouter.get('/', authRequired, requireRole('STUDENT', 'ADMIN'), async (req, res) => {
  const userId = req.user.sub;

  const certs = await prisma.certificate.findMany({
    where: { userId },
    orderBy: { issuedAt: 'desc' },
    select: {
      id: true,
      courseId: true,
      issuedAt: true,
      course: {
        select: {
          id: true,
          title: true,
          bannerUrl: true,
          instructor: { select: { id: true, email: true } },
          reviews: {
            where: { userId },
            select: { id: true, rating: true, comment: true }
          }
        }
      }
    }
  });

  return res.json(certs);
});

certificatesRouter.delete('/:id', authRequired, requireRole('ADMIN'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ message: 'Invalid id' });

  const cert = await prisma.certificate.findUnique({ where: { id } });
  if (!cert) return res.status(404).json({ message: 'Not found' });

  await prisma.certificate.delete({ where: { id } });
  return res.status(204).send();
});
