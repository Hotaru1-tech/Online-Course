import { GraphQLScalarType, Kind } from 'graphql';

export const typeDefs = `#graphql
  enum Role {
    ADMIN
    STUDENT
    INSTRUCTOR
  }

  type User {
    id: Int!
    email: String!
    role: Role!
  }

  type Lesson {
    id: Int!
    title: String!
    content: String
    order: Int!
  }

  type Course {
    id: Int!
    title: String!
    description: String
    published: Boolean!
    instructor: User!
    lessons: [Lesson!]!
  }

  type Enrollment {
    id: Int!
    userId: Int!
    courseId: Int!
    createdAt: DateTime!
  }

  scalar DateTime

  type Query {
    courses: [Course!]!
    course(id: Int!): Course
  }

  type Mutation {
    enroll(courseId: Int!): Enrollment!
  }
`;

const DateTime = new GraphQLScalarType({
  name: 'DateTime',
  serialize: (value) => (value instanceof Date ? value.toISOString() : value),
  parseValue: (value) => new Date(value),
  parseLiteral: (ast) => (ast.kind === Kind.STRING ? new Date(ast.value) : null)
});

export const resolvers = {
  DateTime,
  Query: {
    courses: async (_parent, _args, ctx) => {
      return ctx.prisma.course.findMany({
        where: { published: true },
        orderBy: { createdAt: 'desc' },
        include: {
          instructor: { select: { id: true, email: true, role: true } },
          lessons: { orderBy: { order: 'asc' } }
        }
      });
    },
    course: async (_parent, args, ctx) => {
      return ctx.prisma.course.findFirst({
        where: { id: args.id, published: true },
        include: {
          instructor: { select: { id: true, email: true, role: true } },
          lessons: { orderBy: { order: 'asc' } }
        }
      });
    }
  },
  Mutation: {
    enroll: async (_parent, args, ctx) => {
      if (!ctx.user) throw new Error('Unauthorized');
      if (!['STUDENT', 'ADMIN'].includes(ctx.user.role)) throw new Error('Forbidden');

      const userId = ctx.user.sub;
      const courseId = args.courseId;

      const enrollment = await ctx.prisma.$transaction(async (tx) => {
        const course = await tx.course.findFirst({ where: { id: courseId, published: true }, select: { id: true } });
        if (!course) throw new Error('Not found');
        return tx.enrollment.create({ data: { userId, courseId } });
      });

      return enrollment;
    }
  }
};
