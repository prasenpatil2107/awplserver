"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
function salesRoutes(db) {
    const router = express_1.default.Router();
    // Get all sales
    router.get('/', async (req, res) => {
        try {
            const sales = await db.all(`
                SELECT s.*, u.name as user_name, p.product_name
                FROM sales s
                JOIN users u ON s.user_id = u.id
                JOIN products p ON s.product_id = p.id
                ORDER BY s.date DESC
            `);
            res.json(sales);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch sales' });
        }
    });
    // Create new sale
    router.post('/', async (req, res) => {
        try {
            const sale = req.body;
            const result = await db.run(`INSERT INTO sales (user_id, product_id, mrp, dp, sp, date, sold_rate, quantity, final_amount)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                sale.user_id,
                sale.product_id,
                sale.mrp,
                sale.dp,
                sale.sp,
                sale.date,
                sale.sold_rate,
                sale.quantity,
                sale.final_amount
            ]);
            res.json({ id: result.lastID, ...sale });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to create sale' });
        }
    });
    // Get sales by user
    router.get('/user/:userId', async (req, res) => {
        try {
            const sales = await db.all(`SELECT s.*, p.product_name
                 FROM sales s
                 JOIN products p ON s.product_id = p.id
                 WHERE s.user_id = ?
                 ORDER BY s.date DESC`, req.params.userId);
            res.json(sales);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch user sales' });
        }
    });
    // Delete a sale
    router.delete('/:id', async (req, res) => {
        try {
            await db.run('DELETE FROM sales WHERE id = ?', req.params.id);
            res.json({ message: 'Sale deleted successfully' });
        }
        catch (error) {
            console.error('Error deleting sale:', error);
            res.status(500).json({ error: 'Failed to delete sale' });
        }
    });
    // Update a sale
    router.put('/:id', async (req, res) => {
        try {
            const saleId = req.params.id;
            const sale = req.body;
            console.log('Updating sale:', { saleId, sale }); // Debug log
            // First check if sale exists
            const existingSale = await db.get('SELECT * FROM sales WHERE id = ?', saleId);
            if (!existingSale) {
                console.log('Sale not found:', saleId); // Debug log
                return res.status(404).json({ error: 'Sale not found' });
            }
            const result = await db.run(`UPDATE sales 
                 SET quantity = ?, 
                     sold_rate = ?, 
                     final_amount = ?,
                     sp = ?,
                     date = ?
                 WHERE id = ?`, [
                sale.quantity,
                sale.sold_rate,
                sale.final_amount,
                sale.sp,
                sale.date,
                saleId
            ]);
            if (result.changes === 0) {
                throw new Error('No rows were updated');
            }
            const updatedSale = await db.get(`SELECT s.*, p.product_name
                 FROM sales s
                 JOIN products p ON s.product_id = p.id
                 WHERE s.id = ?`, saleId);
            console.log('Updated sale:', updatedSale); // Debug log
            res.json({ data: updatedSale });
        }
        catch (error) {
            console.error('Error updating sale:', error);
            res.status(500).json({ error: 'Failed to update sale' });
        }
    });
    return router;
}
exports.default = salesRoutes;
