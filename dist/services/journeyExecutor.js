"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JourneyExecutor = void 0;
class JourneyExecutor {
    constructor(journeyRepository) {
        this.activeRuns = new Map();
        this.journeyRepository = journeyRepository;
    }
    async startJourney(journeyId, patientContext) {
        const journey = await this.journeyRepository.getJourneyById(journeyId);
        if (!journey) {
            throw new Error(`Journey with id ${journeyId} not found`);
        }
        // Create a new journey run
        const runId = await this.journeyRepository.createJourneyRun(journeyId, patientContext, journey.start_node_id);
        // Start executing the journey asynchronously
        this.executeJourneyAsync(runId, journey, patientContext);
        return runId;
    }
    async executeJourneyAsync(runId, journey, patientContext) {
        try {
            let currentNodeId = journey.start_node_id;
            while (currentNodeId) {
                const currentNode = journey.nodes.find(node => node.id === currentNodeId);
                if (!currentNode) {
                    throw new Error(`Node with id ${currentNodeId} not found in journey ${journey.id}`);
                }
                // Update the current node in the database
                await this.journeyRepository.updateJourneyRun(runId, {
                    current_node_id: currentNodeId
                });
                // Execute the current node and get the next node ID
                currentNodeId = await this.executeNode(currentNode, patientContext, runId);
            }
            // Mark the journey run as completed
            await this.journeyRepository.updateJourneyRun(runId, {
                status: 'completed',
                current_node_id: null,
                completed_at: new Date()
            });
            console.log(`Journey run ${runId} completed successfully`);
        }
        catch (error) {
            console.error(`Error executing journey run ${runId}:`, error);
            // Mark the journey run as failed
            await this.journeyRepository.updateJourneyRun(runId, {
                status: 'failed',
                completed_at: new Date()
            });
        }
        finally {
            // Clean up any active timeouts
            this.activeRuns.delete(runId);
        }
    }
    async executeNode(node, patientContext, runId) {
        switch (node.type) {
            case 'MESSAGE':
                return this.executeMessageNode(node, patientContext);
            case 'DELAY':
                return this.executeDelayNode(node, runId);
            case 'CONDITIONAL':
                return this.executeConditionalNode(node, patientContext);
            default:
                throw new Error(`Unknown node type: ${node.type}`);
        }
    }
    executeMessageNode(node, patientContext) {
        // Stub implementation - in a real system, this would send the message via SMS, email, etc.
        console.log(`[MESSAGE] Sending message to patient ${patientContext.id}: "${node.message}"`);
        // Simulate message sending with additional context
        console.log(`[MESSAGE] Patient context: Age=${patientContext.age}, Language=${patientContext.language}, Condition=${patientContext.condition}`);
        return node.next_node_id;
    }
    executeDelayNode(node, runId) {
        return new Promise((resolve) => {
            console.log(`[DELAY] Waiting ${node.duration_seconds} seconds before next action...`);
            const timeout = setTimeout(() => {
                console.log(`[DELAY] Delay completed for run ${runId}`);
                this.activeRuns.delete(runId);
                resolve(node.next_node_id);
            }, node.duration_seconds * 1000);
            // Store the timeout so we can cancel it if needed
            this.activeRuns.set(runId, timeout);
        });
    }
    executeConditionalNode(node, patientContext) {
        const { field, operator, value } = node.condition;
        const patientValue = patientContext[field];
        console.log(`[CONDITIONAL] Evaluating condition: ${field} ${operator} ${value} (patient value: ${patientValue})`);
        let conditionResult = false;
        switch (operator) {
            case 'eq':
                conditionResult = patientValue === value;
                break;
            case 'ne':
                conditionResult = patientValue !== value;
                break;
            case 'gt':
                conditionResult = patientValue > value;
                break;
            case 'gte':
                conditionResult = patientValue >= value;
                break;
            case 'lt':
                conditionResult = patientValue < value;
                break;
            case 'lte':
                conditionResult = patientValue <= value;
                break;
            case 'in':
                conditionResult = Array.isArray(value) && value.includes(patientValue);
                break;
            case 'nin':
                conditionResult = Array.isArray(value) && !value.includes(patientValue);
                break;
            default:
                throw new Error(`Unknown operator: ${operator}`);
        }
        console.log(`[CONDITIONAL] Condition result: ${conditionResult}`);
        return conditionResult ? node.on_true_next_node_id : node.on_false_next_node_id;
    }
    async getJourneyRunStatus(runId) {
        return this.journeyRepository.getJourneyRunById(runId);
    }
    async cancelJourneyRun(runId) {
        // Cancel any active timeout
        const timeout = this.activeRuns.get(runId);
        if (timeout) {
            clearTimeout(timeout);
            this.activeRuns.delete(runId);
        }
        // Update the run status to failed
        await this.journeyRepository.updateJourneyRun(runId, {
            status: 'failed',
            completed_at: new Date()
        });
        console.log(`Journey run ${runId} cancelled`);
    }
    // Method to resume any in-progress runs after server restart
    async resumeActiveRuns() {
        const activeRuns = await this.journeyRepository.getActiveJourneyRuns();
        for (const run of activeRuns) {
            const journey = await this.journeyRepository.getJourneyById(run.journey_id);
            if (journey) {
                console.log(`Resuming journey run ${run.id}`);
                this.executeJourneyAsync(run.id, journey, run.patient_context);
            }
        }
    }
}
exports.JourneyExecutor = JourneyExecutor;
//# sourceMappingURL=journeyExecutor.js.map