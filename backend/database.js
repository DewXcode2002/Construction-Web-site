import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let dbPath = path.join(__dirname, 'database.sqlite');

// Vercel workaround for SQLite write access
if (process.env.VERCEL) {
  const tmpDbPath = path.join('/tmp', 'database.sqlite');
  try {
    if (!fs.existsSync(tmpDbPath)) {
      if (fs.existsSync(dbPath)) {
        fs.copyFileSync(dbPath, tmpDbPath);
        console.log('Pre-seeded database copied to /tmp');
      } else {
        console.log('No pre-seeded database found, starting fresh database in /tmp');
      }
    }
    dbPath = tmpDbPath;
  } catch (err) {
    console.error('Failed to copy database to /tmp:', err.message);
  }
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(async () => {
    // 1. Users Table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('customer', 'employee', 'admin'))
    )`);

    // 2. Customers Table
    db.run(`CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      full_name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    // 3. Employees Table
    db.run(`CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      nic TEXT UNIQUE NOT NULL,
      experience TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('Tile', 'House wiring', 'Painting', 'Masonry work', 'Gardening', 'Roofing', 'Carpentry')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      daily_rate REAL DEFAULT 1500.0,
      photo_url TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    // 4. Projects Table
    db.run(`CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      customer_id INTEGER NOT NULL,
      location TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'foundation' CHECK(status IN ('foundation', 'walls', 'roofing', 'painting', 'completed')),
      progress_percent INTEGER DEFAULT 0,
      estimate_cost REAL NOT NULL,
      start_date TEXT,
      assigned_employees TEXT, -- Comma-separated IDs of employees
      FOREIGN KEY(customer_id) REFERENCES customers(id)
    )`);

    // 5. House Plans Table
    db.run(`CREATE TABLE IF NOT EXISTS house_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      bedrooms INTEGER NOT NULL,
      bathrooms INTEGER NOT NULL,
      floors INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      price_estimate REAL NOT NULL
    )`);

    // 6. Estimates Table
    db.run(`CREATE TABLE IF NOT EXISTS estimates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      land_size REAL NOT NULL, -- Perches
      budget REAL NOT NULL,
      house_type TEXT NOT NULL, -- single, two, three, other
      bedrooms INTEGER NOT NULL,
      bathrooms INTEGER NOT NULL,
      materials TEXT NOT NULL, -- comma separated material qualities
      cost_estimate REAL,
      duration_weeks INTEGER,
      plan_file_url TEXT, -- Client uploaded plan (legacy column)
      requested_plan_id INTEGER, -- Client chosen design
      status TEXT NOT NULL DEFAULT 'pending', -- pending, budgeted, revision_requested, approved, rejected
      payment_method TEXT, -- Customer chosen payment method
      admin_pdf_url TEXT, -- Company uploaded PDF budget
      fee_paid REAL DEFAULT 0.0, -- Fee paid for estimate calculation
      is_paid INTEGER DEFAULT 0, -- Payment status (0 = unpaid, 1 = paid)
      service_type TEXT DEFAULT 'Residential Construction', -- Service category
      service_details TEXT, -- JSON string containing service-specific details
      plan_option TEXT DEFAULT 'template', -- upload, request_design, template
      client_plan_url TEXT, -- Client uploaded land plan PDF/Image
      admin_plan_url TEXT, -- Admin drawn/uploaded architectural plan
      material_brands TEXT, -- JSON string with tile, wood, sanitaryware, paint, electrical brands
      customer_notes TEXT, -- Special instructions / custom requests
      contact_preference TEXT DEFAULT 'whatsapp', -- phone, whatsapp, in_app
      customer_feedback TEXT, -- Customer reply message / revision feedback
      admin_breakdown TEXT, -- Admin physical estimate cost breakdown notes
      FOREIGN KEY(customer_id) REFERENCES customers(id),
      FOREIGN KEY(requested_plan_id) REFERENCES house_plans(id)
    )`);

    // Migrations for existing databases
    db.run(`ALTER TABLE estimates ADD COLUMN plan_option TEXT DEFAULT 'template'`, () => {});
    db.run(`ALTER TABLE estimates ADD COLUMN client_plan_url TEXT`, () => {});
    db.run(`ALTER TABLE estimates ADD COLUMN admin_plan_url TEXT`, () => {});
    db.run(`ALTER TABLE estimates ADD COLUMN material_brands TEXT`, () => {});
    db.run(`ALTER TABLE estimates ADD COLUMN customer_notes TEXT`, () => {});
    db.run(`ALTER TABLE estimates ADD COLUMN contact_preference TEXT DEFAULT 'whatsapp'`, () => {});
    db.run(`ALTER TABLE estimates ADD COLUMN customer_feedback TEXT`, () => {});
    db.run(`ALTER TABLE estimates ADD COLUMN admin_breakdown TEXT`, () => {});

    // 7. Attendance Table
    db.run(`CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      check_in TEXT NOT NULL,
      check_out TEXT,
      FOREIGN KEY(employee_id) REFERENCES employees(id)
    )`);

    // 8. Salary Table
    db.run(`CREATE TABLE IF NOT EXISTS salary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      month TEXT NOT NULL,
      base_salary REAL NOT NULL,
      bonus REAL DEFAULT 0,
      ot REAL DEFAULT 0,
      total_paid REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'paid')),
      FOREIGN KEY(employee_id) REFERENCES employees(id)
    )`);

    // 9. Messages Table
    db.run(`CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(sender_id) REFERENCES users(id),
      FOREIGN KEY(receiver_id) REFERENCES users(id)
    )`);
    // Add is_read column if it doesn't exist (migration for existing DBs)
    db.run(`ALTER TABLE messages ADD COLUMN is_read INTEGER DEFAULT 0`, () => {});

    // 10. Direct Service Inquiries Table
    db.run(`CREATE TABLE IF NOT EXISTS inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      location TEXT,
      service_type TEXT NOT NULL,
      details TEXT NOT NULL,
      contact_time TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Seed default data
    seedDefaultData();
  });
}

function seedDefaultData() {
  // Check if admin already exists
  db.get("SELECT * FROM users WHERE role = 'admin'", async (err, row) => {
    if (err) return console.error(err);
    if (!row) {
      const adminPasswordHash = await bcrypt.hash('admin123', 10);
      db.run(
        "INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)",
        ['admin', adminPasswordHash, 'admin@rohana.com', 'admin'],
        function (err) {
          if (err) console.error('Admin seeding failed:', err.message);
          else console.log('Admin user seeded (Username: admin, Password: admin123)');
        }
      );
    }
  });

  // Seed sample house plans if table is empty
  db.get("SELECT COUNT(*) as count FROM house_plans", (err, row) => {
    if (err) return console.error(err);
    if (row.count === 0) {
      const plans = [
        {
          title: 'Modern Single-Story Villa',
          description: 'A cozy and elegant 3-bedroom, 2-bathroom house plan, perfect for small families. Large glass windows, open kitchen design.',
          bedrooms: 3,
          bathrooms: 2,
          floors: 1,
          image_url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80',
          price_estimate: 4500000
        },
        {
          title: 'Premium Two-Story Estate',
          description: 'Luxurious 4-bedroom, 3-bathroom home with a rooftop patio, private garage, spacious living rooms and dining hall.',
          bedrooms: 4,
          bathrooms: 3,
          floors: 2,
          image_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
          price_estimate: 8500000
        },
        {
          title: 'Contemporary Three-Story Residence',
          description: 'Modern architectural masterpiece featuring 5 bedrooms, 4 bathrooms, study rooms, home gym, and top-tier masonry.',
          bedrooms: 5,
          bathrooms: 4,
          floors: 3,
          image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
          price_estimate: 13500000
        }
      ];

      const stmt = db.prepare(`
        INSERT INTO house_plans (title, description, bedrooms, bathrooms, floors, image_url, price_estimate)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      plans.forEach(plan => {
        stmt.run(plan.title, plan.description, plan.bedrooms, plan.bathrooms, plan.floors, plan.image_url, plan.price_estimate);
      });
      stmt.finalize();
      console.log('Sample house plans seeded.');
    }
  });
}

// Export promisified helper methods for database operations
export const dbRun = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

export const dbGet = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const dbAll = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export default db;
