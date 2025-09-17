import { Router } from 'express';
import { JourneyController } from '../controllers/journeyController';
import { JourneyRepository } from '../repositories/journeyRepository';
import { JourneyExecutor } from '../services/journeyExecutor';

const router = Router();

// Initialize dependencies
const journeyRepository = new JourneyRepository();
const journeyExecutor = new JourneyExecutor(journeyRepository);
const journeyController = new JourneyController(journeyRepository, journeyExecutor);

/**
 * @swagger
 * /api/journeys:
 *   post:
 *     summary: Create a new journey
 *     description: Creates a new patient care journey with defined nodes and flow
 *     tags: [Journeys]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, start_node_id, nodes]
 *             properties:
 *               name:
 *                 type: string
 *                 description: Human-readable name for the journey
 *                 example: "Hip Replacement Recovery Journey"
 *               start_node_id:
 *                 type: string
 *                 description: ID of the first node to execute
 *                 example: "welcome"
 *               nodes:
 *                 type: array
 *                 description: Array of journey nodes
 *                 items:
 *                   oneOf:
 *                     - $ref: '#/components/schemas/MessageNode'
 *                     - $ref: '#/components/schemas/DelayNode'
 *                     - $ref: '#/components/schemas/ConditionalNode'
 *           examples:
 *             simple_journey:
 *               summary: Simple journey example
 *               value:
 *                 name: "Simple Test Journey"
 *                 start_node_id: "welcome"
 *                 nodes:
 *                   - id: "welcome"
 *                     type: "MESSAGE"
 *                     message: "Welcome to your journey!"
 *                     next_node_id: "wait"
 *                   - id: "wait"
 *                     type: "DELAY"
 *                     duration_seconds: 5
 *                     next_node_id: "followup"
 *                   - id: "followup"
 *                     type: "MESSAGE"
 *                     message: "How are you feeling?"
 *                     next_node_id: null
 *     responses:
 *       201:
 *         description: Journey created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 journeyId:
 *                   type: string
 *                   format: uuid
 *                   description: Unique identifier for the created journey
 *                   example: "123e4567-e89b-12d3-a456-426614174000"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/journeys', journeyController.createJourney);

/**
 * @swagger
 * /api/journeys:
 *   get:
 *     summary: Get all journeys
 *     description: Retrieves a list of all created journeys
 *     tags: [Journeys]
 *     responses:
 *       200:
 *         description: List of journeys retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 journeys:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Journey'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/journeys', journeyController.getAllJourneys);

/**
 * @swagger
 * /api/journeys/{journeyId}:
 *   get:
 *     summary: Get a specific journey
 *     description: Retrieves details of a specific journey by its ID
 *     tags: [Journeys]
 *     parameters:
 *       - in: path
 *         name: journeyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the journey
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Journey details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Journey'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/journeys/:journeyId', journeyController.getJourney);

/**
 * @swagger
 * /api/journeys/{journeyId}/trigger:
 *   post:
 *     summary: Trigger a journey for a patient
 *     description: Starts executing a journey for a specific patient with their context
 *     tags: [Execution]
 *     parameters:
 *       - in: path
 *         name: journeyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the journey to trigger
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PatientContext'
 *           examples:
 *             senior_patient:
 *               summary: Senior patient example
 *               value:
 *                 id: "patient-001"
 *                 age: 72
 *                 language: "en"
 *                 condition: "liver_replacement"
 *             young_patient:
 *               summary: Young patient example
 *               value:
 *                 id: "patient-002"
 *                 age: 45
 *                 language: "es"
 *                 condition: "knee_replacement"
 *     responses:
 *       202:
 *         description: Journey triggered successfully
 *         headers:
 *           Location:
 *             description: URL to monitor the journey run status
 *             schema:
 *               type: string
 *               example: "/journeys/runs/456e7890-e89b-12d3-a456-426614174001"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 runId:
 *                   type: string
 *                   format: uuid
 *                   description: Unique identifier for the journey run
 *                   example: "456e7890-e89b-12d3-a456-426614174001"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/journeys/:journeyId/trigger', journeyController.triggerJourney);

/**
 * @swagger
 * /api/journeys/runs/{runId}:
 *   get:
 *     summary: Get journey run status
 *     description: Retrieves the current status and details of a journey run
 *     tags: [Execution]
 *     parameters:
 *       - in: path
 *         name: runId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the journey run
 *         example: "456e7890-e89b-12d3-a456-426614174001"
 *     responses:
 *       200:
 *         description: Journey run status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JourneyRun'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/journeys/runs/:runId', journeyController.getJourneyRunStatus);

export { router as journeyRoutes, journeyExecutor };