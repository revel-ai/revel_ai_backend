"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JourneyController = void 0;
class JourneyController {
    constructor(journeyRepository, journeyExecutor) {
        this.createJourney = async (req, res) => {
            try {
                const journeyData = req.body;
                // Validate the journey structure
                const validationError = this.validateJourney(journeyData);
                if (validationError) {
                    res.status(400).json({ error: validationError });
                    return;
                }
                const journeyId = await this.journeyRepository.createJourney(journeyData);
                res.status(201).json({ journeyId });
            }
            catch (error) {
                console.error('Error creating journey:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        };
        this.triggerJourney = async (req, res) => {
            try {
                const { journeyId } = req.params;
                const patientContext = req.body;
                // Validate patient context
                const validationError = this.validatePatientContext(patientContext);
                if (validationError) {
                    res.status(400).json({ error: validationError });
                    return;
                }
                // Check if journey exists
                const journey = await this.journeyRepository.getJourneyById(journeyId);
                if (!journey) {
                    res.status(404).json({ error: 'Journey not found' });
                    return;
                }
                // Start the journey execution
                const runId = await this.journeyExecutor.startJourney(journeyId, patientContext);
                // Set Location header for monitoring endpoint
                const locationHeader = `/journeys/runs/${runId}`;
                res.set('Location', locationHeader);
                res.status(202).json({ runId });
            }
            catch (error) {
                console.error('Error triggering journey:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        };
        this.getJourneyRunStatus = async (req, res) => {
            try {
                const { runId } = req.params;
                const journeyRun = await this.journeyExecutor.getJourneyRunStatus(runId);
                if (!journeyRun) {
                    res.status(404).json({ error: 'Journey run not found' });
                    return;
                }
                res.status(200).json({
                    runId: journeyRun.id,
                    status: journeyRun.status,
                    currentNodeId: journeyRun.current_node_id,
                    patientContext: journeyRun.patient_context,
                    createdAt: journeyRun.created_at,
                    updatedAt: journeyRun.updated_at,
                    completedAt: journeyRun.completed_at
                });
            }
            catch (error) {
                console.error('Error getting journey run status:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        };
        // Additional endpoint to get all journeys
        this.getAllJourneys = async (req, res) => {
            try {
                const journeys = await this.journeyRepository.getAllJourneys();
                res.status(200).json({ journeys });
            }
            catch (error) {
                console.error('Error getting journeys:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        };
        // Additional endpoint to get a specific journey
        this.getJourney = async (req, res) => {
            try {
                const { journeyId } = req.params;
                const journey = await this.journeyRepository.getJourneyById(journeyId);
                if (!journey) {
                    res.status(404).json({ error: 'Journey not found' });
                    return;
                }
                res.status(200).json(journey);
            }
            catch (error) {
                console.error('Error getting journey:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        };
        this.journeyRepository = journeyRepository;
        this.journeyExecutor = journeyExecutor;
    }
    validateJourney(journey) {
        if (!journey.name || typeof journey.name !== 'string') {
            return 'Journey name is required and must be a string';
        }
        if (!journey.start_node_id || typeof journey.start_node_id !== 'string') {
            return 'Journey start_node_id is required and must be a string';
        }
        if (!Array.isArray(journey.nodes) || journey.nodes.length === 0) {
            return 'Journey must have at least one node';
        }
        // Check if start_node_id exists in nodes
        const startNodeExists = journey.nodes.some(node => node.id === journey.start_node_id);
        if (!startNodeExists) {
            return 'start_node_id must reference an existing node';
        }
        // Validate each node
        for (const node of journey.nodes) {
            const nodeError = this.validateNode(node, journey.nodes);
            if (nodeError) {
                return nodeError;
            }
        }
        return null;
    }
    validateNode(node, allNodes) {
        if (!node.id || typeof node.id !== 'string') {
            return 'Node id is required and must be a string';
        }
        if (!node.type || !['MESSAGE', 'DELAY', 'CONDITIONAL'].includes(node.type)) {
            return 'Node type must be one of: MESSAGE, DELAY, CONDITIONAL';
        }
        switch (node.type) {
            case 'MESSAGE':
                if (!node.message || typeof node.message !== 'string') {
                    return 'MESSAGE node must have a message string';
                }
                break;
            case 'DELAY':
                if (typeof node.duration_seconds !== 'number' || node.duration_seconds < 0) {
                    return 'DELAY node must have a non-negative duration_seconds number';
                }
                break;
            case 'CONDITIONAL':
                if (!node.condition || typeof node.condition !== 'object') {
                    return 'CONDITIONAL node must have a condition object';
                }
                if (!node.condition.field || typeof node.condition.field !== 'string') {
                    return 'CONDITIONAL node condition must have a field string';
                }
                if (!node.condition.operator || !['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin'].includes(node.condition.operator)) {
                    return 'CONDITIONAL node condition must have a valid operator';
                }
                break;
        }
        // Validate next node references
        const nodeIds = allNodes.map(n => n.id);
        if (node.type === 'CONDITIONAL') {
            const conditionalNode = node;
            if (conditionalNode.on_true_next_node_id && !nodeIds.includes(conditionalNode.on_true_next_node_id)) {
                return `CONDITIONAL node references non-existent on_true_next_node_id: ${conditionalNode.on_true_next_node_id}`;
            }
            if (conditionalNode.on_false_next_node_id && !nodeIds.includes(conditionalNode.on_false_next_node_id)) {
                return `CONDITIONAL node references non-existent on_false_next_node_id: ${conditionalNode.on_false_next_node_id}`;
            }
        }
        else {
            const regularNode = node;
            if (regularNode.next_node_id && !nodeIds.includes(regularNode.next_node_id)) {
                return `Node references non-existent next_node_id: ${regularNode.next_node_id}`;
            }
        }
        return null;
    }
    validatePatientContext(context) {
        if (!context.id || typeof context.id !== 'string') {
            return 'Patient id is required and must be a string';
        }
        if (typeof context.age !== 'number' || context.age < 0) {
            return 'Patient age is required and must be a non-negative number';
        }
        if (!context.language || !['en', 'es'].includes(context.language)) {
            return 'Patient language is required and must be either "en" or "es"';
        }
        if (!context.condition || !['liver_replacement', 'knee_replacement'].includes(context.condition)) {
            return 'Patient condition is required and must be either "liver_replacement" or "knee_replacement"';
        }
        return null;
    }
}
exports.JourneyController = JourneyController;
//# sourceMappingURL=journeyController.js.map