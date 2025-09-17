import { Request, Response } from 'express';
import { JourneyRepository } from '../repositories/journeyRepository';
import { JourneyExecutor } from '../services/journeyExecutor';
export declare class JourneyController {
    private journeyRepository;
    private journeyExecutor;
    constructor(journeyRepository: JourneyRepository, journeyExecutor: JourneyExecutor);
    createJourney: (req: Request, res: Response) => Promise<void>;
    triggerJourney: (req: Request, res: Response) => Promise<void>;
    getJourneyRunStatus: (req: Request, res: Response) => Promise<void>;
    getAllJourneys: (req: Request, res: Response) => Promise<void>;
    getJourney: (req: Request, res: Response) => Promise<void>;
    private validateJourney;
    private validateNode;
    private validatePatientContext;
}
//# sourceMappingURL=journeyController.d.ts.map