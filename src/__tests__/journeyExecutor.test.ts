import { JourneyExecutor } from '../services/journeyExecutor';
import { JourneyRepository } from '../repositories/journeyRepository';
import { Journey, PatientContext, JourneyRun } from '../types/journey';

// Mock the repository
jest.mock('../repositories/journeyRepository');

describe('JourneyExecutor', () => {
  let journeyExecutor: JourneyExecutor;
  let mockJourneyRepository: jest.Mocked<JourneyRepository>;

  const mockPatientContext: PatientContext = {
    id: 'patient-123',
    age: 65,
    language: 'en',
    condition: 'liver_replacement'
  };

  beforeEach(() => {
    mockJourneyRepository = new JourneyRepository() as jest.Mocked<JourneyRepository>;
    journeyExecutor = new JourneyExecutor(mockJourneyRepository);
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('startJourney', () => {
    it('should start a journey successfully', async () => {
      const mockJourney: Journey = {
        id: 'journey-123',
        name: 'Test Journey',
        start_node_id: 'node-1',
        nodes: [
          {
            id: 'node-1',
            type: 'MESSAGE',
            message: 'Welcome to your journey',
            next_node_id: null
          }
        ]
      };

      const mockRunId = 'run-123';

      mockJourneyRepository.getJourneyById.mockResolvedValue(mockJourney);
      mockJourneyRepository.createJourneyRun.mockResolvedValue(mockRunId);
      mockJourneyRepository.updateJourneyRun.mockResolvedValue();

      const runId = await journeyExecutor.startJourney('journey-123', mockPatientContext);

      expect(runId).toBe(mockRunId);
      expect(mockJourneyRepository.getJourneyById).toHaveBeenCalledWith('journey-123');
      expect(mockJourneyRepository.createJourneyRun).toHaveBeenCalledWith(
        'journey-123',
        mockPatientContext,
        'node-1'
      );
    });

    it('should throw error if journey not found', async () => {
      mockJourneyRepository.getJourneyById.mockResolvedValue(null);

      await expect(journeyExecutor.startJourney('non-existent', mockPatientContext))
        .rejects.toThrow('Journey with id non-existent not found');
    });
  });

  describe('executeNode - MESSAGE', () => {
    it('should execute message node and return next node id', async () => {
      const mockJourney: Journey = {
        id: 'journey-123',
        name: 'Test Journey',
        start_node_id: 'node-1',
        nodes: [
          {
            id: 'node-1',
            type: 'MESSAGE',
            message: 'Test message',
            next_node_id: 'node-2'
          }
        ]
      };

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      mockJourneyRepository.getJourneyById.mockResolvedValue(mockJourney);
      mockJourneyRepository.createJourneyRun.mockResolvedValue('run-123');
      mockJourneyRepository.updateJourneyRun.mockResolvedValue();

      await journeyExecutor.startJourney('journey-123', mockPatientContext);

      // Wait for async execution
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[MESSAGE] Sending message to patient patient-123: "Test message"')
      );

      consoleLogSpy.mockRestore();
    });
  });

  describe('executeNode - DELAY', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should execute delay node and wait for specified duration', async () => {
      const mockJourney: Journey = {
        id: 'journey-123',
        name: 'Test Journey',
        start_node_id: 'node-1',
        nodes: [
          {
            id: 'node-1',
            type: 'DELAY',
            duration_seconds: 5,
            next_node_id: null
          }
        ]
      };

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      mockJourneyRepository.getJourneyById.mockResolvedValue(mockJourney);
      mockJourneyRepository.createJourneyRun.mockResolvedValue('run-123');
      mockJourneyRepository.updateJourneyRun.mockResolvedValue();

      const startPromise = journeyExecutor.startJourney('journey-123', mockPatientContext);

      // Fast-forward time
      jest.advanceTimersByTime(5000);

      await startPromise;

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DELAY] Waiting 5 seconds before next action...')
      );

      consoleLogSpy.mockRestore();
    });
  });

  describe('executeNode - CONDITIONAL', () => {
    it('should execute conditional node with true condition', async () => {
      const mockJourney: Journey = {
        id: 'journey-123',
        name: 'Test Journey',
        start_node_id: 'node-1',
        nodes: [
          {
            id: 'node-1',
            type: 'CONDITIONAL',
            condition: {
              field: 'age',
              operator: 'gt',
              value: 60
            },
            on_true_next_node_id: 'node-2',
            on_false_next_node_id: 'node-3'
          }
        ]
      };

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      mockJourneyRepository.getJourneyById.mockResolvedValue(mockJourney);
      mockJourneyRepository.createJourneyRun.mockResolvedValue('run-123');
      mockJourneyRepository.updateJourneyRun.mockResolvedValue();

      await journeyExecutor.startJourney('journey-123', mockPatientContext);

      // Wait for async execution
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[CONDITIONAL] Condition result: true')
      );

      consoleLogSpy.mockRestore();
    });

    it('should execute conditional node with false condition', async () => {
      const mockJourney: Journey = {
        id: 'journey-123',
        name: 'Test Journey',
        start_node_id: 'node-1',
        nodes: [
          {
            id: 'node-1',
            type: 'CONDITIONAL',
            condition: {
              field: 'age',
              operator: 'lt',
              value: 30
            },
            on_true_next_node_id: 'node-2',
            on_false_next_node_id: 'node-3'
          }
        ]
      };

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      mockJourneyRepository.getJourneyById.mockResolvedValue(mockJourney);
      mockJourneyRepository.createJourneyRun.mockResolvedValue('run-123');
      mockJourneyRepository.updateJourneyRun.mockResolvedValue();

      await journeyExecutor.startJourney('journey-123', mockPatientContext);

      // Wait for async execution
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[CONDITIONAL] Condition result: false')
      );

      consoleLogSpy.mockRestore();
    });
  });

  describe('getJourneyRunStatus', () => {
    it('should return journey run status', async () => {
      const mockRun: JourneyRun = {
        id: 'run-123',
        journey_id: 'journey-123',
        patient_context: mockPatientContext,
        status: 'in_progress',
        current_node_id: 'node-1',
        created_at: new Date(),
        updated_at: new Date()
      };

      mockJourneyRepository.getJourneyRunById.mockResolvedValue(mockRun);

      const result = await journeyExecutor.getJourneyRunStatus('run-123');

      expect(result).toBe(mockRun);
      expect(mockJourneyRepository.getJourneyRunById).toHaveBeenCalledWith('run-123');
    });
  });
});