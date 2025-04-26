import express from 'express';
import cors from 'cors';
import { getDb } from './db/init';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Import routes
import userRoutes from './routes/users';

// Use routes
app.use('/users', userRoutes);

// Basic health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Initialize database and start server
async function startServer() {
  try {
    const db = await getDb();
    console.log('Database connected successfully');

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer(); 