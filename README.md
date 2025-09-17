# RevelAi Health - Patient Care Journey Backend

A backend engine for orchestrating AI-driven patient care journeys using TypeScript, Express, and PostgreSQL.

## Features

- **Journey Management**: Create and manage complex patient care journeys
- **Node Types**: Support for MESSAGE, DELAY, and CONDITIONAL nodes
- **Real-time Execution**: Asynchronous journey execution with state tracking
- **Patient Context**: Personalized journeys based on patient data
- **Monitoring**: Real-time monitoring of journey run status
- **Database Persistence**: PostgreSQL for reliable data storage
- **Production Ready**: Robust error handling and validation

## Tech Stack

- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (Neon)
- **Documentation**: Swagger/OpenAPI
- **Async Processing**: Native setTimeout (extensible to BullMQ/Redis)

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database access
- npm or yarn

### Installation

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
# The database URL is already configured in the code
# You can override it by creating a .env file:
PORT=3000
NODE_ENV=development
DATABASE_URL=your_postgresql_connection_string
```

3. Build the project:
```bash
npm run build
```

4. Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

### API Documentation

Once the server is running, you can access the interactive API documentation at:
- **Swagger UI**: http://localhost:3000/api-docs

The Swagger interface provides:
- Interactive API testing
- Complete endpoint documentation
- Request/response examples
- Schema definitions
- Easy-to-use forms for testing all endpoints

### Database Setup

The application automatically initializes the database schema on startup. The schema includes:
- `journeys` table for storing journey definitions
- `journey_runs` table for tracking execution state
- Indexes for optimal performance
- Triggers for automatic timestamp updates

## API Endpoints

### Journey Management

#### Create Journey
```http
POST /api/journeys
Content-Type: application/json

{
  "name": "Hip Replacement Recovery Journey",
  "start_node_id": "welcome",
  "nodes": [
    {
      "id": "welcome",
      "type": "MESSAGE",
      "message": "Welcome to your recovery journey!",
      "next_node_id": "age_check"
    },
    {
      "id": "age_check",
      "type": "CONDITIONAL",
      "condition": {
        "field": "age",
        "operator": "gte",
        "value": 65
      },
      "on_true_next_node_id": "senior_care",
      "on_false_next_node_id": "standard_care"
    }
  ]
}
```

#### Get All Journeys
```http
GET /api/journeys
```

#### Get Specific Journey
```http
GET /api/journeys/{journeyId}
```

### Journey Execution

#### Trigger Journey
```http
POST /api/journeys/{journeyId}/trigger
Content-Type: application/json

{
  "id": "patient-123",
  "age": 72,
  "language": "en",
  "condition": "liver_replacement"
}
```

#### Monitor Journey Run
```http
GET /api/journeys/runs/{runId}
```

### Health Check
```http
GET /health
```

### Interactive Documentation
```http
GET /api-docs
```
Access the Swagger UI interface for interactive API testing and complete documentation.

## Node Types

### MESSAGE Node
Sends a message to the patient (stubbed with console.log).

```json
{
  "id": "welcome",
  "type": "MESSAGE",
  "message": "Welcome to your journey!",
  "next_node_id": "next_step"
}
```

### DELAY Node
Introduces a waiting period before the next action.

```json
{
  "id": "wait_24h",
  "type": "DELAY",
  "duration_seconds": 86400,
  "next_node_id": "followup"
}
```

### CONDITIONAL Node
Branches the journey based on patient data.

```json
{
  "id": "age_check",
  "type": "CONDITIONAL",
  "condition": {
    "field": "age",
    "operator": "gt",
    "value": 60
  },
  "on_true_next_node_id": "senior_care",
  "on_false_next_node_id": "standard_care"
}
```

#### Supported Operators
- `eq`: Equal to
- `ne`: Not equal to
- `gt`: Greater than
- `gte`: Greater than or equal to
- `lt`: Less than
- `lte`: Less than or equal to
- `in`: Value is in array
- `nin`: Value is not in array

## Patient Context

Patient context supports the following fields:

```typescript
interface PatientContext {
  id: string;
  age: number;
  language: 'en' | 'es';
  condition: 'liver_replacement' | 'knee_replacement';
  [key: string]: any; // Additional dynamic fields
}
```

## Example Usage

### 1. Create a Journey

```bash
curl -X POST http://localhost:3000/api/journeys \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Hip Replacement Recovery Journey",
    "start_node_id": "welcome",
    "nodes": [
      {
        "id": "welcome",
        "type": "MESSAGE",
        "message": "Welcome to your recovery journey!",
        "next_node_id": "age_check"
      },
      {
        "id": "age_check",
        "type": "CONDITIONAL",
        "condition": {
          "field": "age",
          "operator": "gte",
          "value": 65
        },
        "on_true_next_node_id": "senior_care",
        "on_false_next_node_id": "standard_care"
      }
    ]
  }'
```

### 2. Trigger a Journey

```bash
curl -X POST http://localhost:3000/api/journeys/{journeyId}/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "id": "patient-123",
    "age": 72,
    "language": "en",
    "condition": "hip_replacement"
  }'
```

### 3. Monitor Execution

```bash
curl http://localhost:3000/api/journeys/runs/{runId}
```

## Architecture

### Core Components

- **JourneyExecutor**: Orchestrates journey execution and node processing
- **JourneyRepository**: Database operations for journeys and runs
- **JourneyController**: HTTP request handling and validation
- **Database Layer**: PostgreSQL with connection pooling

### State Management

Journey runs are persisted in the database with the following states:
- `in_progress`: Currently executing
- `completed`: Successfully finished
- `failed`: Encountered an error

### Scalability Considerations

- **Database Connection Pooling**: Efficient connection management
- **Async Processing**: Non-blocking journey execution
- **State Persistence**: Survives server restarts
- **Extensible Design**: Easy to add new node types or integrate message queues

## Development

### Project Structure

```
src/
├── controllers/         # HTTP request handlers
├── database/           # Database connection and schema
├── repositories/       # Data access layer
├── routes/            # API route definitions
├── services/          # Business logic
├── types/             # TypeScript interfaces
├── config/            # Configuration files (Swagger)
└── app.ts             # Application entry point
```

### Adding New Node Types

1. Extend the `JourneyNode` type in `src/types/journey.ts`
2. Add validation logic in `JourneyController`
3. Implement execution logic in `JourneyExecutor.executeNode()`

### Environment Variables

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `DATABASE_URL`: PostgreSQL connection string

## Production Considerations

- Set up proper logging (consider Winston or similar)
- Implement rate limiting
- Add authentication/authorization
- Set up monitoring and alerting
- Consider using Redis + BullMQ for production-grade queue management
- Implement proper error reporting (Sentry, etc.)
- Set up database migrations
- Configure SSL/TLS for database connections

## License

MIT License - see LICENSE file for details.