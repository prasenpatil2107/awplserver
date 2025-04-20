"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
function productRoutes(db) {
    // Get all products
    router.get('/', async (req, res) => {
        try {
            const products = await db.all('SELECT * FROM products');
            console.log('Products fetched:', products); // Debug log
            res.json({ data: products });
        }
        catch (error) {
            console.error('Error getting products:', error);
            res.status(500).json({ error: 'Failed to get products' });
        }
    });
    // Get single product
    router.get('/:id', async (req, res) => {
        try {
            const product = await db.get('SELECT * FROM products WHERE id = ?', req.params.id);
            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }
            res.json(product);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch product' });
        }
    });
    // Create new product
    router.post('/', async (req, res) => {
        try {
            const { product_name, mrp, dp, sp, description, link } = req.body;
            console.log('Creating product with data:', req.body); // Debug log
            const result = await db.run(`INSERT INTO products (product_name, mrp, dp, sp, description, link)
                 VALUES (?, ?, ?, ?, ?, ?)`, [product_name, mrp, dp, sp, description, link]);
            if (result.lastID) {
                const newProduct = await db.get('SELECT * FROM products WHERE id = ?', result.lastID);
                res.status(201).json({ data: newProduct });
            }
            else {
                throw new Error('Failed to create product');
            }
        }
        catch (error) {
            console.error('Error creating product:', error);
            res.status(500).json({ error: 'Failed to create product' });
        }
    });
    // Update product
    router.put('/:id', async (req, res) => {
        try {
            // Log the incoming request
            console.log('Update request for product ID:', req.params.id);
            console.log('Request body:', req.body);
            const { product_name, mrp, dp, sp, description, link } = req.body;
            // Log the extracted values
            console.log('Extracted values:', {
                product_name,
                mrp: Number(mrp),
                dp: Number(dp),
                sp: Number(sp),
                description,
                link
            });
            // First check if product exists
            const existingProduct = await db.get('SELECT * FROM products WHERE id = ?', req.params.id);
            if (!existingProduct) {
                console.log('Product not found:', req.params.id);
                return res.status(404).json({ error: 'Product not found' });
            }
            try {
                const result = await db.run(`UPDATE products 
                     SET product_name = ?, 
                         mrp = ?, 
                         dp = ?, 
                         sp = ?, 
                         description = ?, 
                         link = ?
                     WHERE id = ?`, [
                    product_name,
                    Number(mrp),
                    Number(dp),
                    Number(sp),
                    description || null,
                    link || null,
                    req.params.id
                ]);
                console.log('Update result:', result);
                const updatedProduct = await db.get('SELECT * FROM products WHERE id = ?', req.params.id);
                console.log('Updated product:', updatedProduct);
                res.json({ data: updatedProduct });
            }
            catch (dbError) {
                // Log the specific database error
                console.error('Database error during update:', dbError);
                throw dbError;
            }
        }
        catch (error) { // Type the error as any to access message property
            console.error('Error updating product:', error);
            res.status(500).json({
                error: 'Failed to update product',
                details: error?.message || 'Unknown error'
            });
        }
    });
    return router;
}
exports.default = productRoutes;
