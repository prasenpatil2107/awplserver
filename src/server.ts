import express from 'express';
import cors from 'cors';
import { getDb, initializeDatabase } from './db/init';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Add error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

// Import routes
import userRoutes from './routes/users';

// Use routes with error handling
app.use('/users', userRoutes);

// Basic health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Initialize database and start server
async function startServer() {
    try {
        console.log('Initializing database...');
        await initializeDatabase();
        console.log('Database initialized successfully');

        console.log('Connecting to database...');
        const db = await getDb();
        console.log('Database connectedserver successfully');

        // Test database connection
        try {
            await db.get('SELECT 1');
            console.log('Database test query successful');
        } catch (dbError) {
            console.error('Database test query failed:', dbError);
            throw dbError;
        }

        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer(); 