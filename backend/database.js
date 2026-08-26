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

    // 11. Showcase Projects (Website Portfolio) Table
    db.run(`CREATE TABLE IF NOT EXISTS showcase_projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      location TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'house',
      is_verified INTEGER DEFAULT 1,
      image_url TEXT NOT NULL,
      tag TEXT DEFAULT 'Rohana Completed Build',
      description TEXT NOT NULL,
      specs TEXT, -- JSON string of specs object
      gallery TEXT, -- JSON string array of image URLs
      gallery_captions TEXT, -- JSON string array of captions
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 12. Houses For Sale (Properties Marketplace) Table
    db.run(`CREATE TABLE IF NOT EXISTS houses_for_sale (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      location TEXT NOT NULL,
      price REAL NOT NULL,
      perches REAL NOT NULL,
      bedrooms INTEGER NOT NULL,
      bathrooms INTEGER NOT NULL,
      stories TEXT NOT NULL DEFAULT 'Two Stories',
      description TEXT NOT NULL,
      image_url TEXT NOT NULL,
      gallery TEXT, -- JSON string array of gallery photos
      contact_phone TEXT NOT NULL DEFAULT '0769117398',
      status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'reserved', 'sold')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Seed default data
    seedDefaultData();
  });
}

function seedDefaultData() {
  // Check if houses_for_sale has data
  db.get("SELECT COUNT(*) as count FROM houses_for_sale", (err, row) => {
    if (!err && (!row || row.count === 0)) {
      const defaultHouses = [
        {
          title: 'Modern 2-Story Luxury Residence in Piliyandala',
          location: 'Piliyandala, Western Province',
          price: 34500000,
          perches: 10.5,
          bedrooms: 4,
          bathrooms: 3,
          stories: 'Two Stories',
          description: 'Brand new, architect-designed luxury two-story house built by Rohana Construction. Features high-grade Rocell porcelain tiling, solid Teak doors and windows, roller shutter garage, modern pantry with granite countertops, landscaped lawn, and solar hot water system.',
          image_url: '/images/rohana-completed-house/house1.jpg',
          gallery: JSON.stringify([
            '/images/rohana-completed-house/house1.jpg',
            '/images/rohana-completed-house/house2.jpg',
            '/images/rohana-completed-house/house3.jpg',
            '/images/rohana-completed-house/house4.jpg',
            '/images/rohana-completed-house/house5.jpg'
          ]),
          contact_phone: '076 911 73 98',
          status: 'available'
        },
        {
          title: 'Turnkey 3-Story Executive Family Villa in Matara',
          location: 'Matara Town, Southern Province',
          price: 48000000,
          perches: 12.0,
          bedrooms: 5,
          bathrooms: 4,
          stories: 'Three Stories',
          description: 'Exclusive 3-story family residence with covered rooftop entertainment deck, panoramic views, custom teak woodwork, designer lighting, dual vehicle car porch, boundary wall with sliding motor gate, and premium finishings by Rohana Construction.',
          image_url: '/images/rohana-3story-house-2/house_3s_1.jpg',
          gallery: JSON.stringify([
            '/images/rohana-3story-house-2/house_3s_1.jpg',
            '/images/rohana-3story-house-2/house_3s_5.jpg',
            '/images/rohana-3story-house-2/house_3s_8.jpg',
            '/images/rohana-3story-house-2/house_3s_12.jpg'
          ]),
          contact_phone: '076 911 73 98',
          status: 'available'
        }
      ];

      const stmt = db.prepare(`INSERT INTO houses_for_sale (title, location, price, perches, bedrooms, bathrooms, stories, description, image_url, gallery, contact_phone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      defaultHouses.forEach(h => {
        stmt.run(h.title, h.location, h.price, h.perches, h.bedrooms, h.bathrooms, h.stories, h.description, h.image_url, h.gallery, h.contact_phone, h.status);
      });
      stmt.finalize();
      console.log('Default houses for sale seeded.');
    }
  });
  // Check if admin already exists and update/seed credentials
  db.get("SELECT * FROM users WHERE role = 'admin'", async (err, row) => {
    if (err) return console.error(err);
    const adminPasswordHash = await bcrypt.hash('AdMali@123', 10);
    const targetEmail = 'dewhanmalinda123@gmail.com';

    // Clear target email from non-admin users if exists to prevent UNIQUE constraint conflict
    db.run("UPDATE users SET email = 'dewhan.customer@gmail.com' WHERE email = ? AND role != 'admin'", [targetEmail], () => {
      if (!row) {
        db.run(
          "INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)",
          ['admin_Dew', adminPasswordHash, targetEmail, 'admin'],
          function (err) {
            if (err) console.error('Admin seeding failed:', err.message);
            else console.log('Admin user seeded (Username: admin_Dew, Password: AdMali@123)');
          }
        );
      } else {
        db.run(
          "UPDATE users SET username = ?, password = ?, email = ? WHERE role = 'admin'",
          ['admin_Dew', adminPasswordHash, targetEmail],
          function (err) {
            if (err) console.error('Admin update failed:', err.message);
            else console.log('Admin credentials updated (Username: admin_Dew, Password: AdMali@123)');
          }
        );
      }
    });
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

  // Seed sample showcase projects if table is empty
  db.get("SELECT COUNT(*) as count FROM showcase_projects", (err, row) => {
    if (err) return console.error(err);
    if (row && row.count === 0) {
      const defaultShowcase = [
        {
          title: 'Modern Single Story House',
          location: 'Western Province',
          category: 'house',
          is_verified: 1,
          image_url: '/images/rohana-completed-house/house1.jpg',
          tag: 'Rohana Completed Build',
          description: 'A completed turnkey modern single-story family home engineered and constructed by Rohana Construction. Features custom mahogany-patterned sliding entrance gates, structural white masonry pillars, high-grade roof tiling, a wide paved car porch with non-slip floor tiles, weather-shield exterior paint finish, landscaped front lawn, premium interior marble-pattern floor tiling, custom kitchen pantry counter, arched interior doorways, and solid teak wood main doors with glass window frames.',
          specs: JSON.stringify({
            'Builder': 'Rohana Construction (Direct Work)',
            'Project Status': '100% Completed & Handed Over',
            'Structure Type': 'Single Story Reinforced Concrete',
            'Interior Tiling': 'Polished Marble-Pattern Porcelain Tiles',
            'Kitchen & Pantry': 'Granite Countertop & Tile Backsplash',
            'Doors & Windows': 'Solid Teak Main Door & Teak Glass Windows',
            'Car Porch & Passageway': 'Steel Roof Structure & Non-Slip Floor Tiles',
            'Boundary & Security': 'Custom Wood-Finish Metal Gate & White Pillars',
            'Roof & Finishing': 'High-Pitch Roof Tiles & Weather-Shield Paint',
            'Garden & Landscaping': 'Natural Grass Lawn & Interlocking Stone Paving'
          }),
          gallery: JSON.stringify([
            '/images/rohana-completed-house/house1.jpg',
            '/images/rohana-completed-house/house2.jpg',
            '/images/rohana-completed-house/house3.jpg',
            '/images/rohana-completed-house/house4.jpg',
            '/images/rohana-completed-house/house5.jpg',
            '/images/rohana-completed-house/house6.jpg',
            '/images/rohana-completed-house/house7.jpg',
            '/images/rohana-completed-house/house8.jpg',
            '/images/rohana-completed-house/house9.jpg',
            '/images/rohana-completed-house/house10.jpg',
            '/images/rohana-completed-house/house11.jpg',
            '/images/rohana-completed-house/house12.jpg',
            '/images/rohana-completed-house/house13.jpg',
            '/images/rohana-completed-house/house14.jpg',
            '/images/rohana-completed-house/house15.jpg'
          ]),
          gallery_captions: JSON.stringify([
            'Full Front View: Modern Single-Story House, Paved Driveway & Car Porch',
            'Boundary Wall & Meters: Finished White Exterior Walls & Electricity/Water Meter Setup',
            'Entrance Gate Detail: Modern Wood-Finish Sliding Main Gate & Reinforced Pillar',
            'Porch & Veranda View: Stylish Non-Slip Floor Tiling & Square Support Columns',
            'Garden & Gate View: Looking Out From Veranda Towards Lawn & Security Gate',
            'Interior Finish: Premium Marble Floor Tiling, Pantry Counter & Teak Archway',
            'Side Porch Passageway: Covered Driveway Passageway & Steel Roof Framework',
            'Front Entrance Doors: Solid Teak Main Door & Custom Glass Windows with Security Grills',
            'Bedroom Interior: Polished Marble Floor Tiling, Solid Teak Door & Grid Ceiling Finish',
            'On-Site Construction Stage: Active Structural Beams, Masonry Walls & Porch Framing by Rohana Team',
            'Veranda Doorway: Crafted Teak Panel Main Door & Glass Window Frame with Security Grills',
            'Lawn & Porch Perspective: View from Open Gate Across Manicured Grass Lawn & Tiled Car Porch',
            'Living Room Interior: Marble Porcelain Floor Tiling, Skirting & Solid Teak Window',
            'Side Retaining Wall: Engineered Rubble Masonry Retaining Foundation & Side Elevation',
            'Interior Corridor: Double Teak Doors, Polished Marble Tiles & Black Grid Ceiling'
          ])
        },
        {
          title: 'Luxury 3-Story Modern Residence',
          location: 'Piliyandala Town',
          category: 'house',
          is_verified: 1,
          image_url: '/images/rohana-piliyandala-house/piliyandala1.jpg',
          tag: 'Rohana Completed Build',
          description: 'A grand 3-story luxury contemporary residence engineered and constructed turnkey by Rohana Construction in Piliyandala Town. Highlights vaulted exposed timber under-roof ceiling structures, custom floating hardwood staircases with modern black steel wire tension balustrades, polished marble porcelain floor tiling, mahogany kitchen pantry cabinets with black granite countertops, open rooftop terrace deck with wood-texture tiles, floor-to-ceiling louvered glass window panels for natural daylighting, automated motorized roller shutter garage, and upper floor balcony.',
          specs: JSON.stringify({
            'Builder': 'Rohana Construction (100% Completed)',
            'Location': 'Piliyandala Town, Western Province',
            'Structure Type': '3-Story Reinforced Concrete Frame',
            'Ceilings & Roof': 'Exposed Polished Timber Ceiling & Vaulted Rafters',
            'Staircase Engineering': 'Floating Hardwood Steps & Steel Wire Tension Balustrades',
            'Kitchen & Pantry': 'Mahogany Timber Cabinets & Black Granite Countertops',
            'Rooftop Terrace': 'Wood-Texture Outdoor Floor Tiling & Safety Railings',
            'Flooring & Finish': 'High-Gloss Polished Marble Porcelain Tiles',
            'Daylighting & Louvers': 'Floor-to-Ceiling Louvered Glass Windows & Teak Frames',
            'Garage & Access': 'Motorized Roller Shutter & Wood-grain Garage Tiling',
            'Outdoor Walkways': 'Tri-Color Interlocking Paving Block Pathways'
          }),
          gallery: JSON.stringify([
            '/images/rohana-piliyandala-house/piliyandala1.jpg',
            '/images/rohana-piliyandala-house/piliyandala2.jpg',
            '/images/rohana-piliyandala-house/piliyandala3.jpg',
            '/images/rohana-piliyandala-house/piliyandala4.jpg',
            '/images/rohana-piliyandala-house/piliyandala5.jpg',
            '/images/rohana-piliyandala-house/piliyandala6.jpg',
            '/images/rohana-piliyandala-house/piliyandala7.jpg',
            '/images/rohana-piliyandala-house/piliyandala8.jpg',
            '/images/rohana-piliyandala-house/piliyandala9.jpg',
            '/images/rohana-piliyandala-house/piliyandala10.jpg',
            '/images/rohana-piliyandala-house/piliyandala11.jpg',
            '/images/rohana-piliyandala-house/piliyandala12.jpg',
            '/images/rohana-piliyandala-house/piliyandala13.jpg',
            '/images/rohana-piliyandala-house/piliyandala14.jpg',
            '/images/rohana-piliyandala-house/piliyandala15.jpg',
            '/images/rohana-piliyandala-house/piliyandala16.jpg',
            '/images/rohana-piliyandala-house/piliyandala17.jpg',
            '/images/rohana-piliyandala-house/piliyandala18.jpg',
            '/images/rohana-piliyandala-house/piliyandala19.jpg',
            '/images/rohana-piliyandala-house/piliyandala20.jpg'
          ]),
          gallery_captions: JSON.stringify([
            'Front Elevation: Grand 3-Story Residence, Roller Shutter Garage & Rooftop Deck',
            'Side Perspective: 3-Level Concrete Frame Structure & Open Rooftop Pergola',
            'Boundary Wall & Façade: Molded White Retaining Wall & Teak Window Frames',
            'Main Entry Steps: Roller Shutter Garage, Wicket Entrance Door & Meter Box Unit',
            'Garage & Balcony View: Open Roller Shutter Entrance & Timber Louver Shading Panels',
            'Upper Floor Lounge: Polished Marble Floor Tiling, Louvered Windows & Teak Railings',
            'Custom Staircase: Hardwood Treads & Steel Balustrades under Exposed Timber Ceiling',
            'Atrium Daylight View: High Teak Windows, Exposed Rafters & Sunlit Stairwell',
            'Staircase Engineering: Floating Timber Steps with Tension Wire Safety Railings',
            'Spacious Living Hall: Vaulted Wooden Ceiling Structure & Panoramic Teak Glass Windows',
            'Ground Floor Foyer: High-Gloss Marble Floor Tiling & Open Staircase View',
            'Side Walkway: Tri-Color Interlocking Paving Blocks & Full-Length Teak French Windows',
            'Side Elevation Profile: 3-Story Concrete Structure & Rooftop Pergola Gazebo',
            'Indoor Garage Interior: Wood-Grain Floor Tiling & Automated Roller Shutter Door',
            'Rooftop Terrace Deck: Wood-Texture Outdoor Floor Tiling & Teak Stairwell Exit Door',
            'Rooftop Outdoor Corridor: Black Steel Safety Railings & Open Scenic Views',
            'Modern Kitchen Pantry: Custom Mahogany Timber Cabinets & Black Granite Countertop',
            'Teak French Balcony Doors: Full-Height Glass Panes & Steel Safety Railings',
            'Bedroom Interior: Polished Marble Tiles, Teak Door & Wall Sconce Lighting',
            'Dining / Pantry Nook: Custom Mahogany Wall & Base Cabinets, Wood-Grain Floor Tiling & Sconce Lighting'
          ])
        },
        {
          title: 'Contemporary 3-Story Modern Residence',
          location: 'Western Province',
          category: 'house',
          is_verified: 1,
          image_url: '/images/rohana-3story-house-2/house_3s_5.jpg',
          tag: 'Rohana Completed Build',
          description: 'A newly engineered 3-story contemporary family home constructed turnkey by Rohana Construction. Features a vaulted exposed timber roof ceiling in the top floor lounge, covered rooftop terrace deck paved with non-slip granite-texture outdoor tiles, terracotta brick paved veranda walkways with dark under-eaves timber framing, multi-flight wooden staircases with carved timber banisters & steel motif spindles, upper floor balcony lobbies, solid timber studded entrance doors, mahogany dining pantry wall cabinets, wood pendant light fixtures, high-gloss marble & wood-grain porcelain floor tiling, white exterior finishing with gray masonry boundary walls, custom security entrance gate with wicket door, ambient outdoor wall sconce illumination, steel carport pergola framework, and expansive glass windows with security grills.',
          specs: JSON.stringify({
            'Builder': 'Rohana Construction (100% Turnkey)',
            'Project Status': 'Finishing & Handover Phase',
            'Structure Type': '3-Story Reinforced Concrete Structure',
            'Roof Lounge & Ceilings': 'Vaulted Exposed Timber Roof Rafters & Beams',
            'Rooftop Terrace': 'Covered Deck with Granite-Texture Non-Slip Outdoor Tiles',
            'Veranda & Walkways': 'Terracotta Brick Paved Pathways & Timber Eaves Framing',
            'Staircase Engineering': 'Carved Timber Banisters & Black Steel Motif Spindles',
            'Entrance Door': 'Solid Hardwood Studded Panel Main Door',
            'Bedrooms & Interiors': 'Marble & Wood-Grain Porcelain Tiling with Teak Doors',
            'Kitchen & Dining': 'Mahogany Wall Pantry Units & Dining Lounge',
            'Boundary & Security': 'Gray Masonry Wall, Steel Gate & Diamond Balustrade Motifs'
          }),
          gallery: JSON.stringify([
            '/images/rohana-3story-house-2/house_3s_5.jpg',
            '/images/rohana-3story-house-2/house_3s_1.jpg',
            '/images/rohana-3story-house-2/house_3s_2.jpg',
            '/images/rohana-3story-house-2/house_3s_3.jpg',
            '/images/rohana-3story-house-2/house_3s_4.jpg',
            '/images/rohana-3story-house-2/house_3s_6.jpg',
            '/images/rohana-3story-house-2/house_3s_7.jpg',
            '/images/rohana-3story-house-2/house_3s_8.jpg',
            '/images/rohana-3story-house-2/house_3s_9.jpg',
            '/images/rohana-3story-house-2/house_3s_10.jpg',
            '/images/rohana-3story-house-2/house_3s_11.jpg',
            '/images/rohana-3story-house-2/house_3s_12.jpg',
            '/images/rohana-3story-house-2/house_3s_13.jpg',
            '/images/rohana-3story-house-2/house_3s_14.jpg',
            '/images/rohana-3story-house-2/house_3s_15.jpg',
            '/images/rohana-3story-house-2/house_3s_16.jpg',
            '/images/rohana-3story-house-2/house_3s_17.jpg',
            '/images/rohana-3story-house-2/house_3s_18.jpg',
            '/images/rohana-3story-house-2/house_3s_19.jpg',
            '/images/rohana-3story-house-2/house_3s_20.jpg'
          ]),
          gallery_captions: JSON.stringify([
            'Dusk Façade View: Evening Front Elevation with Warm Wall Sconce Illumination & Entrance Gate',
            'Full Front Elevation: 3-Story Residence, Covered Rooftop Terrace & Boundary Wall',
            'Street Entrance Approach: Extended Boundary Wall, Gateway Arch & Surrounding Grounds',
            'Side Perspective: 3-Level White Concrete Façade & Gravel Courtyard Driveway',
            'Upper Terrace Aerial View: Looking Down at Landscaped Lawn & Steel Carport Framework',
            'Main Entrance Hall: Studded Solid Hardwood Door, Pendant Lighting & Wood-Grain Tiling',
            'Open Foyer Perspective: Looking Out From Main Door Towards Green Lawn & Entrance Gate',
            'Dining Hall & Pantry: Mahogany Wall Cabinets, Recessed LED Ceiling Lights & Wood Flooring',
            'Aerial Lawn & Carport: Top View of Landscaped Garden Path & Steel Carport Framework',
            'Living Room Interior: Custom Wooden Staircase Banister, Ceiling Fan & Window Security Grills',
            'Upper Bedroom Interior: Wood-Grain Porcelain Tiling, Ceiling Fan & Security Window Grills',
            'Bedroom Hallway View: Teak Solid Wooden Door & Marble-Pattern Porcelain Flooring',
            'Multi-Flight Staircase: Hardwood Treads, Carved Timber Banister & Black Steel Motif Spindles',
            'Upper Floor Stair Lobby: Carved Timber Railings & Access Doorway to Terrace Balcony',
            'Master Bedroom / Study: High-Gloss Marble Porcelain Tiling & 3-Pane Teak Window',
            'Terracotta Veranda Walkway: Brick Paved Passageway, Exposed Timber Eaves & Lantern Lighting',
            'Covered Rooftop Terrace Deck: Non-Slip Granite-Texture Outdoor Tiling & Panoramic Views',
            'Custom Teak Window Detail: Solid Teak Wood Frame, Glass Panes & Iron Security Grills',
            'Rooftop Terrace Balcony View: Steel Roof Framing, Diamond Motif Balustrade & Hilltop Vista',
            'Top Floor Roof Lounge: Vaulted Exposed Timber Rafters, Polished Marble Tiles & Double Teak Doors'
          ])
        },
        {
          title: '5-Story Medical & Commercial Complex',
          location: 'Avissawella Town',
          category: 'commercial',
          is_verified: 1,
          image_url: '/images/rohana-avissawella-building/avissawella1.jpg',
          tag: 'Rohana Completed Commercial',
          description: 'A heavy-duty 5-story commercial medical center constructed turnkey by Rohana Construction for a specialist medical doctor in Avissawella Town (VS Fertility & Women’s Health Care Center). Features spacious open-plan patient waiting lounges with high-gloss porcelain floor tiling, doctor consultation rooms, clinical reception lobbies with teak French doors, staff pantry & refreshment units with mahogany cabinetry and black granite countertops, internal access staircases with non-slip tiled treads, solid teak entrance doors with top louvers, open rooftop terrace deck with steel superstructure for the illuminated billboard tower, weather-shield exterior coating, and reinforced concrete column framing engineered for healthcare facilities.',
          specs: JSON.stringify({
            'Client': 'Medical Doctor (Specialist Health Center)',
            'Location': 'Avissawella Town, Sabaragamuwa Province',
            'Structure Type': '5-Story Heavy Concrete Column & Beam Frame',
            'Category': 'Commercial & Healthcare Facility Construction',
            'Interior & Patient Halls': 'Spacious Open Waiting Lounges & Polished Porcelain Tiling',
            'Consultation Rooms': 'Private Clinical Chambers & Teak Panel Doors',
            'Staff Pantry & Refreshment': 'Mahogany Timber Cabinets & Black Granite Countertop',
            'Staircase & Safety': 'Internal Stairways with Black Steel Balustrades',
            'Doors & Windows': 'Solid Teak Glass Panel Entrance Doors & Louvers',
            'Rooftop Deck & Signage': 'Open Terrace Deck & Structural Steel Billboard Tower',
            'Façade Architecture': 'Multi-Tier Stepped Balconies & Black Steel Railings'
          }),
          gallery: JSON.stringify([
            '/images/rohana-avissawella-building/avissawella1.jpg',
            '/images/rohana-avissawella-building/avissawella2.jpg',
            '/images/rohana-avissawella-building/avissawella3.jpg',
            '/images/rohana-avissawella-building/avissawella4.jpg',
            '/images/rohana-avissawella-building/avissawella5.jpg',
            '/images/rohana-avissawella-building/avissawella6.jpg',
            '/images/rohana-avissawella-building/avissawella7.jpg',
            '/images/rohana-avissawella-building/avissawella8.jpg',
            '/images/rohana-avissawella-building/avissawella9.jpg',
            '/images/rohana-avissawella-building/avissawella10.jpg',
            '/images/rohana-avissawella-building/avissawella11.jpg',
            '/images/rohana-avissawella-building/avissawella12.jpg',
            '/images/rohana-avissawella-building/avissawella13.jpg',
            '/images/rohana-avissawella-building/avissawella14.jpg',
            '/images/rohana-avissawella-building/avissawella15.jpg',
            '/images/rohana-avissawella-building/avissawella16.jpg',
            '/images/rohana-avissawella-building/avissawella17.jpg'
          ]),
          gallery_captions: JSON.stringify([
            'Front Roadside Elevation: 5-Story Commercial Building & Rooftop Signage Tower',
            'Balcony Walkways: Non-Slip Tiled Outer Corridors & Black Steel Safety Railings',
            'Multi-Tier Balcony Architecture: 5-Level Stepped Concrete Frame & AC Compressor Setup',
            'Side Elevation: Commercial Entrance Bay & VS Fertility Medical Center Billboard',
            'Corner Façade View: Geometric Balcony Design & Heavy Structural Columns across 5 Floors',
            'Upper Stair Landing: Black Steel Safety Balustrades & Access Hallway',
            'Teak Entrance Doors: Custom Teak Frame Glass Paned Doors & Top Louver Vents',
            'Elevated Balcony View: Upper Floor Corridor Railings overlooking Avissawella Town'
          ])
        }
      ];

      const stmt = db.prepare(`
        INSERT INTO showcase_projects (title, location, category, is_verified, image_url, tag, description, specs, gallery, gallery_captions)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      defaultShowcase.forEach(item => {
        stmt.run(item.title, item.location, item.category, item.is_verified, item.image_url, item.tag, item.description, item.specs, item.gallery, item.gallery_captions);
      });
      stmt.finalize();
      console.log('Sample showcase projects seeded into database.');
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
