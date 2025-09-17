import request from 'supertest';
import express from 'express';
import { JourneyController } from '../controllers/journeyController';
import { JourneyRepository } from '../repositories/journeyRepository';
import { JourneyExecutor } from '../services/journeyExecutor';
import { Journey, PatientContext, JourneyRun } from '../types/journey';

// Mock dependencies
jest.mock('../repositories/journeyRepository');
jest.mock('../services/journeyExecutor');

describe('JourneyController', () => {
  let app: express.Application;
  let mockJourneyRepository: jest.Mocked<JourneyRepository>;
  let mockJourneyExecutor: jest.Mocked<JourneyExecutor>;
  let journeyController: JourneyController;

  beforeEach(() => {
    mockJourneyRepository = new JourneyRepository() as jest.Mocked<JourneyRepository>;
    mockJourneyExecutor = new JourneyExecutor(mockJourneyRepository) as jest.Mocked<JourneyExecutor>;
    journeyController = new JourneyController(mockJourneyRepository, mockJourneyExecutor);

    app = express();
    app.use(express.json());

    // Setup routes
    app.post('/journeys', journeyController.createJourney);
    app.post('/journeys/:journeyId/trigger', journeyController.triggerJourney);
    app.get('/journeys/runs/:runId', journeyController.getJourneyRunStatus);
    app.get('/journeys', journeyController.getAllJourneys);
    app.get('/journeys/:journeyId', journeyController.getJourney);

    jest.clearAllMocks();
  });

  describe('POST /journeys', () => {
    const validJourney = {
      name: 'Test Journey',
      start_node_id: 'node-1',
      nodes: [
        {
          id: 'node-1',
          type: 'MESSAGE',
          message: 'Welcome message',
          next_node_id: null
        }
      ]
    };

    it('should create a journey successfully', async () => {
      const mockJourneyId = 'journey-123';
      mockJourneyRepository.createJourney.mockResolvedValue(mockJourneyId);

      const response = await request(app)
        .post('/journeys')
        .send(validJourney)
        .expect(201);

      expect(response.body).toEqual({ journeyId: mockJourneyId });
      expect(mockJourneyRepository.createJourney).toHaveBeenCalledWith(validJourney);
    });

    it('should return 400 for invalid journey structure', async () => {
      const invalidJourney = {
        name: 'Test Journey',
        // Missing start_node_id and nodes
      };

      const response = await request(app)
        .post('/journeys')
        .send(invalidJourney)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for journey with invalid node references', async () => {
      const invalidJourney = {
        name: 'Test Journey',
        start_node_id: 'non-existent-node',
        nodes: [
          {
            id: 'node-1',
            type: 'MESSAGE',
            message: 'Welcome message',
            next_node_id: null
          }
        ]
      };

      const response = await request(app)
        .post('/journeys')
        .send(invalidJourney)
        .expect(400);

      expect(response.body.error).toContain('start_node_id must reference an existing node');
    });
  });

  describe('POST /journeys/:journeyId/trigger', () => {
    const validPatientContext: PatientContext = {
      id: 'patient-123',
      age: 65,
      language: 'en',
      condition: 'liver_replacement'
    };

    const mockJourney: Journey = {
      id: 'journey-123',
      name: 'Test Journey',
      start_node_id: 'node-1',
      nodes: [
        {
          id: 'node-1',
          type: 'MESSAGE',
          message: 'Welcome message',
          next_node_id: null
        }
      ]
    };

    it('should trigger a journey successfully', async () => {
      const mockRunId = 'run-123';
      mockJourneyRepository.getJourneyById.mockResolvedValue(mockJourney);
      mockJourneyExecutor.startJourney.mockResolvedValue(mockRunId);

      const response = await request(app)
        .post('/journeys/journey-123/trigger')
        .send(validPatientContext)
        .expect(202);

      expect(response.body).toEqual({ runId: mockRunId });
      expect(response.headers.location).toBe('/journeys/runs/run-123');
      expect(mockJourneyExecutor.startJourney).toHaveBeenCalledWith('journey-123', validPatientContext);
    });

    it('should return 404 for non-existent journey', async () => {
      mockJourneyRepository.getJourneyById.mockResolvedValue(null);

      const response = await request(app)
        .post('/journeys/non-existent/trigger')
        .send(validPatientContext)
        .expect(404);

      expect(response.body.error).toBe('Journey not found');
    });

    it('should return 400 for invalid patient context', async () => {
      const invalidPatientContext = {
        id: 'patient-123',
        age: -5, // Invalid age
        language: 'fr', // Invalid language
        condition: 'liver_replacement'
      };

      mockJourneyRepository.getJourneyById.mockResolvedValue(mockJourney);

      const response = await request(app)
        .post('/journeys/journey-123/trigger')
        .send(invalidPatientContext)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /journeys/runs/:runId', () => {
    it('should return journey run status', async () => {
      const mockRun: JourneyRun = {
        id: 'run-123',
        journey_id: 'journey-123',
        patient_context: {
          id: 'patient-123',
          age: 65,
          language: 'en',
          condition: 'liver_replacement'
        },
        status: 'in_progress',
        current_node_id: 'node-1',
        created_at: new Date('2024-01-01T10:00:00Z'),
        updated_at: new Date('2024-01-01T10:05:00Z')
      };

      mockJourneyExecutor.getJourneyRunStatus.mockResolvedValue(mockRun);

      const response = await request(app)
        .get('/journeys/runs/run-123')
        .expect(200);

      expect(response.body).toMatchObject({
        runId: 'run-123',
        status: 'in_progress',
        currentNodeId: 'node-1',
        patientContext: mockRun.patient_context
      });
      expect(mockJourneyExecutor.getJourneyRunStatus).toHaveBeenCalledWith('run-123');
    });

    it('should return 404 for non-existent run', async () => {
      mockJourneyExecutor.getJourneyRunStatus.mockResolvedValue(null);

      const response = await request(app)
        .get('/journeys/runs/non-existent')
        .expect(404);

      expect(response.body.error).toBe('Journey run not found');
    });
  });

  describe('GET /journeys', () => {
    it('should return all journeys', async () => {
      const mockJourneys: Journey[] = [
        {
          id: 'journey-1',
          name: 'Journey 1',
          start_node_id: 'node-1',
          nodes: []
        },
        {
          id: 'journey-2',
          name: 'Journey 2',
          start_node_id: 'node-1',
          nodes: []
        }
      ];

      mockJourneyRepository.getAllJourneys.mockResolvedValue(mockJourneys);

      const response = await request(app)
        .get('/journeys')
        .expect(200);

      expect(response.body).toEqual({ journeys: mockJourneys });
      expect(mockJourneyRepository.getAllJourneys).toHaveBeenCalled();
    });
  });

  describe('GET /journeys/:journeyId', () => {
    it('should return a specific journey', async () => {
      const mockJourney: Journey = {
        id: 'journey-123',
        name: 'Test Journey',
        start_node_id: 'node-1',
        nodes: []
      };

      mockJourneyRepository.getJourneyById.mockResolvedValue(mockJourney);

      const response = await request(app)
        .get('/journeys/journey-123')
        .expect(200);

      expect(response.body).toEqual(mockJourney);
      expect(mockJourneyRepository.getJourneyById).toHaveBeenCalledWith('journey-123');
    });

    it('should return 404 for non-existent journey', async () => {
      mockJourneyRepository.getJourneyById.mockResolvedValue(null);

      const response = await request(app)
        .get('/journeys/non-existent')
        .expect(404);

      expect(response.body.error).toBe('Journey not found');
    });
  });
});