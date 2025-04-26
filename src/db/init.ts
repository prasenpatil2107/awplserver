import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';

// Ensure database directory exists
const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Modify the migrateDatabase function to include all columns
async function migrateDatabase(db: Database) {
    try {
        // Backup existing users
        const users = await db.all('SELECT * FROM users');
        
        // Drop and recreate users table
        await db.exec('DROP TABLE IF EXISTS users');
        
        // Create new users table with all columns
        await db.exec(`
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                leg TEXT CHECK (leg IN ('Bonus', 'Incentive') OR leg IS NULL),
                added_under_id INTEGER,
                mobile_no TEXT,
                address TEXT,
                work TEXT,
                remarks TEXT,
                userid TEXT UNIQUE,
                password TEXT,
                sp_value DECIMAL(10,2) DEFAULT 0,
                is_green INTEGER DEFAULT 0,
                FOREIGN KEY (added_under_id) REFERENCES users(id)
            )
        `);

        // Restore user data with all columns
        for (const user of users) {
            await db.run(
                `INSERT INTO users (
                    id, name, leg, added_under_id, mobile_no, address, 
                    work, remarks, userid, password, sp_value, is_green
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    user.id, 
                    user.name, 
                    user.leg, 
                    user.added_under_id, 
                    user.mobile_no, 
                    user.address, 
                    user.work, 
                    user.remarks,
                    user.userid,
                    user.password,
                    user.sp_value || 0,
                    user.is_green || 0
                ]
            );
        }

        console.log('Database migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    }
}

export async function initializeDatabase() {
    // Enable verbose mode for debugging
    sqlite3.verbose();

    try {
        const db = await open({
            filename: path.join(__dirname, 'database.sqlite'),
            driver: sqlite3.Database
        });

        console.log('Database connectedinit successfully');

        // Remove the duplicate users table creation and just check if it exists
        const userTableExists = await db.get(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
        );

        if (!userTableExists) {
            // Only create the users table if it doesn't exist
            await db.exec(`
                CREATE TABLE users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    leg TEXT CHECK (leg IN ('Bonus', 'Incentive') OR leg IS NULL),
                    added_under_id INTEGER,
                    mobile_no TEXT,
                    address TEXT,
                    work TEXT,
                    remarks TEXT,
                    userid TEXT UNIQUE,
                    password TEXT,
                    sp_value DECIMAL(10,2) DEFAULT 0,
                    is_green INTEGER DEFAULT 0,
                    FOREIGN KEY (added_under_id) REFERENCES users(id)
                )
            `);
        } else {
            // If table exists, run migration to ensure all columns are present
            await migrateDatabase(db);
        }

        // Products table
        await db.exec(`
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_name TEXT NOT NULL,
                mrp DECIMAL(10,2) NOT NULL,
                dp DECIMAL(10,2) NOT NULL,
                sp DECIMAL(10,2) NOT NULL,
                description TEXT,
                link TEXT
            )
        `);

        console.log('Products table created successfully');

        // Sales table
        await db.exec(`
            CREATE TABLE IF NOT EXISTS sales (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                mrp DECIMAL(10,2) NOT NULL,
                dp DECIMAL(10,2) NOT NULL,
                sp DECIMAL(10,2) NOT NULL,
                date DATE NOT NULL,
                sold_rate DECIMAL(10,2) NOT NULL,
                quantity INTEGER NOT NULL,
                final_amount DECIMAL(10,2) NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (product_id) REFERENCES products(id)
            )
        `);

        console.log('Sales table created successfully');

        // Payments table
        await db.exec(`
            CREATE TABLE IF NOT EXISTS payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                date DATE NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);

        console.log('Payments table created successfully');

        // Prescriptions table
        await db.exec(`
            CREATE TABLE IF NOT EXISTS prescriptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                date DATE NOT NULL,
                remarks TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);

        await db.exec(`
            CREATE TABLE IF NOT EXISTS prescription_medicines (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                prescription_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                morning_dose TEXT,
                evening_dose TEXT,
                FOREIGN KEY (prescription_id) REFERENCES prescriptions(id),
                FOREIGN KEY (product_id) REFERENCES products(id)
            )
        `);

        return db;
    } catch (error) {
        console.error('Database initialization error:', error);
        throw error;
    }
}

export async function getDb(): Promise<Database> {
    return await open({
        filename: path.join(__dirname, 'database.sqlite'),
        driver: sqlite3.Database
    });
} 