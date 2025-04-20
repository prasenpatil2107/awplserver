"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
function prescriptionRoutes(db) {
    // Get prescriptions by user
    router.get('/user/:userId', async (req, res) => {
        try {
            const prescriptions = await db.all(`
                SELECT p.*, 
                       pm.id as medicine_id, 
                       pm.product_id,
                       pr.product_name,
                       pm.morning_dose,
                       pm.evening_dose
                FROM prescriptions p
                LEFT JOIN prescription_medicines pm ON p.id = pm.prescription_id
                LEFT JOIN products pr ON pm.product_id = pr.id
                WHERE p.user_id = ?
                ORDER BY p.date DESC
            `, req.params.userId);
            // Group medicines by prescription
            const groupedPrescriptions = prescriptions.reduce((acc, curr) => {
                const existing = acc.find(p => p.id === curr.id);
                if (existing) {
                    existing.medicines.push({
                        id: curr.medicine_id,
                        product_id: curr.product_id,
                        product_name: curr.product_name,
                        morning_dose: curr.morning_dose,
                        evening_dose: curr.evening_dose
                    });
                }
                else {
                    acc.push({
                        id: curr.id,
                        user_id: curr.user_id,
                        date: curr.date,
                        remarks: curr.remarks,
                        medicines: curr.medicine_id ? [{
                                id: curr.medicine_id,
                                product_id: curr.product_id,
                                product_name: curr.product_name,
                                morning_dose: curr.morning_dose,
                                evening_dose: curr.evening_dose
                            }] : []
                    });
                }
                return acc;
            }, []);
            res.json({ data: groupedPrescriptions });
        }
        catch (error) {
            console.error('Error getting prescriptions:', error);
            res.status(500).json({ error: 'Failed to get prescriptions' });
        }
    });
    // Create prescription
    router.post('/', async (req, res) => {
        try {
            const prescription = req.body;
            const result = await db.run(`INSERT INTO prescriptions (user_id, date, remarks)
                 VALUES (?, ?, ?)`, [prescription.user_id, prescription.date, prescription.remarks]);
            const prescriptionId = result.lastID;
            // Check if medicines exist before iterating
            if (prescription.medicines && prescription.medicines.length > 0) {
                for (const medicine of prescription.medicines) {
                    await db.run(`INSERT INTO prescription_medicines 
                         (prescription_id, product_id, morning_dose, evening_dose)
                         VALUES (?, ?, ?, ?)`, [prescriptionId, medicine.product_id, medicine.morning_dose, medicine.evening_dose]);
                }
            }
            res.status(201).json({ id: prescriptionId, ...prescription });
        }
        catch (error) {
            console.error('Error creating prescription:', error);
            res.status(500).json({ error: 'Failed to create prescription' });
        }
    });
    // Update prescription
    router.put('/:id', async (req, res) => {
        try {
            const prescription = req.body;
            await db.run(`UPDATE prescriptions 
                 SET date = ?, remarks = ?
                 WHERE id = ?`, [prescription.date, prescription.remarks, req.params.id]);
            // Delete existing medicines
            await db.run('DELETE FROM prescription_medicines WHERE prescription_id = ?', req.params.id);
            // Check if medicines exist before iterating
            if (prescription.medicines && prescription.medicines.length > 0) {
                for (const medicine of prescription.medicines) {
                    await db.run(`INSERT INTO prescription_medicines 
                         (prescription_id, product_id, morning_dose, evening_dose)
                         VALUES (?, ?, ?, ?)`, [req.params.id, medicine.product_id, medicine.morning_dose, medicine.evening_dose]);
                }
            }
            res.json({ id: parseInt(req.params.id), ...prescription });
        }
        catch (error) {
            console.error('Error updating prescription:', error);
            res.status(500).json({ error: 'Failed to update prescription' });
        }
    });
    // Delete prescription
    router.delete('/:id', async (req, res) => {
        try {
            await db.run('DELETE FROM prescription_medicines WHERE prescription_id = ?', req.params.id);
            await db.run('DELETE FROM prescriptions WHERE id = ?', req.params.id);
            res.json({ message: 'Prescription deleted successfully' });
        }
        catch (error) {
            console.error('Error deleting prescription:', error);
            res.status(500).json({ error: 'Failed to delete prescription' });
        }
    });
    return router;
}
exports.default = prescriptionRoutes;
