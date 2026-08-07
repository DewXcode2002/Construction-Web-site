import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dbAll, dbGet, dbRun } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'rohana_construction_jwt_secret_key';

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Middleware for JWT Authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'Access token missing' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

// Register Route
app.post('/api/auth/register', async (req, res) => {
  const { username, password, email, role, fullName, phone, address, nic, experience, category } = req.body;

  if (!username || !password || !email || !role) {
    return res.status(400).json({ message: 'All basic fields are required' });
  }

  try {
    // Check if user exists
    const userExists = await dbGet("SELECT id FROM users WHERE username = ? OR email = ?", [username, email]);
    if (userExists) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await dbRun(
      "INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)",
      [username, hashedPassword, email, role]
    );
    const userId = result.id;

    if (role === 'customer') {
      await dbRun(
        "INSERT INTO customers (user_id, full_name, phone, address) VALUES (?, ?, ?, ?)",
        [userId, fullName || username, phone || '', address || '']
      );
    } else if (role === 'employee') {
      if (!nic || !category) {
        return res.status(400).json({ message: 'NIC and worker category are required for employees' });
      }
      await dbRun(
        `INSERT INTO employees (user_id, full_name, phone, address, nic, experience, category, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [userId, fullName || username, phone || '', address || '', nic, experience || '1 year', category]
      );
    }

    res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login Route
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const user = await dbGet("SELECT * FROM users WHERE username = ?", [username]);
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    // Sign JWT
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    // Fetch detail profile info based on role
    let profile = { username: user.username, email: user.email, role: user.role };
    if (user.role === 'customer') {
      const cust = await dbGet("SELECT * FROM customers WHERE user_id = ?", [user.id]);
      profile = { ...profile, ...cust };
    } else if (user.role === 'employee') {
      const emp = await dbGet("SELECT * FROM employees WHERE user_id = ?", [user.id]);
      profile = { ...profile, ...emp };
    }

    res.json({ token, user: profile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// ==========================================
// CUSTOMER PORTAL ENDPOINTS
// ==========================================

// Calculate Cost Estimate & Submit Request
app.post('/api/customer/estimates', authenticateToken, async (req, res) => {
  if (req.user.role !== 'customer') return res.status(403).json({ message: 'Unauthorized' });

  const { 
    landSize, 
    budget, 
    houseType, 
    bedrooms, 
    bathrooms, 
    materials, 
    requestedPlanId, 
    paymentMethod,
    serviceType,
    serviceDetails
  } = req.body;

  try {
    const customer = await dbGet("SELECT id FROM customers WHERE user_id = ?", [req.user.id]);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    let cost_estimate = 0;
    let duration_weeks = 4;
    const parsedDetails = typeof serviceDetails === 'object' ? serviceDetails : JSON.parse(serviceDetails || '{}');

    // Convert land size from perches to square feet for standard builds
    const calculatedSqFt = parseFloat(landSize || 0) * 272.25;

    let baseRate = 6500;
    let materialMultiplier = 1.0;
    const materialList = Array.isArray(materials) ? materials : (materials || '').split(',');
    
    if (materialList.includes('Premium Wood')) materialMultiplier += 0.15;
    if (materialList.includes('Luxury Tiles')) materialMultiplier += 0.10;
    if (materialList.includes('High-grade Electricals')) materialMultiplier += 0.08;
    if (materialList.includes('Eco Paint')) materialMultiplier += 0.05;

    const sType = serviceType || 'Residential Construction';

    if (sType === 'Residential Construction') {
      let houseTypeCost = 0;
      if (houseType === 'two') houseTypeCost = 1500000;
      else if (houseType === 'three') houseTypeCost = 3500000;

      cost_estimate = (calculatedSqFt * baseRate * materialMultiplier) + (bedrooms * 200000) + (bathrooms * 150000) + houseTypeCost;
      duration_weeks = Math.round(calculatedSqFt / 100) + 8;
    } 
    else if (sType === 'Commercial Buildings') {
      cost_estimate = (calculatedSqFt * 8500 * materialMultiplier);
      let floorsCost = 0;
      if (houseType === 'two') floorsCost = 2500000;
      else if (houseType === 'three') floorsCost = 5500000;
      cost_estimate += floorsCost;
      duration_weeks = Math.round(calculatedSqFt / 120) + 12;
    }
    else if (sType === 'Renovation') {
      const scope = parsedDetails.renovationScope || 'Kitchen Remodel';
      let scopeBase = 1200000;
      if (scope === 'Bathroom Remodel') scopeBase = 450000;
      else if (scope === 'Room Expansion') scopeBase = 800000;
      else if (scope === 'Full Office Refit') scopeBase = 2500000;

      cost_estimate = scopeBase * materialMultiplier * (1 + (parseFloat(landSize || 0) * 0.1));
      duration_weeks = scope === 'Full Office Refit' ? 12 : 6;
    }
    else if (sType === 'House Design') {
      const designType = parsedDetails.designType || '2D Blueprint';
      let baseDesign = 75000;
      if (designType === '3D Rendering') baseDesign = 120000;
      else if (designType === 'Full CAD Layout & 3D Walkthrough') baseDesign = 250000;

      cost_estimate = baseDesign + (parseFloat(landSize || 0) * 5000);
      duration_weeks = designType.includes('CAD') ? 4 : 2;
    }
    else if (sType === 'Structural Engineering') {
      const testType = parsedDetails.assessmentType || 'Soil Boring Test';
      let baseTest = 150000;
      if (testType === 'Concrete Column Stress Test') baseTest = 95000;
      else if (testType === 'Structural Load Certification') baseTest = 180000;

      cost_estimate = baseTest;
      duration_weeks = 2;
    }
    else if (sType === 'Electrical Work') {
      const points = parseInt(parsedDetails.wiringPoints || 10);
      const phase = parsedDetails.phaseType || 'Single Phase';
      let phaseAdd = phase === 'Three Phase' ? 150000 : 0;

      cost_estimate = (points * 8500 * materialMultiplier) + phaseAdd;
      duration_weeks = points > 30 ? 3 : 1;
    }
    else if (sType === 'Plumbing') {
      const points = parseInt(parsedDetails.waterPoints || 8);
      const pipeType = parsedDetails.pipeMaterial || 'Standard PVC';
      let pipeAdd = pipeType === 'PPR Hot/Cold' ? 40000 : 0;

      cost_estimate = (points * 6500 * materialMultiplier) + pipeAdd;
      duration_weeks = 2;
    }
    else if (sType === 'Painting') {
      const putty = parsedDetails.puttyCoating === 'Yes';
      const paintRate = putty ? 350 : 180;

      cost_estimate = calculatedSqFt * paintRate * materialMultiplier;
      duration_weeks = Math.round(calculatedSqFt / 500) + 1;
    }
    else if (sType === 'Landscaping') {
      const AustralianGrass = parsedDetails.turfType === 'Australian Blue Grass';
      const concretePaving = parsedDetails.features && parsedDetails.features.includes('Concrete Paving Stone');
      const stoneWall = parsedDetails.features && parsedDetails.features.includes('Stone Retaining Wall');

      let basePerchRate = AustralianGrass ? 80000 : 50000;
      cost_estimate = (parseFloat(landSize || 0) * basePerchRate);
      if (concretePaving) cost_estimate += 150000;
      if (stoneWall) cost_estimate += 250000;

      duration_weeks = Math.round(parseFloat(landSize || 0) * 0.5) + 1;
    }

    const materialsStr = materialList.join(', ');
    const detailsStr = JSON.stringify(parsedDetails);

    const result = await dbRun(
      `INSERT INTO estimates (customer_id, land_size, budget, house_type, bedrooms, bathrooms, materials, cost_estimate, duration_weeks, requested_plan_id, status, payment_method, fee_paid, is_paid, service_type, service_details)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, 1500.0, 1, ?, ?)`,
      [customer.id, landSize, budget, houseType, bedrooms, bathrooms, materialsStr, cost_estimate, duration_weeks, requestedPlanId || null, paymentMethod || 'Cash Payments', sType, detailsStr]
    );

    res.status(201).json({ 
      message: 'Estimate submitted and payment of LKR 1,500 processed successfully!',
      estimateId: result.id,
      costEstimate: cost_estimate,
      durationWeeks: duration_weeks
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating estimate' });
  }
});

// Fetch Customer's Estimates
app.get('/api/customer/estimates', authenticateToken, async (req, res) => {
  if (req.user.role !== 'customer') return res.status(403).json({ message: 'Unauthorized' });

  try {
    const customer = await dbGet("SELECT id FROM customers WHERE user_id = ?", [req.user.id]);
    if (!customer) return res.json([]);
    
    const estimates = await dbAll(
      `SELECT e.*, h.title as plan_title 
       FROM estimates e 
       LEFT JOIN house_plans h ON e.requested_plan_id = h.id 
       WHERE e.customer_id = ? 
       ORDER BY e.id DESC`,
      [customer.id]
    );
    res.json(estimates);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error loading estimates' });
  }
});

// Upload Company Budget PDF by Admin
app.post('/api/admin/estimates/:id/upload-pdf', authenticateToken, upload.single('pdfFile'), async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });
  const estId = req.params.id;
  if (!req.file) return res.status(400).json({ message: 'No PDF file uploaded' });

  const { costEstimate, durationWeeks } = req.body;

  try {
    const fileUrl = `/uploads/${req.file.filename}`;
    
    if (costEstimate && durationWeeks) {
      await dbRun(
        "UPDATE estimates SET admin_pdf_url = ?, cost_estimate = ?, duration_weeks = ?, status = 'budgeted' WHERE id = ?",
        [fileUrl, parseFloat(costEstimate), parseInt(durationWeeks), estId]
      );
    } else {
      await dbRun(
        "UPDATE estimates SET admin_pdf_url = ?, status = 'budgeted' WHERE id = ?",
        [fileUrl, estId]
      );
    }

    res.json({ message: 'Budget PDF uploaded successfully and status updated to budgeted!', fileUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error saving budget PDF' });
  }
});

// Customer Accept Company Budget PDF (Launches Project)
app.post('/api/customer/estimates/:id/accept', authenticateToken, async (req, res) => {
  if (req.user.role !== 'customer') return res.status(403).json({ message: 'Unauthorized' });
  const estId = req.params.id;

  try {
    const estimate = await dbGet("SELECT * FROM estimates WHERE id = ?", [estId]);
    if (!estimate) return res.status(404).json({ message: 'Estimate not found' });
    if (estimate.status !== 'budgeted') {
      return res.status(400).json({ message: 'You can only accept estimates that have a ready company budget PDF' });
    }

    // Update status to approved
    await dbRun("UPDATE estimates SET status = 'approved' WHERE id = ?", [estId]);

    // Create live building project automatically!
    const today = new Date().toISOString().split('T')[0];
    const projectName = `${estimate.house_type.charAt(0).toUpperCase() + estimate.house_type.slice(1)}-Story House Project`;
    
    const customer = await dbGet("SELECT address FROM customers WHERE id = ?", [estimate.customer_id]);

    await dbRun(
      `INSERT INTO projects (name, customer_id, location, status, progress_percent, estimate_cost, start_date) 
       VALUES (?, ?, ?, 'foundation', 0, ?, ?)`,
      [projectName, estimate.customer_id, customer ? customer.address : 'Colombo', estimate.cost_estimate, today]
    );

    res.json({ message: 'Budget accepted successfully! Project construction launched.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error accepting budget' });
  }
});

// Fetch Customer's Projects (Construction Progress)
app.get('/api/customer/projects', authenticateToken, async (req, res) => {
  if (req.user.role !== 'customer') return res.status(403).json({ message: 'Unauthorized' });

  try {
    const customer = await dbGet("SELECT id FROM customers WHERE user_id = ?", [req.user.id]);
    if (!customer) return res.json([]);
    const projects = await dbAll("SELECT * FROM projects WHERE customer_id = ? ORDER BY id DESC", [customer.id]);
    res.json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error loading projects' });
  }
});

// Fetch All Templates House Plans
app.get('/api/customer/plans', async (req, res) => {
  try {
    const plans = await dbAll("SELECT * FROM house_plans");
    res.json(plans);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error loading plans' });
  }
});

// Custom plan file upload
app.post('/api/customer/upload-plan', authenticateToken, upload.single('planFile'), async (req, res) => {
  if (req.user.role !== 'customer') return res.status(403).json({ message: 'Unauthorized' });
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  try {
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ fileUrl, message: 'Plan PDF uploaded successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during file upload' });
  }
});

// ==========================================
// EMPLOYEE PORTAL ENDPOINTS
// ==========================================

// Check Attendance status for today
app.get('/api/employee/attendance-status', authenticateToken, async (req, res) => {
  if (req.user.role !== 'employee') return res.status(403).json({ message: 'Unauthorized' });

  try {
    const employee = await dbGet("SELECT id FROM employees WHERE user_id = ?", [req.user.id]);
    if (!employee) return res.status(404).json({ message: 'Employee profile not found' });

    const today = new Date().toISOString().split('T')[0];
    const log = await dbGet("SELECT * FROM attendance WHERE employee_id = ? AND date = ?", [employee.id, today]);

    res.json({ checkedIn: !!log, checkedOut: log ? !!log.check_out : false, record: log });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error loading attendance status' });
  }
});

// Check-in
app.post('/api/employee/check-in', authenticateToken, async (req, res) => {
  if (req.user.role !== 'employee') return res.status(403).json({ message: 'Unauthorized' });

  try {
    const employee = await dbGet("SELECT id, status FROM employees WHERE user_id = ?", [req.user.id]);
    if (!employee) return res.status(404).json({ message: 'Employee profile not found' });
    if (employee.status !== 'approved') return res.status(403).json({ message: 'Employee profile is not approved yet' });

    const today = new Date().toISOString().split('T')[0];
    const existing = await dbGet("SELECT id FROM attendance WHERE employee_id = ? AND date = ?", [employee.id, today]);
    
    if (existing) {
      return res.status(400).json({ message: 'Already checked in today' });
    }

    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    await dbRun("INSERT INTO attendance (employee_id, date, check_in) VALUES (?, ?, ?)", [employee.id, today, time]);

    res.json({ message: 'Checked in successfully at ' + time });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error checking in' });
  }
});

// Check-out
app.post('/api/employee/check-out', authenticateToken, async (req, res) => {
  if (req.user.role !== 'employee') return res.status(403).json({ message: 'Unauthorized' });

  try {
    const employee = await dbGet("SELECT id FROM employees WHERE user_id = ?", [req.user.id]);
    const today = new Date().toISOString().split('T')[0];
    const existing = await dbGet("SELECT * FROM attendance WHERE employee_id = ? AND date = ?", [employee.id, today]);

    if (!existing) return res.status(400).json({ message: 'You must check-in first today' });
    if (existing.check_out) return res.status(400).json({ message: 'Already checked out today' });

    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    await dbRun("UPDATE attendance SET check_out = ? WHERE id = ?", [time, existing.id]);

    // Calculate dynamic pay additions for salary log (adds 8 hours of work)
    // Create salary row if not exists or add base rate
    const month = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    const empData = await dbGet("SELECT daily_rate FROM employees WHERE id = ?", [employee.id]);
    
    const salaryLog = await dbGet("SELECT * FROM salary WHERE employee_id = ? AND month = ?", [employee.id, month]);
    if (salaryLog) {
      const newBase = salaryLog.base_salary + empData.daily_rate;
      const newTotal = newBase + salaryLog.bonus + salaryLog.ot;
      await dbRun("UPDATE salary SET base_salary = ?, total_paid = ? WHERE id = ?", [newBase, newTotal, salaryLog.id]);
    } else {
      await dbRun(
        "INSERT INTO salary (employee_id, month, base_salary, total_paid, status) VALUES (?, ?, ?, ?, 'pending')",
        [employee.id, month, empData.daily_rate, empData.daily_rate]
      );
    }

    res.json({ message: 'Checked out successfully at ' + time });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error checking out' });
  }
});

// Fetch Employee Schedule, Assigned Site & Salary Logs
app.get('/api/employee/dashboard-info', authenticateToken, async (req, res) => {
  if (req.user.role !== 'employee') return res.status(403).json({ message: 'Unauthorized' });

  try {
    const employee = await dbGet("SELECT * FROM employees WHERE user_id = ?", [req.user.id]);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    // Fetch active assignments (projects assigned to this employee id)
    const projects = await dbAll("SELECT * FROM projects");
    const assignedProjects = projects.filter(p => {
      if (!p.assigned_employees) return false;
      const ids = p.assigned_employees.split(',').map(id => id.trim());
      return ids.includes(String(employee.id));
    });

    // Fetch Salary Logs
    const salaries = await dbAll("SELECT * FROM salary WHERE employee_id = ? ORDER BY id DESC", [employee.id]);

    // Fetch Attendance Logs
    const attendanceLogs = await dbAll("SELECT * FROM attendance WHERE employee_id = ? ORDER BY date DESC LIMIT 10", [employee.id]);

    res.json({
      employee,
      assignments: assignedProjects,
      salaries,
      attendance: attendanceLogs
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error loading employee details' });
  }
});

// ==========================================
// ADMIN DASHBOARD ENDPOINTS
// ==========================================

// Get Dashboard Overview Metrics
app.get('/api/admin/metrics', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });

  try {
    const customersCount = await dbGet("SELECT COUNT(*) as count FROM customers");
    const employeesPendingCount = await dbGet("SELECT COUNT(*) as count FROM employees WHERE status = 'pending'");
    const employeesApprovedCount = await dbGet("SELECT COUNT(*) as count FROM employees WHERE status = 'approved'");
    const projectsActiveCount = await dbGet("SELECT COUNT(*) as count FROM projects WHERE status != 'completed'");
    const projectsCompletedCount = await dbGet("SELECT COUNT(*) as count FROM projects WHERE status = 'completed'");
    const pendingEstimates = await dbGet("SELECT COUNT(*) as count FROM estimates WHERE status = 'pending'");

    res.json({
      customers: customersCount.count,
      pendingEmployees: employeesPendingCount.count,
      activeEmployees: employeesApprovedCount.count,
      activeProjects: projectsActiveCount.count,
      completedProjects: projectsCompletedCount.count,
      pendingEstimates: pendingEstimates.count
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error loading dashboard metrics' });
  }
});

// Get List of Employees (approved and pending)
app.get('/api/admin/employees', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });

  try {
    const employees = await dbAll("SELECT * FROM employees ORDER BY id DESC");
    res.json(employees);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching workers' });
  }
});

// Approve/Reject Worker Profile
app.post('/api/admin/employees/:id/action', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });
  const { action, dailyRate } = req.body; // 'approved' or 'rejected'
  const empId = req.params.id;

  try {
    const rate = dailyRate ? parseFloat(dailyRate) : 1500.0;
    await dbRun("UPDATE employees SET status = ?, daily_rate = ? WHERE id = ?", [action, rate, empId]);
    res.json({ message: `Employee status successfully updated to ${action}!` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during employee status change' });
  }
});

// Get List of All Estimate Requests
app.get('/api/admin/estimates', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });

  try {
    const estimates = await dbAll(
      `SELECT e.*, c.full_name as customer_name, c.phone, c.address, h.title as plan_title 
       FROM estimates e 
       JOIN customers c ON e.customer_id = c.id
       LEFT JOIN house_plans h ON e.requested_plan_id = h.id 
       ORDER BY e.status ASC, e.id DESC`
    );
    res.json(estimates);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error loading estimate requests' });
  }
});

// Action Estimate (Approve and generate project, or reject)
app.post('/api/admin/estimates/:id/action', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });
  const { action, costEstimate } = req.body; // 'approved' or 'rejected'
  const estId = req.params.id;

  try {
    const estimate = await dbGet("SELECT * FROM estimates WHERE id = ?", [estId]);
    if (!estimate) return res.status(404).json({ message: 'Estimate request not found' });

    if (action === 'approved') {
      const finalCost = costEstimate ? parseFloat(costEstimate) : estimate.cost_estimate;
      
      // Update estimate status
      await dbRun("UPDATE estimates SET status = 'approved', cost_estimate = ? WHERE id = ?", [finalCost, estId]);
      
      // Create associated project
      const today = new Date().toISOString().split('T')[0];
      const projectName = `${estimate.house_type.charAt(0).toUpperCase() + estimate.house_type.slice(1)}-Story House Project`;
      
      const customer = await dbGet("SELECT address FROM customers WHERE id = ?", [estimate.customer_id]);

      await dbRun(
        `INSERT INTO projects (name, customer_id, location, status, progress_percent, estimate_cost, start_date) 
         VALUES (?, ?, ?, 'foundation', 0, ?, ?)`,
        [projectName, estimate.customer_id, customer ? customer.address : 'Colombo', finalCost, today]
      );
      
      res.json({ message: 'Estimate approved and Project created successfully!' });
    } else {
      await dbRun("UPDATE estimates SET status = 'rejected' WHERE id = ?", [estId]);
      res.json({ message: 'Estimate rejected.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating estimate status' });
  }
});

// Get All Projects
app.get('/api/admin/projects', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });

  try {
    const projects = await dbAll(
      `SELECT p.*, c.full_name as customer_name, c.phone 
       FROM projects p 
       JOIN customers c ON p.customer_id = c.id
       ORDER BY p.id DESC`
    );
    res.json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching projects' });
  }
});

// Update Project progress
app.post('/api/admin/projects/:id/progress', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });
  const { status, progressPercent } = req.body;
  const projId = req.params.id;

  try {
    await dbRun(
      "UPDATE projects SET status = ?, progress_percent = ? WHERE id = ?",
      [status, progressPercent, projId]
    );
    res.json({ message: 'Project progress successfully updated!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating project progress' });
  }
});

// Assign workers to project
app.post('/api/admin/projects/:id/assign', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });
  const { employeeIds } = req.body; // Array of employee IDs e.g. [1, 2, 4]
  const projId = req.params.id;

  try {
    const empIdsStr = Array.isArray(employeeIds) ? employeeIds.join(',') : '';
    await dbRun("UPDATE projects SET assigned_employees = ? WHERE id = ?", [empIdsStr, projId]);
    res.json({ message: 'Workers successfully assigned to project!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error assigning workers' });
  }
});

// ==========================================
// MESSAGING API
// ==========================================

// Send Message
app.post('/api/messages', authenticateToken, async (req, res) => {
  const { receiverId, content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ message: 'Message content cannot be empty' });
  if (!receiverId) return res.status(400).json({ message: 'Receiver ID is required' });

  try {
    const result = await dbRun(
      "INSERT INTO messages (sender_id, receiver_id, content, is_read) VALUES (?, ?, ?, 0)",
      [req.user.id, receiverId, content.trim()]
    );
    const msg = await dbGet(
      `SELECT m.*, u_send.username as sender_name FROM messages m JOIN users u_send ON m.sender_id = u_send.id WHERE m.id = ?`,
      [result.id]
    );
    res.status(201).json({ message: 'Message sent!', data: msg });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error sending message' });
  }
});

// Get Messages between current user and target user (also marks received messages as read)
app.get('/api/messages/:targetUserId', authenticateToken, async (req, res) => {
  const targetId = req.params.targetUserId;
  try {
    const messages = await dbAll(
      `SELECT m.*, u_send.username as sender_name, u_recv.username as receiver_name 
       FROM messages m
       JOIN users u_send ON m.sender_id = u_send.id
       JOIN users u_recv ON m.receiver_id = u_recv.id
       WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
       ORDER BY m.timestamp ASC`,
      [req.user.id, targetId, targetId, req.user.id]
    );
    // Mark incoming messages from targetId as read
    await dbRun(
      "UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0",
      [targetId, req.user.id]
    );
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error loading messages' });
  }
});

// Get list of all users who have chatted with admin, with unread count + last message
app.get('/api/admin/chats', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });
  try {
    const users = await dbAll(
      `SELECT u.id, u.username, u.role,
        COALESCE(c.full_name, e.full_name, u.username) as display_name,
        (
          SELECT COUNT(*) FROM messages 
          WHERE sender_id = u.id AND receiver_id = ? AND is_read = 0
        ) as unread_count,
        (
          SELECT content FROM messages 
          WHERE (sender_id = u.id AND receiver_id = ?) OR (sender_id = ? AND receiver_id = u.id)
          ORDER BY timestamp DESC LIMIT 1
        ) as last_message,
        (
          SELECT timestamp FROM messages 
          WHERE (sender_id = u.id AND receiver_id = ?) OR (sender_id = ? AND receiver_id = u.id)
          ORDER BY timestamp DESC LIMIT 1
        ) as last_message_time
       FROM users u
       LEFT JOIN customers c ON u.id = c.user_id
       LEFT JOIN employees e ON u.id = e.user_id
       WHERE u.role != 'admin'
       ORDER BY CASE WHEN last_message_time IS NULL THEN 1 ELSE 0 END ASC,
                last_message_time DESC,
                u.username ASC`,
      [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id]
    );
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error loading chats' });
  }
});

// Get admin's user ID (so customer knows who to message)
app.get('/api/admin/id', authenticateToken, async (req, res) => {
  try {
    const admin = await dbGet("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (!admin) return res.status(404).json({ message: 'No admin found' });
    res.json({ adminId: admin.id });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unread message count for current user
app.get('/api/messages/unread/count', authenticateToken, async (req, res) => {
  try {
    const row = await dbGet(
      "SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = 0",
      [req.user.id]
    );
    res.json({ count: row.count });
  } catch (error) {
    res.status(500).json({ count: 0 });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
