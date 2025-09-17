import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RevelAi Health - Patient Care Journey API',
      version: '1.0.0',
      description: `
        A backend engine for orchestrating AI-driven patient care journeys.
        
        ## Features
        - Create and manage patient care journeys
        - Support for MESSAGE, DELAY, and CONDITIONAL nodes
        - Real-time journey execution monitoring
        - Persistent state management
        
        ## Journey Node Types
        - **MESSAGE**: Sends a message to the patient
        - **DELAY**: Introduces a waiting period
        - **CONDITIONAL**: Branches based on patient data
        
        ## Getting Started
        1. Create a journey using POST /api/journeys
        2. Trigger the journey for a patient using POST /api/journeys/{journeyId}/trigger
        3. Monitor execution using GET /api/journeys/runs/{runId}
      `,
      contact: {
        name: 'RevelAi Health',
        email: 'support@revelai.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    tags: [
      {
        name: 'Journeys',
        description: 'Journey management operations'
      },
      {
        name: 'Execution',
        description: 'Journey execution and monitoring'
      },
      {
        name: 'Health',
        description: 'System health checks'
      }
    ],
    components: {
      schemas: {
        Journey: {
          type: 'object',
          required: ['name', 'start_node_id', 'nodes'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the journey',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            name: {
              type: 'string',
              description: 'Human-readable name for the journey',
              example: 'Hip Replacement Recovery Journey'
            },
            start_node_id: {
              type: 'string',
              description: 'ID of the first node to execute',
              example: 'welcome'
            },
            nodes: {
              type: 'array',
              description: 'Array of journey nodes',
              items: {
                oneOf: [
                  { $ref: '#/components/schemas/MessageNode' },
                  { $ref: '#/components/schemas/DelayNode' },
                  { $ref: '#/components/schemas/ConditionalNode' }
                ]
              }
            }
          }
        },
        MessageNode: {
          type: 'object',
          required: ['id', 'type', 'message'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the node',
              example: 'welcome'
            },
            type: {
              type: 'string',
              enum: ['MESSAGE'],
              description: 'Node type for sending messages'
            },
            message: {
              type: 'string',
              description: 'Message content to send to patient',
              example: 'Welcome to your recovery journey!'
            },
            next_node_id: {
              type: 'string',
              nullable: true,
              description: 'ID of the next node to execute, null for end',
              example: 'age_check'
            }
          }
        },
        DelayNode: {
          type: 'object',
          required: ['id', 'type', 'duration_seconds'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the node',
              example: 'wait_24h'
            },
            type: {
              type: 'string',
              enum: ['DELAY'],
              description: 'Node type for delays'
            },
            duration_seconds: {
              type: 'integer',
              minimum: 0,
              description: 'Duration to wait in seconds',
              example: 86400
            },
            next_node_id: {
              type: 'string',
              nullable: true,
              description: 'ID of the next node to execute, null for end',
              example: 'followup'
            }
          }
        },
        ConditionalNode: {
          type: 'object',
          required: ['id', 'type', 'condition'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the node',
              example: 'age_check'
            },
            type: {
              type: 'string',
              enum: ['CONDITIONAL'],
              description: 'Node type for conditional branching'
            },
            condition: {
              $ref: '#/components/schemas/Condition'
            },
            on_true_next_node_id: {
              type: 'string',
              nullable: true,
              description: 'Next node if condition is true',
              example: 'senior_care'
            },
            on_false_next_node_id: {
              type: 'string',
              nullable: true,
              description: 'Next node if condition is false',
              example: 'standard_care'
            }
          }
        },
        Condition: {
          type: 'object',
          required: ['field', 'operator', 'value'],
          properties: {
            field: {
              type: 'string',
              description: 'Patient context field to evaluate',
              example: 'age'
            },
            operator: {
              type: 'string',
              enum: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin'],
              description: 'Comparison operator',
              example: 'gte'
            },
            value: {
              description: 'Value to compare against',
              example: 65
            }
          }
        },
        PatientContext: {
          type: 'object',
          required: ['id', 'age', 'language', 'condition'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique patient identifier',
              example: 'patient-123'
            },
            age: {
              type: 'integer',
              minimum: 0,
              description: 'Patient age in years',
              example: 72
            },
            language: {
              type: 'string',
              enum: ['en', 'es'],
              description: 'Patient preferred language',
              example: 'en'
            },
            condition: {
              type: 'string',
              enum: ['liver_replacement', 'knee_replacement'],
              description: 'Patient medical condition',
              example: 'liver_replacement'
            }
          },
          additionalProperties: true
        },
        JourneyRun: {
          type: 'object',
          properties: {
            runId: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the journey run',
              example: '123e4567-e89b-12d3-a456-426614174001'
            },
            status: {
              type: 'string',
              enum: ['in_progress', 'completed', 'failed'],
              description: 'Current status of the journey run',
              example: 'in_progress'
            },
            currentNodeId: {
              type: 'string',
              nullable: true,
              description: 'ID of the currently executing node',
              example: 'welcome'
            },
            patientContext: {
              $ref: '#/components/schemas/PatientContext'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'When the journey run was created'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'When the journey run was last updated'
            },
            completedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'When the journey run completed (if applicable)'
            }
          }
        },
        Error: {
          type: 'object',
          required: ['error'],
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
              example: 'Journey not found'
            },
            message: {
              type: 'string',
              description: 'Additional error details (development only)'
            }
          }
        },
        HealthStatus: {
          type: 'object',
          required: ['status', 'timestamp'],
          properties: {
            status: {
              type: 'string',
              enum: ['healthy'],
              description: 'Health status of the service'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp of the health check'
            },
            environment: {
              type: 'string',
              description: 'Current environment',
              example: 'development'
            }
          }
        }
      },
      responses: {
        BadRequest: {
          description: 'Bad request - validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        InternalServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts']
};

export const specs = swaggerJsdoc(options);