import swaggerJSDoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Online Course Platform API',
      version: '1.0.0'
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    paths: {
      '/api/auth/register': {
        post: {
          summary: 'Register user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string' },
                    password: { type: 'string' },
                    role: { type: 'string', enum: ['STUDENT', 'INSTRUCTOR'] }
                  },
                  required: ['email', 'password']
                }
              }
            }
          },
          responses: {
            201: { description: 'Created' },
            400: { description: 'Invalid input' },
            409: { description: 'Email already exists' }
          }
        }
      },
      '/api/auth/login': {
        post: {
          summary: 'Login',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string' },
                    password: { type: 'string' }
                  },
                  required: ['email', 'password']
                }
              }
            }
          },
          responses: {
            200: { description: 'OK' },
            400: { description: 'Invalid input' },
            401: { description: 'Invalid credentials' }
          }
        }
      },
      '/api/courses': {
        get: {
          summary: 'List published courses',
          responses: { 200: { description: 'OK' } }
        },
        post: {
          summary: 'Create course (Instructor/Admin)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    published: { type: 'boolean' },
                    lessons: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          title: { type: 'string' },
                          content: { type: 'string' }
                        },
                        required: ['title']
                      }
                    }
                  },
                  required: ['title']
                }
              }
            }
          },
          responses: {
            201: { description: 'Created' },
            401: { description: 'Unauthorized' },
            403: { description: 'Forbidden' }
          }
        }
      },
      '/api/courses/{id}': {
        get: {
          summary: 'Get published course by id',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: 'OK' },
            404: { description: 'Not found' }
          }
        }
      },
      '/api/enrollments': {
        post: {
          summary: 'Enroll in a course (Student/Admin)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    courseId: { type: 'integer' }
                  },
                  required: ['courseId']
                }
              }
            }
          },
          responses: {
            201: { description: 'Created' },
            401: { description: 'Unauthorized' },
            403: { description: 'Forbidden' },
            409: { description: 'Already enrolled' }
          }
        }
      }
    }
  },
  apis: []
});
