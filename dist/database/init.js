"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const connection_1 = require("./connection");
const initializeDatabase = async () => {
    try {
        const schemaSQL = (0, fs_1.readFileSync)((0, path_1.join)(__dirname, 'schema.sql'), 'utf-8');
        await connection_1.pool.query(schemaSQL);
        console.log('Database schema initialized successfully');
    }
    catch (error) {
        console.error('Error initializing database schema:', error);
        throw error;
    }
};
exports.initializeDatabase = initializeDatabase;
//# sourceMappingURL=init.js.map