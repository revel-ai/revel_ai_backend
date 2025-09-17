import { Journey, JourneyRun, PatientContext } from '../types/journey';
export declare class JourneyRepository {
    createJourney(journey: Omit<Journey, 'id'>): Promise<string>;
    getJourneyById(id: string): Promise<Journey | null>;
    getAllJourneys(): Promise<Journey[]>;
    createJourneyRun(journeyId: string, patientContext: PatientContext, currentNodeId: string): Promise<string>;
    getJourneyRunById(id: string): Promise<JourneyRun | null>;
    updateJourneyRun(id: string, updates: {
        status?: 'in_progress' | 'completed' | 'failed';
        current_node_id?: string | null;
        completed_at?: Date;
    }): Promise<void>;
    getActiveJourneyRuns(): Promise<JourneyRun[]>;
}
//# sourceMappingURL=journeyRepository.d.ts.map