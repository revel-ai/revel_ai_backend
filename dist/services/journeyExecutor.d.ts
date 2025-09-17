import { JourneyRepository } from '../repositories/journeyRepository';
import { PatientContext, JourneyRun } from '../types/journey';
export declare class JourneyExecutor {
    private journeyRepository;
    private activeRuns;
    constructor(journeyRepository: JourneyRepository);
    startJourney(journeyId: string, patientContext: PatientContext): Promise<string>;
    private executeJourneyAsync;
    private executeNode;
    private executeMessageNode;
    private executeDelayNode;
    private executeConditionalNode;
    getJourneyRunStatus(runId: string): Promise<JourneyRun | null>;
    cancelJourneyRun(runId: string): Promise<void>;
    resumeActiveRuns(): Promise<void>;
}
//# sourceMappingURL=journeyExecutor.d.ts.map