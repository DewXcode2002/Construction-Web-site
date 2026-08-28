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
const uploadsDir = process.env.VERCEL
  ? path.join('/tmp', 'uploads')
  : path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Multer storage setup with 5MB limit
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB Limit per file
});

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
// AUTH ROUTES
// ==========================================

// Register Route
app.post('/api/auth/register', async (req, res) => {
  const { username, password, email, role, fullName, phone, address, nic, experience, category } = req.body;

  if (!username || !password || !email || !role) {
    return res.status(400).json({ message: 'All required fields must be filled' });
  }

  try {
    // Check if user exists
    const existingUser = await dbGet("SELECT * FROM users WHERE username = ? OR email = ?", [username, email]);
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await dbRun(
      "INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)",
      [username, hashedPassword, email, role]
    );
    const userId = result.id;

    // Create role-specific profile
    if (role === 'customer') {
      await dbRun(
        "INSERT INTO customers (user_id, full_name, phone, address) VALUES (?, ?, ?, ?)",
        [userId, fullName || username, phone || '', address || '']
      );
    } else if (role === 'employee') {
      await dbRun(
        "INSERT INTO employees (user_id, full_name, phone, address, nic, experience, category, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')",
        [userId, fullName || username, phone || '', address || '', nic || 'N/A', experience || '1 year', category || 'Masonry work']
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

// Reset Password Route
app.post('/api/auth/reset-password', async (req, res) => {
  const { username, email, newPassword } = req.body;

  if (!username || !email || !newPassword) {
    return res.status(400).json({ message: 'Username, registered email, and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  try {
    const user = await dbGet("SELECT * FROM users WHERE username = ? AND email = ?", [username, email]);
    if (!user) {
      return res.status(404).json({ message: 'User account not found with matching username & email' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await dbRun("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, user.id]);

    res.json({ message: 'Password updated successfully! You can now log in.' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Server error resetting password' });
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
    serviceDetails,
    planOption,
    clientPlanUrl,
    materialBrands,
    customerNotes,
    contactPreference
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
    const brandsStr = typeof materialBrands === 'object' ? JSON.stringify(materialBrands) : (materialBrands || '{}');

    const result = await dbRun(
      `INSERT INTO estimates (
        customer_id, land_size, budget, house_type, bedrooms, bathrooms, materials, 
        cost_estimate, duration_weeks, requested_plan_id, status, payment_method, fee_paid, is_paid, 
        service_type, service_details, plan_option, client_plan_url, material_brands, customer_notes, contact_preference
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, 1500.0, 1, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customer.id, landSize || 0, budget || 0, houseType || 'single', bedrooms || 0, bathrooms || 0, 
        materialsStr, cost_estimate, duration_weeks, requestedPlanId || null, paymentMethod || 'Cash Payments', 
        sType, detailsStr, planOption || 'template', clientPlanUrl || null, brandsStr, customerNotes || '', contactPreference || 'whatsapp'
      ]
    );

    res.status(201).json({ 
      message: 'Estimate request submitted successfully! Admin will review details and physically calculate your estimate.',
      estimateId: result.id,
      costEstimate: cost_estimate,
      durationWeeks: duration_weeks
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating estimate request' });
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

// Admin Upload Custom Physical Estimate PDF & Architectural Plan
app.post('/api/admin/estimates/:id/custom-estimate', authenticateToken, upload.fields([
  { name: 'pdfFile', maxCount: 1 },
  { name: 'planFile', maxCount: 1 }
]), async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });
  const estId = req.params.id;

  const { costEstimate, durationWeeks, adminBreakdown } = req.body;

  try {
    let pdfUrl = null;
    let planUrl = null;

    if (req.files) {
      if (req.files.pdfFile && req.files.pdfFile[0]) {
        pdfUrl = `/uploads/${req.files.pdfFile[0].filename}`;
      }
      if (req.files.planFile && req.files.planFile[0]) {
        planUrl = `/uploads/${req.files.planFile[0].filename}`;
      }
    }

    const currentEst = await dbGet("SELECT * FROM estimates WHERE id = ?", [estId]);
    if (!currentEst) return res.status(404).json({ message: 'Estimate request not found' });

    const finalPdfUrl = pdfUrl || currentEst.admin_pdf_url;
    const finalPlanUrl = planUrl || currentEst.admin_plan_url;
    const finalCost = costEstimate ? parseFloat(costEstimate) : currentEst.cost_estimate;
    const finalDuration = durationWeeks ? parseInt(durationWeeks) : currentEst.duration_weeks;

    await dbRun(
      `UPDATE estimates 
       SET admin_pdf_url = ?, admin_plan_url = ?, cost_estimate = ?, duration_weeks = ?, admin_breakdown = ?, status = 'budgeted' 
       WHERE id = ?`,
      [finalPdfUrl, finalPlanUrl, finalCost, finalDuration, adminBreakdown || '', estId]
    );

    res.json({ 
      message: 'Physical estimate & architectural plan successfully dispatched to customer!',
      pdfUrl: finalPdfUrl,
      planUrl: finalPlanUrl
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error saving physical estimate' });
  }
});

// Legacy Admin Upload Company Budget PDF
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

// Customer Reply to Estimate (Accept Budget OR Request Revision)
app.post('/api/customer/estimates/:id/reply', authenticateToken, async (req, res) => {
  if (req.user.role !== 'customer') return res.status(403).json({ message: 'Unauthorized' });
  const estId = req.params.id;
  const { action, feedbackMessage } = req.body; // action: 'accept' or 'request_revision'

  try {
    const estimate = await dbGet("SELECT * FROM estimates WHERE id = ?", [estId]);
    if (!estimate) return res.status(404).json({ message: 'Estimate not found' });

    if (action === 'accept') {
      // Update status to approved
      await dbRun("UPDATE estimates SET status = 'approved', customer_feedback = ? WHERE id = ?", [feedbackMessage || 'Accepted budget', estId]);

      // Create live building project automatically!
      const today = new Date().toISOString().split('T')[0];
      const hType = estimate.house_type || 'Custom';
      const projectName = `${hType.charAt(0).toUpperCase() + hType.slice(1)} ${estimate.service_type || 'Construction'} Project`;
      
      const customer = await dbGet("SELECT address FROM customers WHERE id = ?", [estimate.customer_id]);

      await dbRun(
        `INSERT INTO projects (name, customer_id, location, status, progress_percent, estimate_cost, start_date) 
         VALUES (?, ?, ?, 'foundation', 0, ?, ?)`,
        [projectName, estimate.customer_id, customer ? customer.address : 'Colombo', estimate.cost_estimate, today]
      );

      res.json({ message: 'Budget accepted successfully! Project construction launched.' });
    } else if (action === 'request_revision') {
      if (!feedbackMessage || !feedbackMessage.trim()) {
        return res.status(400).json({ message: 'Please provide revision feedback details.' });
      }
      await dbRun("UPDATE estimates SET status = 'revision_requested', customer_feedback = ? WHERE id = ?", [feedbackMessage.trim(), estId]);
      res.json({ message: 'Revision request sent to Admin. Admin will review your feedback and update the physical estimate.' });
    } else {
      res.status(400).json({ message: 'Invalid action' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error processing estimate reply' });
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
// SHOWCASE PROJECTS (WEBSITE PORTFOLIO) API
// ==========================================

// Public: Get all showcase projects for Home page
app.get('/api/showcase-projects', async (req, res) => {
  try {
    const rows = await dbAll("SELECT * FROM showcase_projects ORDER BY id DESC");
    const projects = rows.map(r => ({
      id: r.id.toString(),
      title: r.title,
      location: r.location,
      category: r.category,
      isVerified: Boolean(r.is_verified),
      image: r.image_url,
      tag: r.tag || 'Rohana Completed Build',
      description: r.description,
      specs: r.specs ? JSON.parse(r.specs) : {},
      gallery: r.gallery ? JSON.parse(r.gallery) : [r.image_url],
      galleryCaptions: r.gallery_captions ? JSON.parse(r.gallery_captions) : []
    }));
    res.json(projects);
  } catch (error) {
    console.error('Error fetching showcase projects:', error);
    res.status(500).json({ message: 'Server error fetching showcase projects' });
  }
});

// Admin: Get all showcase projects
app.get('/api/admin/showcase-projects', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });
  try {
    const rows = await dbAll("SELECT * FROM showcase_projects ORDER BY id DESC");
    const projects = rows.map(r => ({
      id: r.id,
      title: r.title,
      location: r.location,
      category: r.category,
      isVerified: Boolean(r.is_verified),
      image: r.image_url,
      tag: r.tag,
      description: r.description,
      specs: r.specs ? JSON.parse(r.specs) : {},
      gallery: r.gallery ? JSON.parse(r.gallery) : [],
      galleryCaptions: r.gallery_captions ? JSON.parse(r.gallery_captions) : []
    }));
    res.json(projects);
  } catch (error) {
    console.error('Error fetching admin showcase projects:', error);
    res.status(500).json({ message: 'Server error fetching showcase projects' });
  }
});

// Admin: Add new showcase project (supports cover & gallery file uploads or URLs)
app.post('/api/admin/showcase-projects', authenticateToken, upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'galleryImages', maxCount: 20 }
]), async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });

  try {
    const { title, location, category, tag, description, specs, imageUrl, galleryUrls, galleryCaptions } = req.body;

    if (!title || !location || !description) {
      return res.status(400).json({ message: 'Title, location, and description are required' });
    }

    let coverPath = imageUrl || '';
    if (req.files && req.files.coverImage && req.files.coverImage[0]) {
      coverPath = `/uploads/${req.files.coverImage[0].filename}`;
    }

    if (!coverPath) {
      coverPath = 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1200&q=80';
    }

    let galleryArr = [];
    if (req.files && req.files.galleryImages && req.files.galleryImages.length > 0) {
      galleryArr = req.files.galleryImages.map(f => `/uploads/${f.filename}`);
    } else if (galleryUrls) {
      try {
        galleryArr = typeof galleryUrls === 'string' ? JSON.parse(galleryUrls) : galleryUrls;
      } catch (e) {
        galleryArr = [coverPath];
      }
    } else {
      galleryArr = [coverPath];
    }

    let parsedSpecs = {};
    if (specs) {
      try {
        parsedSpecs = typeof specs === 'string' ? JSON.parse(specs) : specs;
      } catch (e) {
        parsedSpecs = {};
      }
    }

    let parsedCaptions = [];
    if (galleryCaptions) {
      try {
        parsedCaptions = typeof galleryCaptions === 'string' ? JSON.parse(galleryCaptions) : galleryCaptions;
      } catch (e) {
        parsedCaptions = [];
      }
    }

    const result = await dbRun(
      `INSERT INTO showcase_projects (title, location, category, is_verified, image_url, tag, description, specs, gallery, gallery_captions)
       VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        location,
        category || 'house',
        coverPath,
        tag || 'Rohana Completed Build',
        description,
        JSON.stringify(parsedSpecs),
        JSON.stringify(galleryArr),
        JSON.stringify(parsedCaptions)
      ]
    );

    res.json({ message: 'Showcase project created successfully!', projectId: result.id });
  } catch (error) {
    console.error('Error creating showcase project:', error);
    res.status(500).json({ message: 'Server error creating showcase project' });
  }
});

// Admin: Edit existing showcase project
app.put('/api/admin/showcase-projects/:id', authenticateToken, upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'galleryImages', maxCount: 20 }
]), async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });
  const projId = req.params.id;

  try {
    const existing = await dbGet("SELECT * FROM showcase_projects WHERE id = ?", [projId]);
    if (!existing) return res.status(404).json({ message: 'Project not found' });

    const { title, location, category, tag, description, specs, imageUrl, galleryUrls, galleryCaptions } = req.body;

    let coverPath = existing.image_url;
    if (req.files && req.files.coverImage && req.files.coverImage[0]) {
      coverPath = `/uploads/${req.files.coverImage[0].filename}`;
    } else if (imageUrl) {
      coverPath = imageUrl;
    }

    let galleryArr = existing.gallery ? JSON.parse(existing.gallery) : [];
    if (req.files && req.files.galleryImages && req.files.galleryImages.length > 0) {
      const newFiles = req.files.galleryImages.map(f => `/uploads/${f.filename}`);
      galleryArr = [...galleryArr, ...newFiles];
    } else if (galleryUrls) {
      try {
        galleryArr = typeof galleryUrls === 'string' ? JSON.parse(galleryUrls) : galleryUrls;
      } catch (e) {}
    }

    let parsedSpecs = existing.specs ? JSON.parse(existing.specs) : {};
    if (specs) {
      try {
        parsedSpecs = typeof specs === 'string' ? JSON.parse(specs) : specs;
      } catch (e) {}
    }

    let parsedCaptions = existing.gallery_captions ? JSON.parse(existing.gallery_captions) : [];
    if (galleryCaptions) {
      try {
        parsedCaptions = typeof galleryCaptions === 'string' ? JSON.parse(galleryCaptions) : galleryCaptions;
      } catch (e) {}
    }

    await dbRun(
      `UPDATE showcase_projects 
       SET title = ?, location = ?, category = ?, image_url = ?, tag = ?, description = ?, specs = ?, gallery = ?, gallery_captions = ?
       WHERE id = ?`,
      [
        title || existing.title,
        location || existing.location,
        category || existing.category,
        coverPath,
        tag || existing.tag,
        description || existing.description,
        JSON.stringify(parsedSpecs),
        JSON.stringify(galleryArr),
        JSON.stringify(parsedCaptions),
        projId
      ]
    );

    res.json({ message: 'Showcase project updated successfully!' });
  } catch (error) {
    console.error('Error updating showcase project:', error);
    res.status(500).json({ message: 'Server error updating showcase project' });
  }
});

// Admin: Delete showcase project
app.delete('/api/admin/showcase-projects/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });
  const projId = req.params.id;

  try {
    await dbRun("DELETE FROM showcase_projects WHERE id = ?", [projId]);
    res.json({ message: 'Showcase project deleted successfully!' });
  } catch (error) {
    console.error('Error deleting showcase project:', error);
    res.status(500).json({ message: 'Server error deleting showcase project' });
  }
});

// ==========================================
// HOUSES & PROPERTIES FOR SALE API
// ==========================================

// Public: Get all houses for sale
app.get('/api/properties-for-sale', async (req, res) => {
  try {
    const rows = await dbAll("SELECT * FROM houses_for_sale ORDER BY id DESC");
    const parsed = rows.map(r => {
      let galleryArr = [r.image_url];
      try {
        if (r.gallery) galleryArr = JSON.parse(r.gallery);
      } catch (e) {}
      return { ...r, gallery: galleryArr };
    });
    res.json(parsed);
  } catch (error) {
    console.error('Error fetching houses for sale:', error);
    res.status(500).json({ message: 'Server error fetching houses for sale' });
  }
});

// Helper function to convert uploaded multer file to Base64 data URL for Vercel/Production compatibility
const fileToBase64 = (file) => {
  try {
    if (file.buffer) {
      return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    } else if (file.path && fs.existsSync(file.path)) {
      const fileData = fs.readFileSync(file.path);
      return `data:${file.mimetype || 'image/jpeg'};base64,${fileData.toString('base64')}`;
    }
  } catch (e) {
    console.error('Error converting file to base64:', e);
  }
  return file.filename ? `/uploads/${file.filename}` : '';
};

// Admin: Add new house/land for sale
app.post('/api/admin/properties-for-sale', authenticateToken, upload.fields([
  { name: 'coverFile', maxCount: 1 },
  { name: 'galleryFiles', maxCount: 10 }
]), async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });

  const { title, location, price, perches, bedrooms, bathrooms, stories, description, imageUrl, contactPhone, status, propertyType, landType, features } = req.body;

  if (!title || !location || !price) {
    return res.status(400).json({ message: 'Title, location, and price are required' });
  }

  let coverPath = imageUrl || '/images/rohana-completed-house/house1.jpg';
  if (req.files && req.files.coverFile && req.files.coverFile[0]) {
    coverPath = fileToBase64(req.files.coverFile[0]);
  }

  let galleryArr = [coverPath];
  if (req.files && req.files.galleryFiles && req.files.galleryFiles.length > 0) {
    req.files.galleryFiles.forEach(f => {
      galleryArr.push(fileToBase64(f));
    });
  }

  try {
    const result = await dbRun(
      `INSERT INTO houses_for_sale (title, location, price, perches, bedrooms, bathrooms, stories, description, image_url, gallery, contact_phone, status, property_type, land_type, features)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        location,
        parseFloat(price) || 0,
        parseFloat(perches) || 10,
        parseInt(bedrooms) || 0,
        parseInt(bathrooms) || 0,
        stories || 'N/A',
        description || '',
        coverPath,
        JSON.stringify(galleryArr),
        contactPhone || '076 911 73 98',
        status || 'available',
        propertyType || 'house',
        landType || 'Residential Plot',
        features ? (typeof features === 'string' ? features : JSON.stringify(features)) : '[]'
      ]
    );

    res.status(201).json({ message: 'Property listing created successfully!', id: result.id });
  } catch (error) {
    console.error('Error creating property listing:', error);
    res.status(500).json({ message: 'Server error creating property listing' });
  }
});

// Admin: Update house/land for sale / toggle status
app.put('/api/admin/properties-for-sale/:id', authenticateToken, upload.fields([
  { name: 'coverFile', maxCount: 1 },
  { name: 'galleryFiles', maxCount: 10 }
]), async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });
  const propId = req.params.id;

  try {
    const existing = await dbGet("SELECT * FROM houses_for_sale WHERE id = ?", [propId]);
    if (!existing) return res.status(404).json({ message: 'Property not found' });

    const { title, location, price, perches, bedrooms, bathrooms, stories, description, imageUrl, contactPhone, status, propertyType, landType, features } = req.body;

    let coverPath = existing.image_url;
    if (req.files && req.files.coverFile && req.files.coverFile[0]) {
      coverPath = fileToBase64(req.files.coverFile[0]);
    } else if (imageUrl) {
      coverPath = imageUrl;
    }

    let galleryArr = [];
    try {
      if (existing.gallery) galleryArr = JSON.parse(existing.gallery);
    } catch (e) {}

    if (req.files && req.files.galleryFiles && req.files.galleryFiles.length > 0) {
      galleryArr = [coverPath];
      req.files.galleryFiles.forEach(f => galleryArr.push(fileToBase64(f)));
    }

    await dbRun(
      `UPDATE houses_for_sale 
       SET title = ?, location = ?, price = ?, perches = ?, bedrooms = ?, bathrooms = ?, stories = ?, description = ?, image_url = ?, gallery = ?, contact_phone = ?, status = ?, property_type = ?, land_type = ?, features = ?
       WHERE id = ?`,
      [
        title !== undefined ? title : existing.title,
        location !== undefined ? location : existing.location,
        price !== undefined ? parseFloat(price) : existing.price,
        perches !== undefined ? parseFloat(perches) : existing.perches,
        bedrooms !== undefined ? parseInt(bedrooms) : existing.bedrooms,
        bathrooms !== undefined ? parseInt(bathrooms) : existing.bathrooms,
        stories !== undefined ? stories : existing.stories,
        description !== undefined ? description : existing.description,
        coverPath,
        JSON.stringify(galleryArr),
        contactPhone !== undefined ? contactPhone : existing.contact_phone,
        status !== undefined ? status : existing.status,
        propertyType !== undefined ? propertyType : (existing.property_type || 'house'),
        landType !== undefined ? landType : (existing.land_type || 'Residential Plot'),
        features !== undefined ? (typeof features === 'string' ? features : JSON.stringify(features)) : existing.features,
        propId
      ]
    );

    res.json({ message: 'Property listing updated successfully!' });
  } catch (error) {
    console.error('Error updating property listing:', error);
    res.status(500).json({ message: 'Server error updating property listing' });
  }
});

// Admin: Delete house for sale
app.delete('/api/admin/properties-for-sale/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });
  const propId = req.params.id;

  try {
    await dbRun("DELETE FROM houses_for_sale WHERE id = ?", [propId]);
    res.json({ message: 'Property listing deleted successfully!' });
  } catch (error) {
    console.error('Error deleting property listing:', error);
    res.status(500).json({ message: 'Server error deleting property listing' });
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

// ====================== DIRECT SERVICE INQUIRIES ENDPOINTS ======================

// Submit a direct service inquiry (Public / Customer)
app.post('/api/inquiries', async (req, res) => {
  try {
    const { name, phone, location, service_type, details, contact_time } = req.body;
    if (!name || !phone || !service_type) {
      return res.status(400).json({ message: 'Name, phone number, and service type are required.' });
    }

    const result = await dbRun(
      `INSERT INTO inquiries (name, phone, location, service_type, details, contact_time)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, phone, location || '', service_type, details || '', contact_time || 'Anytime']
    );

    res.status(201).json({
      message: 'Direct inquiry submitted successfully. Our team will contact you shortly!',
      inquiryId: result.id
    });
  } catch (error) {
    console.error('Error submitting inquiry:', error);
    res.status(500).json({ message: 'Failed to submit inquiry' });
  }
});

// Get all direct service inquiries (Admin only)
app.get('/api/admin/inquiries', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const inquiries = await dbAll("SELECT * FROM inquiries ORDER BY created_at DESC");
    res.json(inquiries);
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    res.status(500).json({ message: 'Failed to load inquiries' });
  }
});

// Update inquiry status (Admin only)
app.patch('/api/admin/inquiries/:id/status', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const { status } = req.body;
    await dbRun("UPDATE inquiries SET status = ? WHERE id = ?", [status, req.params.id]);
    res.json({ message: 'Status updated' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating inquiry status' });
  }
});

// Delete an inquiry (Admin only)
app.delete('/api/admin/inquiries/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    await dbRun("DELETE FROM inquiries WHERE id = ?", [req.params.id]);
    res.json({ message: 'Inquiry deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting inquiry' });
  }
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
