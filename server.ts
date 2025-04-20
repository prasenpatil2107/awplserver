import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './db/init';
import userRoutes from './routes/userRoutes';
import productRoutes from './routes/productRoutes';
import salesRoutes from './routes/salesRoutes';
import paymentRoutes from './routes/paymentRoutes';
import prescriptionRoutes from './routes/prescriptionRoutes';

const app = express();
const port = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// Headers middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({ error: err.message || 'Something went wrong!' });
});

// Initialize database and routes
(async () => {
    try {
        const db = await initializeDatabase();
        console.log('Database initialized successfully');

        // Debug middleware to log all requests
        app.use((req, res, next) => {
            console.log(`${req.method} ${req.url}`);
            next();
        });

        // Mount routes
        app.use('/api/users', userRoutes(db));
        app.use('/api/products', productRoutes(db));
        app.use('/api/sales', salesRoutes(db));
        app.use('/api/payments', paymentRoutes(db));
        app.use('/api/prescriptions', prescriptionRoutes(db));

        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
})(); 