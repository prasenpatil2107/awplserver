import express, { Request, Response } from 'express';
import { getDb } from '../db/init';
import { User } from '../types';

const router = express.Router();

router.put('/:id', async (req: Request, res: Response) => {
    console.log('Updating user:api', req.body);
    try {
        const userId = parseInt(req.params.id);
        const userData = req.body as Partial<User>;

        // Add detailed logging
        console.log('=== UPDATE USER DEBUG INFO ===');
        console.log('1. User ID:', userId);
        console.log('2. Received Data:', JSON.stringify(userData, null, 2));

        const db = await getDb();
        
        // First check if user exists
        const existingUser = await db.get('SELECT * FROM users WHERE id = ?', userId);
        console.log('3. Existing User:', JSON.stringify(existingUser, null, 2));

        if (!existingUser) {
            console.log('4. Error: User not found');
            return res.status(404).json({ error: 'User not found' });
        }

        // Only check leg availability if we're changing the leg or added_under_id
        if (('leg' in userData || 'added_under_id' in userData) && 
            (userData.leg !== existingUser.leg || userData.added_under_id !== existingUser.added_under_id)) {
            
            const newLeg = userData.leg || existingUser.leg;
            const newAddedUnderId = userData.added_under_id || existingUser.added_under_id;

            if (newAddedUnderId && newLeg) {
                const isLegAvailable = await checkLegAvailability(newAddedUnderId, newLeg, userId);
                if (!isLegAvailable) {
                    return res.status(400).json({
                        error: `${newLeg === 'Bonus' ? 'Right' : 'Left'} leg is already occupied`
                    });
                }
            }
        }

        // Prepare update query parts
        const updates: string[] = [];
        const values: any[] = [];

        // Only include fields that are present in the request
        if ('name' in userData) {
            updates.push('name = ?');
            values.push(userData.name);
        }

        if ('leg' in userData) {
            updates.push('leg = ?');
            values.push(userData.leg === null || userData.leg === undefined ? null : userData.leg);
        }

        if ('mobile_no' in userData) {
            updates.push('mobile_no = ?');
            values.push(userData.mobile_no === '' ? null : userData.mobile_no);
        }

        if ('address' in userData) {
            updates.push('address = ?');
            values.push(userData.address === '' ? null : userData.address);
        }

        if ('work' in userData) {
            updates.push('work = ?');
            values.push(userData.work === '' ? null : userData.work);
        }

        if ('remarks' in userData) {
            updates.push('remarks = ?');
            values.push(userData.remarks === '' ? null : userData.remarks);
        }

        if ('userid' in userData) {
            updates.push('userid = ?');
            values.push(userData.userid === '' ? null : userData.userid);
        }

        if ('password' in userData) {
            updates.push('password = ?');
            values.push(userData.password === '' ? null : userData.password);
        }

        if ('sp_value' in userData) {
            updates.push('sp_value = ?');
            values.push(userData.sp_value === null || userData.sp_value === undefined ? 0 : Number(userData.sp_value));
        }

        if ('is_green' in userData) {
            updates.push('is_green = ?');
            values.push(userData.is_green ? 1 : 0);
        }

        // Add the WHERE clause value
        values.push(userId);

        // Construct the update query
        const updateQuery = `
            UPDATE users 
            SET ${updates.join(', ')}
            WHERE id = ?
        `;

        console.log('5. Update Query:', updateQuery);
        console.log('6. Update Values:', values);

        try {
            const result = await db.run(updateQuery, values);
            console.log('7. Update Result:', result);

            const updatedUser = await db.get('SELECT * FROM users WHERE id = ?', userId);
            console.log('8. Updated User Data:', JSON.stringify(updatedUser, null, 2));

            res.json({
                message: 'User updated successfully',
                user: updatedUser
            });
        } catch (dbError: any) {
            console.error('9. Database Error:', dbError);
            console.error('10. Error Stack:', dbError.stack);
            res.status(500).json({
                error: 'Database error during update',
                details: dbError.message
            });
        }
    } catch (error: any) {
        console.error('11. General Error:', error);
        console.error('12. Error Stack:', error.stack);
        res.status(500).json({
            error: 'Failed to update user',
            details: error.message
        });
    }
});

// Modified checkLegAvailability function with better validation
async function checkLegAvailability(parentId: number, leg: string, currentUserId: number) {
    console.log('checkLegAvailability', parentId, leg, currentUserId);
    try {
        const db = await getDb();

        // Get all users under the parent including the current user
        const allDownlineUsers = await db.all(
            'SELECT * FROM users WHERE added_under_id = ?',
            [parentId]
        );

        // Count how many users are in the requested leg position
        const usersInLeg = allDownlineUsers.filter((user: { leg: string; }) => user.leg === leg);

        if (usersInLeg.length === 0) {
            // No users in this leg, it's available
            return true;
        } else if (usersInLeg.length === 1 && usersInLeg[0].id === currentUserId) {
            // Only the current user is in this leg, it's available
            return true;
        } else {
            console.log('in else', usersInLeg);
            // Either another user is in this leg, or multiple users are in this leg
            return false;
        }
    } catch (error) {
        console.error('Failed to check leg availability:', error);
        throw error;
    }
}

// Add this new route to reuse the existing checkLegAvailability function
router.post('/check-leg-availability', async (req: Request, res: Response) => {
    try {
        const { parentId, leg, currentUserId } = req.body;
        
        if (!parentId || !leg) {
            return res.status(400).json({ 
                isAvailable: false,
                error: 'Missing required parameters' 
            });
        }

        const isAvailable = await checkLegAvailability(
            Number(parentId),
            leg,
            Number(currentUserId)
        );

        res.json({ isAvailable });
    } catch (error) {
        console.error('Error checking leg availability:', error);
        res.status(500).json({ 
            isAvailable: false,
            error: 'Failed to check leg availability' 
        });
    }
});

// POST route for creating a new user
router.post('/', async (req: Request, res: Response) => {
    try {
        const userData = req.body;
        const db = await getDb();

        const result = await db.run(
            `INSERT INTO users (
                name, 
                leg, 
                added_under_id, 
                mobile_no, 
                address, 
                work, 
                remarks,
                userid,
                password,
                sp_value,
                is_green
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userData.name,
                userData.leg || null,
                userData.added_under_id || null,
                userData.mobile_no || null,
                userData.address || null,
                userData.work || null,
                userData.remarks || null,
                userData.userid || null,
                userData.password || null,
                userData.sp_value || 0,  // Default to 0 if not provided
                userData.is_green ? 1 : 0  // Convert boolean to 1/0 for SQLite
            ]
        );

        // ... rest of the POST route code ...
    } catch (error) {
        console.error('Failed to create user:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// GET all users
router.get('/', async (req: Request, res: Response) => {
    try {
        console.log('Fetching all users...');
        const db = await getDb();
        
        const users = await db.all('SELECT * FROM users');
        console.log(`Found ${users.length} users`);
        
        res.json(users);
    } catch (error: any) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users', details: error.message });
    }
});

// GET user by ID
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.id);
        console.log(`Fetching user with ID: ${userId}`);
        
        const db = await getDb();
        const user = await db.get('SELECT * FROM users WHERE id = ?', userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(user);
    } catch (error: any) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user', details: error.message });
    }
});

export default router; 