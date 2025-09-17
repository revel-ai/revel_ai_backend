"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JourneyRepository = void 0;
const connection_1 = require("../database/connection");
const uuid_1 = require("uuid");
class JourneyRepository {
    async createJourney(journey) {
        const id = (0, uuid_1.v4)();
        const query = `
      INSERT INTO journeys (id, name, start_node_id, nodes)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;
        const values = [id, journey.name, journey.start_node_id, JSON.stringify(journey.nodes)];
        const result = await connection_1.pool.query(query, values);
        return result.rows[0].id;
    }
    async getJourneyById(id) {
        const query = 'SELECT * FROM journeys WHERE id = $1';
        const result = await connection_1.pool.query(query, [id]);
        if (result.rows.length === 0) {
            return null;
        }
        const row = result.rows[0];
        return {
            id: row.id,
            name: row.name,
            start_node_id: row.start_node_id,
            nodes: row.nodes,
        };
    }
    async getAllJourneys() {
        const query = 'SELECT * FROM journeys ORDER BY created_at DESC';
        const result = await connection_1.pool.query(query);
        return result.rows.map(row => ({
            id: row.id,
            name: row.name,
            start_node_id: row.start_node_id,
            nodes: row.nodes,
        }));
    }
    async createJourneyRun(journeyId, patientContext, currentNodeId) {
        const id = (0, uuid_1.v4)();
        const query = `
      INSERT INTO journey_runs (id, journey_id, patient_context, status, current_node_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;
        const values = [id, journeyId, JSON.stringify(patientContext), 'in_progress', currentNodeId];
        const result = await connection_1.pool.query(query, values);
        return result.rows[0].id;
    }
    async getJourneyRunById(id) {
        const query = 'SELECT * FROM journey_runs WHERE id = $1';
        const result = await connection_1.pool.query(query, [id]);
        if (result.rows.length === 0) {
            return null;
        }
        const row = result.rows[0];
        return {
            id: row.id,
            journey_id: row.journey_id,
            patient_context: row.patient_context,
            status: row.status,
            current_node_id: row.current_node_id,
            created_at: row.created_at,
            updated_at: row.updated_at,
            completed_at: row.completed_at,
        };
    }
    async updateJourneyRun(id, updates) {
        const setParts = [];
        const values = [];
        let paramIndex = 1;
        if (updates.status !== undefined) {
            setParts.push(`status = $${paramIndex++}`);
            values.push(updates.status);
        }
        if (updates.current_node_id !== undefined) {
            setParts.push(`current_node_id = $${paramIndex++}`);
            values.push(updates.current_node_id);
        }
        if (updates.completed_at !== undefined) {
            setParts.push(`completed_at = $${paramIndex++}`);
            values.push(updates.completed_at);
        }
        if (setParts.length === 0) {
            return;
        }
        const query = `
      UPDATE journey_runs 
      SET ${setParts.join(', ')}
      WHERE id = $${paramIndex}
    `;
        values.push(id);
        await connection_1.pool.query(query, values);
    }
    async getActiveJourneyRuns() {
        const query = 'SELECT * FROM journey_runs WHERE status = $1 ORDER BY created_at ASC';
        const result = await connection_1.pool.query(query, ['in_progress']);
        return result.rows.map(row => ({
            id: row.id,
            journey_id: row.journey_id,
            patient_context: row.patient_context,
            status: row.status,
            current_node_id: row.current_node_id,
            created_at: row.created_at,
            updated_at: row.updated_at,
            completed_at: row.completed_at,
        }));
    }
}
exports.JourneyRepository = JourneyRepository;
//# sourceMappingURL=journeyRepository.js.map