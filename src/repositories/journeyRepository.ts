import { pool } from '../database/connection';
import { Journey, JourneyRun, PatientContext } from '../types/journey';
import { v4 as uuidv4 } from 'uuid';

export class JourneyRepository {
  async createJourney(journey: Omit<Journey, 'id'>): Promise<string> {
    const id = uuidv4();
    const query = `
      INSERT INTO journeys (id, name, start_node_id, nodes)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;
    const values = [id, journey.name, journey.start_node_id, JSON.stringify(journey.nodes)];
    
    const result = await pool.query(query, values);
    return result.rows[0].id;
  }

  async getJourneyById(id: string): Promise<Journey | null> {
    const query = 'SELECT * FROM journeys WHERE id = $1';
    const result = await pool.query(query, [id]);
    
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

  async getAllJourneys(): Promise<Journey[]> {
    const query = 'SELECT * FROM journeys ORDER BY created_at DESC';
    const result = await pool.query(query);
    
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      start_node_id: row.start_node_id,
      nodes: row.nodes,
    }));
  }

  async createJourneyRun(journeyId: string, patientContext: PatientContext, currentNodeId: string): Promise<string> {
    const id = uuidv4();
    const query = `
      INSERT INTO journey_runs (id, journey_id, patient_context, status, current_node_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;
    const values = [id, journeyId, JSON.stringify(patientContext), 'in_progress', currentNodeId];
    
    const result = await pool.query(query, values);
    return result.rows[0].id;
  }

  async getJourneyRunById(id: string): Promise<JourneyRun | null> {
    const query = 'SELECT * FROM journey_runs WHERE id = $1';
    const result = await pool.query(query, [id]);
    
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

  async updateJourneyRun(
    id: string, 
    updates: {
      status?: 'in_progress' | 'completed' | 'failed';
      current_node_id?: string | null;
      completed_at?: Date;
    }
  ): Promise<void> {
    const setParts: string[] = [];
    const values: any[] = [];
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

    await pool.query(query, values);
  }

  async getActiveJourneyRuns(): Promise<JourneyRun[]> {
    const query = 'SELECT * FROM journey_runs WHERE status = $1 ORDER BY created_at ASC';
    const result = await pool.query(query, ['in_progress']);
    
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