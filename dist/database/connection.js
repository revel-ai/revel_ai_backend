"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDB = exports.connectDB = exports.pool = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const config = {
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_SdyVP8UAQW3u@ep-late-surf-adsmnmgi-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};
exports.pool = new pg_1.Pool(config);
const connectDB = async () => {
    try {
        const client = await exports.pool.connect();
        console.log('Connected to PostgreSQL database');
        client.release();
    }
    catch (error) {
        console.error('Error connecting to database:', error);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
const closeDB = async () => {
    await exports.pool.end();
    console.log('Database connection closed');
};
exports.closeDB = closeDB;
//# sourceMappingURL=connection.js.map