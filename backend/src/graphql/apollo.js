import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import jwt from 'jsonwebtoken';

import { env } from '../lib/env.js';
import { prisma } from '../lib/prisma.js';
import { typeDefs, resolvers } from './schema.js';

export async function mountApollo(app) {
  const server = new ApolloServer({
    typeDefs,
    resolvers
  });

  await server.start();

  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }) => {
        const header = req.headers.authorization;
        let user = null;
        if (header?.startsWith('Bearer ')) {
          const token = header.slice('Bearer '.length);
          try {
            user = jwt.verify(token, env.JWT_SECRET);
          } catch {
            user = null;
          }
        }

        return { prisma, user };
      }
    })
  );
}
