"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const init_1 = require("./db/init");
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Add error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
});
// Import routes
const users_1 = __importDefault(require("./routes/users"));
// Use routes with error handling
app.use('/users', users_1.default);
// Basic health check endpoint
app.get('/', (req, res) => {
    res.json({ status: 'Server is running' });
});
// Initialize database and start server
async function startServer() {
    try {
        console.log('Initializing database...');
        await (0, init_1.initializeDatabase)();
        console.log('Database initialized successfully');
        console.log('Connecting to database...');
        const db = await (0, init_1.getDb)();
        console.log('Database connectedserver successfully');
        // Test database connection
        try {
            await db.get('SELECT 1');
            console.log('Database test query successful');
        }
        catch (dbError) {
            console.error('Database test query failed:', dbError);
            throw dbError;
        }
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
startServer();
