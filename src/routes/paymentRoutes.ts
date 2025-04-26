import express from 'express';
import { Database } from 'sqlite';
import { Payment } from '../types';

const router = express.Router();

export default function paymentRoutes(db: Database) {
    // Get all payments
    router.get('/', async (req, res) => {
        try {
            const payments = await db.all(`
                SELECT p.*, u.name as user_name
                FROM payments p
                JOIN users u ON p.user_id = u.id
                ORDER BY p.date DESC
            `);
            res.json(payments);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch payments' });
        }
    });

    // Create new payment
    router.post('/', async (req, res) => {
        try {
            const payment: Payment = req.body;
            const result = await db.run(
                `INSERT INTO payments (user_id, amount, date)
                 VALUES (?, ?, ?)`,
                [payment.user_id, payment.amount, payment.date]
            );
            res.json({ id: result.lastID, ...payment });
        } catch (error) {
            res.status(500).json({ error: 'Failed to create payment' });
        }
    });

    // Get user balance
    router.get('/user/:userId/balance', async (req, res) => {
        try {
            const { userId } = req.params;
            
            // Get total sales amount
            const salesResult = await db.get(
                `SELECT COALESCE(SUM(final_amount), 0) as total_sales
                 FROM sales
                 WHERE user_id = ?`,
                userId
            );

            // Get total payments
            const paymentsResult = await db.get(
                `SELECT COALESCE(SUM(amount), 0) as total_payments
                 FROM payments
                 WHERE user_id = ?`,
                userId
            );

            const totalSales = salesResult.total_sales;
            const totalPayments = paymentsResult.total_payments;
            const balance = totalSales - totalPayments;

            res.json({
                totalSales,
                totalPayments,
                balance
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch balance' });
        }
    });

    // Get payments by user
    router.get('/user/:userId', async (req, res) => {
        try {
            const payments = await db.all(
                `SELECT * FROM payments
                 WHERE user_id = ?
                 ORDER BY date DESC`,
                req.params.userId
            );
            res.json(payments);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch user payments' });
        }
    });

    // Update payment
    router.put('/:id', async (req, res) => {
        try {
            const paymentId = req.params.id;
            const payment = req.body;

            // Check if payment exists
            const existingPayment = await db.get('SELECT * FROM payments WHERE id = ?', paymentId);
            if (!existingPayment) {
                return res.status(404).json({ error: 'Payment not found' });
            }

            const result = await db.run(
                `UPDATE payments 
                 SET amount = ?, date = ?
                 WHERE id = ?`,
                [payment.amount, payment.date, paymentId]
            );

            if (result.changes === 0) {
                throw new Error('No rows were updated');
            }

            const updatedPayment = await db.get('SELECT * FROM payments WHERE id = ?', paymentId);
            res.json({ data: updatedPayment });
        } catch (error) {
            console.error('Error updating payment:', error);
            res.status(500).json({ error: 'Failed to update payment' });
        }
    });

    // Delete payment
    router.delete('/:id', async (req, res) => {
        try {
            await db.run('DELETE FROM payments WHERE id = ?', req.params.id);
            res.json({ message: 'Payment deleted successfully' });
        } catch (error) {
            console.error('Error deleting payment:', error);
            res.status(500).json({ error: 'Failed to delete payment' });
        }
    });

    return router;
} 