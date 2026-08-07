import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, HardHat, ClipboardList, CheckSquare, MessageSquare, 
  Send, UserCheck, Check, X, ShieldCheck, Settings, RefreshCw 
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);

  // Data states
  const [metrics, setMetrics] = useState({ customers: 0, pendingEmployees: 0, activeEmployees: 0, activeProjects: 0, completedProjects: 0, pendingEstimates: 0 });
  const [employees, setEmployees] = useState([]);
  const [estimates, setEstimates] = useState([]);
  const [projects, setProjects] = useState([]);
  const [chats, setChats] = useState([]);
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  
  // Action inputs
  const [adjustedCost, setAdjustedCost] = useState({});
  const [assignedRates, setAssignedRates] = useState({});
  const [msgInput, setMsgInput] = useState('');
  const [assignedWorkers, setAssignedWorkers] = useState({});
  const [uploadFiles, setUploadFiles] = useState({});
  const [adjustedWeeks, setAdjustedWeeks] = useState({});
  const chatEndRef = useRef(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('rcms_token');
    const storedUser = localStorage.getItem('rcms_user');
    if (!storedToken || !storedUser) {
      navigate('/login');
      return;
    }

    const u = JSON.parse(storedUser);
    if (u.role !== 'admin') {
      navigate('/');
      return;
    }

    setToken(storedToken);
    setUser(u);

    // Initial fetches
    fetchAllData(storedToken);
  }, []);

  const fetchAllData = (authToken) => {
    const headers = { 'Authorization': `Bearer ${authToken}` };
    
    // Metrics
    fetch('http://localhost:5000/api/admin/metrics', { headers })
      .then(res => res.json())
      .then(data => setMetrics(data))
      .catch(err => console.error(err));

    // Employees
    fetch('http://localhost:5000/api/admin/employees', { headers })
      .then(res => res.json())
      .then(data => setEmployees(data))
      .catch(err => console.error(err));

    // Estimates
    fetch('http://localhost:5000/api/admin/estimates', { headers })
      .then(res => res.json())
      .then(data => setEstimates(data))
      .catch(err => console.error(err));

    // Projects
    fetch('http://localhost:5000/api/admin/projects', { headers })
      .then(res => res.json())
      .then(data => {
        setProjects(data);
        // Pre-fill assigned workers mapping
        const workersMap = {};
        data.forEach(p => {
          workersMap[p.id] = p.assigned_employees ? p.assigned_employees.split(',').map(Number) : [];
        });
        setAssignedWorkers(workersMap);
      })
      .catch(err => console.error(err));

    // Chats user list
    fetch('http://localhost:5000/api/admin/chats', { headers })
      .then(res => res.json())
      .then(data => setChats(data))
      .catch(err => console.error(err));
  };

  // Fetch messages for selected user
  useEffect(() => {
    if (!token || !selectedChatUser) return;
    fetchChatMessages(selectedChatUser.id);
    
    const interval = setInterval(() => {
      fetchChatMessages(selectedChatUser.id);
    }, 5000);
    return () => clearInterval(interval);
  }, [token, selectedChatUser]);

  const fetchChatMessages = (targetId) => {
    fetch(`http://localhost:5000/api/messages/${targetId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setChatMessages(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Actions
  const handleEmployeeAction = async (empId, action) => {
    const rate = assignedRates[empId] || 1500.0;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/employees/${empId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action, dailyRate: rate })
      });
      if (res.ok) {
        fetchAllData(token);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEstimateAction = async (estId, action) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/estimates/${estId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        fetchAllData(token);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePdfUpload = async (estId) => {
    const file = uploadFiles[estId];
    if (!file) {
      alert('Please select a PDF file first.');
      return;
    }
    const cost = adjustedCost[estId] || '';
    const weeks = adjustedWeeks[estId] || '';

    const formData = new FormData();
    formData.append('pdfFile', file);
    if (cost) formData.append('costEstimate', cost);
    if (weeks) formData.append('durationWeeks', weeks);

    try {
      const res = await fetch(`http://localhost:5000/api/admin/estimates/${estId}/upload-pdf`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      alert('Budget PDF successfully uploaded and estimate sent to client!');
      fetchAllData(token);
      
      // Reset files
      setUploadFiles(prev => {
        const copy = { ...prev };
        delete copy[estId];
        return copy;
      });
    } catch (err) {
      alert('Error uploading PDF: ' + err.message);
    }
  };

  const handleProgressChange = async (projId, progressPercent, status) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/projects/${projId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, progressPercent })
      });
      if (res.ok) {
        fetchAllData(token);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleWorkerAssignment = async (projId, empId) => {
    const currentList = assignedWorkers[projId] || [];
    const newList = currentList.includes(empId)
      ? currentList.filter(id => id !== empId)
      : [...currentList, empId];

    setAssignedWorkers(prev => ({ ...prev, [projId]: newList }));

    try {
      await fetch(`http://localhost:5000/api/admin/projects/${projId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ employeeIds: newList })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!msgInput.trim() || !selectedChatUser) return;

    const text = msgInput.trim();
    setMsgInput('');

    try {
      const res = await fetch('http://localhost:5000/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ receiverId: selectedChatUser.id, content: text })
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setChatMessages(prev => [...prev, data.data]);
      } else {
        fetchChatMessages(selectedChatUser.id);
      }
      // Refresh chat list to update last message preview
      fetch('http://localhost:5000/api/admin/chats', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json()).then(d => setChats(d)).catch(() => {});
    } catch (err) {
      console.error(err);
      fetchChatMessages(selectedChatUser.id);
    }
  };

  // Chart configs
  const doughnutData = {
    labels: ['Active Projects', 'Completed Projects'],
    datasets: [
      {
        data: [metrics.activeProjects, metrics.completedProjects],
        backgroundColor: ['rgba(245, 158, 11, 0.85)', 'rgba(34, 197, 94, 0.85)'],
        borderColor: ['#f59e0b', '#22c55e'],
        borderWidth: 1,
      },
    ],
  };

  const barData = {
    labels: ['Masons', 'Carpenters', 'Electricians', 'Painters', 'Plumbers', 'Tile Specialists'],
    datasets: [
      {
        label: 'Approved Workers',
        data: [
          employees.filter(e => e.category === 'Masonry work' && e.status === 'approved').length,
          employees.filter(e => e.category === 'Carpentry' && e.status === 'approved').length,
          employees.filter(e => e.category === 'House wiring' && e.status === 'approved').length,
          employees.filter(e => e.category === 'Painting' && e.status === 'approved').length,
          employees.filter(e => e.category === 'Plumbing' && e.status === 'approved').length,
          employees.filter(e => e.category === 'Tile' && e.status === 'approved').length,
        ],
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-20 flex flex-col md:flex-row">
      
      {/* Sidebar navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-white shrink-0 border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="block text-xs uppercase tracking-widest text-amber-500 font-semibold mb-1">Company Console</span>
            <h2 className="font-bold text-lg text-white leading-tight">Administrator</h2>
          </div>
          <button 
            onClick={() => fetchAllData(token)} 
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: 'overview', label: 'Admin Overview', icon: Settings },
            { id: 'estimates', label: 'Estimates & Inquiries', icon: ClipboardList },
            { id: 'employees', label: 'Employees & Approvals', icon: Users },
            { id: 'projects', label: 'Projects & Tasks', icon: UserCheck },
            { id: 'messages', label: 'Unified Inbox', icon: MessageSquare }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                activeTab === tab.id 
                  ? 'bg-amber-500 text-slate-950 shadow-md' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <tab.icon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 p-6 md:p-10 max-w-5xl">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-950">System Metrics Dashboard</h2>
              <p className="text-slate-500 text-sm">Real-time statistics covering customers, employees, projects, and pending applications.</p>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-sm space-y-2">
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Clients</span>
                <span className="block text-2xl font-black text-slate-950">{metrics.customers}</span>
              </div>
              <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-sm space-y-2">
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Projects</span>
                <span className="block text-2xl font-black text-slate-950">{metrics.activeProjects}</span>
              </div>
              <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-sm space-y-2">
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pending Estimates</span>
                <span className="block text-2xl font-black text-amber-500">{metrics.pendingEstimates}</span>
              </div>
              <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-sm space-y-2">
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pending Workers</span>
                <span className="block text-2xl font-black text-amber-500">{metrics.pendingEmployees}</span>
              </div>
            </div>

            {/* Charts Visualizer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-sm space-y-4">
                <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">Active vs Completed Projects</h3>
                <div className="h-64 flex justify-center items-center">
                  <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>
              <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-sm space-y-4">
                <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">Employees category breakdown</h3>
                <div className="h-64 flex justify-center items-center">
                  <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ESTIMATES TAB */}
        {activeTab === 'estimates' && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-950">Estimates & Inquiries</h2>
              <p className="text-slate-500 text-sm">Review build parameters submitted by customer portal, adjust pricing, and approve them to spawn active projects.</p>
            </div>

            {estimates.length === 0 ? (
              <p className="text-xs text-slate-400 bg-white p-6 border rounded-2xl">No estimate requests received yet.</p>
            ) : (
              <div className="space-y-6">
                {estimates.map((est) => (
                  <div key={est.id} className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <span className="block text-slate-900 font-extrabold text-sm">{est.service_type || 'Residential Construction'}</span>
                        <span className="block text-[10px] text-slate-400">Client: {est.customer_name} | Phone: {est.phone}</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        est.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                        est.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        est.status === 'budgeted' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {est.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-xs text-slate-500">
                      <div>
                        <span className="block text-slate-400 font-bold uppercase text-[9px]">Service</span>
                        <span className="font-semibold text-slate-700">{est.service_type || 'Construction'}</span>
                      </div>
                      <div>
                        <span className="block text-slate-400 font-bold uppercase text-[9px]">Land / Area</span>
                        {est.land_size ? `${est.land_size} Perches` : 'N/A'}
                      </div>
                      <div>
                        <span className="block text-slate-400 font-bold uppercase text-[9px]">Materials</span>
                        {est.materials || 'Standard'}
                      </div>
                      <div>
                        <span className="block text-slate-400 font-bold uppercase text-[9px]">Calculated Cost</span>
                        LKR {est.cost_estimate ? est.cost_estimate.toLocaleString() : 'N/A'}
                      </div>
                      <div>
                        <span className="block text-slate-400 font-bold uppercase text-[9px]">Payment Plan</span>
                        <span className="font-semibold text-slate-700">{est.payment_method}</span>
                      </div>
                      <div>
                        <span className="block text-slate-400 font-bold uppercase text-[9px]">Estimate Fee</span>
                        {est.is_paid === 1 ? (
                          <span className="font-black text-emerald-600">LKR {est.fee_paid?.toLocaleString()} Paid</span>
                        ) : (
                          <span className="font-bold text-red-500">Unpaid</span>
                        )}
                      </div>
                    </div>

                    {est.plan_file_url && (
                      <div className="text-xs">
                        <span className="text-slate-400 font-bold mr-1.5 uppercase text-[9px]">Client blueprint:</span>
                        <a href={`http://localhost:5000${est.plan_file_url}`} target="_blank" rel="noreferrer" className="text-amber-500 font-bold hover:underline">
                          View Customer Plan Drawing
                        </a>
                      </div>
                    )}

                    {est.status === 'pending' && (
                      <div className="border-t border-slate-100 pt-4 space-y-4">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-500">Compile Company Budget & Quotation PDF</span>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                          <div>
                            <label className="block text-[10px] text-slate-500 font-bold mb-1.5 uppercase">Finalized Cost (LKR)</label>
                            <input
                              type="number"
                              placeholder={est.cost_estimate}
                              value={adjustedCost[est.id] || ''}
                              onChange={(e) => setAdjustedCost({ ...adjustedCost, [est.id]: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-850 focus:outline-none focus:border-amber-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 font-bold mb-1.5 uppercase">Time Range (Weeks)</label>
                            <input
                              type="number"
                              placeholder={est.duration_weeks}
                              value={adjustedWeeks[est.id] || ''}
                              onChange={(e) => setAdjustedWeeks({ ...adjustedWeeks, [est.id]: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-850 focus:outline-none focus:border-amber-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 font-bold mb-1.5 uppercase">Budget PDF Quotation</label>
                            <input
                              type="file"
                              accept=".pdf"
                              required
                              onChange={(e) => setUploadFiles({ ...uploadFiles, [est.id]: e.target.files[0] })}
                              className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800 file:cursor-pointer"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end space-x-2 pt-2 border-t border-slate-55">
                          <button
                            onClick={() => handlePdfUpload(est.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
                          >
                            <Check className="h-4 w-4" />
                            <span>Upload & Send Budget</span>
                          </button>
                          <button
                            onClick={() => handleEstimateAction(est.id, 'rejected')}
                            className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
                          >
                            <X className="h-4 w-4" />
                            <span>Reject Request</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {est.status === 'budgeted' && (
                      <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-xs text-slate-500">
                        <span>📄 Company Budget PDF uploaded. Sent to Mr/Mrs {est.customer_name}.</span>
                        <a href={`http://localhost:5000${est.admin_pdf_url}`} target="_blank" rel="noreferrer" className="text-amber-500 font-bold hover:underline">
                          View Uploaded PDF
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* EMPLOYEES TAB */}
        {activeTab === 'employees' && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-950">Employee Roster</h2>
              <p className="text-slate-500 text-sm">Approve pending construction applications and configure their daily wages.</p>
            </div>

            {employees.length === 0 ? (
              <p className="text-xs text-slate-400 bg-white p-6 border rounded-2xl">No workers registered.</p>
            ) : (
              <div className="space-y-6">
                {employees.map((emp) => (
                  <div key={emp.id} className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base leading-tight">{emp.full_name}</h3>
                        <span className="text-xs text-slate-400 capitalize">{emp.category} | Phone: {emp.phone}</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        emp.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                        emp.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {emp.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs text-slate-500">
                      <div>
                        <span className="block text-slate-400 font-bold uppercase text-[9px]">NIC</span>
                        {emp.nic}
                      </div>
                      <div>
                        <span className="block text-slate-400 font-bold uppercase text-[9px]">Experience Level</span>
                        {emp.experience}
                      </div>
                    </div>

                    {emp.status === 'pending' && (
                      <div className="border-t border-slate-150 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center space-x-2">
                          <label className="text-xs text-slate-650 font-bold">Daily Wage (LKR):</label>
                          <input
                            type="number"
                            placeholder="1500"
                            onChange={(e) => setAssignedRates({ ...assignedRates, [emp.id]: e.target.value })}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-amber-500 w-28"
                          />
                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEmployeeAction(emp.id, 'approved')}
                            className="bg-emerald-650 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
                          >
                            <UserCheck className="h-4 w-4" />
                            <span>Approve Application</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PROJECTS TAB */}
        {activeTab === 'projects' && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-950">Active Projects & Worker Assignments</h2>
              <p className="text-slate-500 text-sm">Update building progress statuses and delegate specific workers to building sites.</p>
            </div>

            {projects.length === 0 ? (
              <p className="text-xs text-slate-400 bg-white p-6 border rounded-2xl">No active construction sites.</p>
            ) : (
              <div className="space-y-6">
                {projects.map((proj) => {
                  const approvedWorkers = employees.filter(e => e.status === 'approved');
                  return (
                    <div key={proj.id} className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-6">
                      <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                        <div>
                          <h3 className="font-extrabold text-slate-900 text-lg leading-tight">{proj.name}</h3>
                          <span className="text-xs text-slate-400">Client: {proj.customer_name} | Location: {proj.location}</span>
                        </div>
                        <span className="text-xs font-black text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded">
                          {proj.progress_percent}% Done
                        </span>
                      </div>

                      {/* Adjust Stage Dropdown and Slider */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-50 pb-4">
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-650 uppercase">Stage</label>
                          <select
                            value={proj.status}
                            onChange={(e) => handleProgressChange(proj.id, proj.progress_percent, e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none w-full cursor-pointer"
                          >
                            <option value="foundation">Foundation Stage</option>
                            <option value="walls">Walls Construction</option>
                            <option value="roofing">Roofing Phase</option>
                            <option value="painting">Painting Phase</option>
                            <option value="completed">Completed Project</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-650 uppercase">Completion Rate ({proj.progress_percent}%)</label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={proj.progress_percent}
                            onChange={(e) => handleProgressChange(proj.id, parseInt(e.target.value), proj.status)}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                          />
                        </div>
                      </div>

                      {/* Delegate Employees Multiselect */}
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-650 uppercase">Assign Construction Workers</label>
                        {approvedWorkers.length === 0 ? (
                          <p className="text-[10px] text-slate-400">No approved workers available to delegate.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {approvedWorkers.map(emp => {
                              const isAssigned = (assignedWorkers[proj.id] || []).includes(emp.id);
                              return (
                                <button
                                  type="button"
                                  key={emp.id}
                                  onClick={() => handleWorkerAssignment(proj.id, emp.id)}
                                  className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                    isAssigned 
                                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm' 
                                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                                  }`}
                                >
                                  {emp.full_name} ({emp.category})
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MESSAGES TAB */}
        {activeTab === 'messages' && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-950">Unified Inbox</h2>
              <p className="text-slate-500 text-sm">Select any customer or worker from the sidebar to view and reply to messages.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden" style={{ height: '560px' }}>
              
              {/* Chats User List */}
              <div className="border-r border-slate-100 flex flex-col h-full bg-slate-50/50">
                <div className="p-4 border-b border-slate-100 font-bold text-slate-900 text-xs uppercase tracking-wider bg-slate-100">
                  All Contacts ({chats.length})
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {chats.length === 0 ? (
                    <p className="text-[10px] text-slate-400 text-center py-6">No registered users yet.</p>
                  ) : (
                    chats.map(chatUser => (
                      <button
                        key={chatUser.id}
                        onClick={() => setSelectedChatUser(chatUser)}
                        className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer ${
                          selectedChatUser?.id === chatUser.id 
                            ? 'bg-amber-500 text-slate-950' 
                            : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 min-w-0">
                            <div className={`h-7 w-7 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 ${
                              selectedChatUser?.id === chatUser.id ? 'bg-slate-900 text-white' : 'bg-amber-500 text-slate-950'
                            }`}>
                              {(chatUser.display_name || chatUser.username).charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-extrabold truncate block">{chatUser.display_name || chatUser.username}</span>
                              <span className={`text-[9px] uppercase font-bold tracking-widest ${
                                selectedChatUser?.id === chatUser.id ? 'text-slate-800' : 'text-slate-400'
                              }`}>{chatUser.role}</span>
                            </div>
                          </div>
                          {chatUser.unread_count > 0 && (
                            <span className="bg-red-500 text-white text-[9px] font-black rounded-full h-4 w-4 flex items-center justify-center shrink-0">
                              {chatUser.unread_count > 9 ? '9+' : chatUser.unread_count}
                            </span>
                          )}
                        </div>
                        {chatUser.last_message && (
                          <p className={`text-[10px] mt-1.5 truncate ${
                            selectedChatUser?.id === chatUser.id ? 'text-slate-800' : 'text-slate-400'
                          }`}>{chatUser.last_message}</p>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Chat Thread */}
              <div className="md:col-span-2 flex flex-col h-full">
                {selectedChatUser ? (
                  <>
                    {/* Header */}
                    <div className="p-4 border-b border-slate-100 flex items-center space-x-3 bg-slate-50">
                      <div className="h-9 w-9 bg-amber-500 rounded-full flex items-center justify-center text-slate-950 font-black text-sm shrink-0">
                        {(selectedChatUser.display_name || selectedChatUser.username).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="block font-extrabold text-slate-900 text-sm">{selectedChatUser.display_name || selectedChatUser.username}</span>
                        <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-widest">{selectedChatUser.role}</span>
                      </div>
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/20">
                      {chatMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
                          <MessageSquare className="h-8 w-8 text-slate-200" />
                          <p className="text-xs text-slate-400">No messages yet. Start the conversation.</p>
                        </div>
                      ) : (
                        chatMessages.map((msg, idx) => {
                          const isMe = msg.sender_id === user.id;
                          const showDate = idx === 0 || 
                            new Date(chatMessages[idx - 1].timestamp).toDateString() !== new Date(msg.timestamp).toDateString();
                          const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          const date = new Date(msg.timestamp).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
                          return (
                            <React.Fragment key={msg.id}>
                              {showDate && (
                                <div className="flex items-center justify-center my-2">
                                  <span className="text-[9px] text-slate-400 bg-slate-100 px-3 py-1 rounded-full font-semibold uppercase tracking-wider">{date}</span>
                                </div>
                              )}
                              <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                                {!isMe && (
                                  <div className="h-7 w-7 bg-amber-500 rounded-full flex items-center justify-center text-slate-950 font-black text-[10px] shrink-0 mb-1">
                                    {(selectedChatUser.display_name || selectedChatUser.username).charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className={`max-w-xs md:max-w-sm flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                  <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                                    isMe 
                                      ? 'bg-amber-500 text-slate-950 rounded-br-sm font-medium' 
                                      : 'bg-white text-slate-800 rounded-bl-sm border border-slate-100 shadow-sm'
                                  }`}>
                                    <p>{msg.content}</p>
                                  </div>
                                  <span className={`text-[9px] text-slate-400 mt-1`}>{time}</span>
                                </div>
                              </div>
                            </React.Fragment>
                          );
                        })
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Send Form */}
                    <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 flex space-x-2 bg-white">
                      <input
                        type="text"
                        required
                        value={msgInput}
                        onChange={(e) => setMsgInput(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-slate-800"
                        placeholder={`Reply to ${selectedChatUser.display_name || selectedChatUser.username}...`}
                      />
                      <button
                        type="submit"
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 p-3 rounded-xl transition-all cursor-pointer shadow-md shadow-amber-500/10 shrink-0"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 bg-slate-50/20 p-8">
                    <div className="h-14 w-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                      <MessageSquare className="h-7 w-7 text-slate-300" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-600 text-sm">Select a conversation</p>
                      <p className="text-xs text-slate-400 mt-1">Choose a client or employee from the sidebar to view and reply to messages.</p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
