"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.journeyExecutor = exports.journeyRoutes = void 0;
const express_1 = require("express");
const journeyController_1 = require("../controllers/journeyController");
const journeyRepository_1 = require("../repositories/journeyRepository");
const journeyExecutor_1 = require("../services/journeyExecutor");
const router = (0, express_1.Router)();
exports.journeyRoutes = router;
// Initialize dependencies
const journeyRepository = new journeyRepository_1.JourneyRepository();
const journeyExecutor = new journeyExecutor_1.JourneyExecutor(journeyRepository);
exports.journeyExecutor = journeyExecutor;
const journeyController = new journeyController_1.JourneyController(journeyRepository, journeyExecutor);
// Journey management routes
router.post('/journeys', journeyController.createJourney);
router.get('/journeys', journeyController.getAllJourneys);
router.get('/journeys/:journeyId', journeyController.getJourney);
// Journey execution routes
router.post('/journeys/:journeyId/trigger', journeyController.triggerJourney);
router.get('/journeys/runs/:runId', journeyController.getJourneyRunStatus);
//# sourceMappingURL=journeyRoutes.js.map