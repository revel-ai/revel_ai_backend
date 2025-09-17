import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { connectDB, closeDB } from './database/connection';
import { initializeDatabase } from './database/init';
import { journeyRoutes, journeyExecutor } from './routes/journeyRoutes';
import { specs } from './config/swagger';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the service
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthStatus'
 */
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'RevelAi Health API Documentation',
  swaggerOptions: {
    docExpansion: 'list',
    filter: true,
    showRequestHeaders: true
  }
}));

// API routes
app.use('/api', journeyRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown handler
const gracefulShutdown = async () => {
  console.log('Received shutdown signal, closing server gracefully...');
  
  try {
    await closeDB();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const startServer = async () => {
  try {
    console.log('🚀 Starting RevelAi Health Backend...');
    console.log('=====================================');
    
    // Connect to database
    console.log('📡 Connecting to database...');
    await connectDB();
    
    // Initialize database schema
    console.log('🗄️  Initializing database schema...');
    await initializeDatabase();
    
    // Resume any active journey runs
    console.log('⚡ Resuming active journey runs...');
    await journeyExecutor.resumeActiveRuns();
    
    // Start HTTP server
    app.listen(PORT, () => {
      console.log('=====================================');
      console.log('✅ RevelAi Health Backend Started Successfully!');
      console.log('=====================================');
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API base URL: http://localhost:${PORT}/api`);
      console.log(`📖 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log('=====================================');
      console.log('💡 Ready to accept requests!');
    });
    
  } catch (error) {
    console.error('=====================================');
    console.error('❌ Failed to start server');
    console.error('=====================================');
    console.error('Error details:', error.message);
    console.error('');
    console.error('🔧 Troubleshooting steps:');
    console.error('1. Check if the database URL is correct');
    console.error('2. Verify network connectivity');
    console.error('3. Ensure database server is accessible');
    console.error('4. Check firewall/SSL settings');
    console.error('=====================================');
    process.exit(1);
  }
};

// Start the server
if (require.main === module) {
  startServer();
}

export default app;