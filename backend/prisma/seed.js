import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminPw = await bcrypt.hash('Admin123!', 10);
  const instructorPw = await bcrypt.hash('Instructor123!', 10);
  const studentPw = await bcrypt.hash('Student123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: { email: 'admin@demo.com', passwordHash: adminPw, role: 'ADMIN' }
  });

  const instructor = await prisma.user.upsert({
    where: { email: 'instructor@demo.com' },
    update: {},
    create: { email: 'instructor@demo.com', passwordHash: instructorPw, role: 'INSTRUCTOR' }
  });

  const student = await prisma.user.upsert({
    where: { email: 'student@demo.com' },
    update: {},
    create: { email: 'student@demo.com', passwordHash: studentPw, role: 'STUDENT' }
  });

  const course = await prisma.course.upsert({
    where: { id: 1 },
    update: {
      title: 'Intro to Web Backend',
      description: 'JWT, RBAC, Prisma, GraphQL, Redis cache.',
      bannerUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1600&q=80',
      published: true
    },
    create: {
      title: 'Intro to Web Backend',
      description: 'JWT, RBAC, Prisma, GraphQL, Redis cache.',
      bannerUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1600&q=80',
      published: true,
      instructorId: instructor.id,
      lessons: {
        create: [
          { title: 'Welcome', order: 1, content: 'Course overview.' },
          { title: 'Auth', order: 2, content: 'JWT login + RBAC.' }
        ]
      }
    }
  });

  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: student.id, courseId: course.id } },
    update: {},
    create: { userId: student.id, courseId: course.id }
  });

  void admin;
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
