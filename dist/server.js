"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const init_1 = require("./db/init");
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const salesRoutes_1 = __importDefault(require("./routes/salesRoutes"));
const paymentRoutes_1 = __importDefault(require("./routes/paymentRoutes"));
const prescriptionRoutes_1 = __importDefault(require("./routes/prescriptionRoutes"));
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
// CORS configuration
const corsOptions = {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
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
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: err.message || 'Something went wrong!' });
});
// Initialize database and routes
(async () => {
    try {
        const db = await (0, init_1.initializeDatabase)();
        console.log('Database initialized successfully');
        // Debug middleware to log all requests
        app.use((req, res, next) => {
            console.log(`${req.method} ${req.url}`);
            next();
        });
        // Mount routes
        app.use('/api/users', (0, userRoutes_1.default)(db));
        app.use('/api/products', (0, productRoutes_1.default)(db));
        app.use('/api/sales', (0, salesRoutes_1.default)(db));
        app.use('/api/payments', (0, paymentRoutes_1.default)(db));
        app.use('/api/prescriptions', (0, prescriptionRoutes_1.default)(db));
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
})();
