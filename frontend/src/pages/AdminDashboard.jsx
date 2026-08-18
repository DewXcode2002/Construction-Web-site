import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, HardHat, ClipboardList, CheckSquare, MessageSquare, 
  Send, UserCheck, Check, X, ShieldCheck, Settings, RefreshCw,
  Briefcase, Plus, Trash2, Edit, Image as ImageIcon, Eye, UploadCloud, Home as HouseIcon, MapPin, Phone
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import API_URL from '../config';
import BackButton from '../components/BackButton';

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
  const [inquiries, setInquiries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showcaseProjects, setShowcaseProjects] = useState([]);
  const [propertiesForSale, setPropertiesForSale] = useState([]);
  const [chats, setChats] = useState([]);
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);

  // Houses For Sale Modal State
  const [isPropModalOpen, setIsPropModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [propertyForm, setPropertyForm] = useState({
    title: '',
    location: '',
    price: '',
    perches: '',
    bedrooms: '3',
    bathrooms: '2',
    stories: 'Two Stories',
    description: '',
    contactPhone: '076 911 73 98',
    status: 'available',
    imageUrl: ''
  });
  const [propCoverFile, setPropCoverFile] = useState(null);
  const [propGalleryFiles, setPropGalleryFiles] = useState([]);
  const [isSubmittingProp, setIsSubmittingProp] = useState(false);
  const [propMsg, setPropMsg] = useState('');

  // Showcase Project Modal State
  const [isShowcaseModalOpen, setIsShowcaseModalOpen] = useState(false);
  const [editingShowcase, setEditingShowcase] = useState(null);
  const [showcaseForm, setShowcaseForm] = useState({
    title: '',
    location: '',
    category: 'house',
    tag: 'Rohana Completed Build',
    description: '',
    specs: '',
    imageUrl: '',
    galleryUrls: ''
  });
  const [coverFile, setCoverFile] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [isSubmittingShowcase, setIsSubmittingShowcase] = useState(false);
  const [showcaseMsg, setShowcaseMsg] = useState('');
  
  // Action inputs
  const [adjustedCost, setAdjustedCost] = useState({});
  const [assignedRates, setAssignedRates] = useState({});
  const [msgInput, setMsgInput] = useState('');
  const [assignedWorkers, setAssignedWorkers] = useState({});
  const [uploadFiles, setUploadFiles] = useState({});
  const [uploadPlanFiles, setUploadPlanFiles] = useState({});
  const [adjustedWeeks, setAdjustedWeeks] = useState({});
  
  // Search & Filter state
  const [empSearch, setEmpSearch] = useState('');
  const [empCategoryFilter, setEmpCategoryFilter] = useState('all');
  const [empStatusFilter, setEmpStatusFilter] = useState('all');

  const [estSearch, setEstSearch] = useState('');
  const [estStatusFilter, setEstStatusFilter] = useState('all');

  const [inquirySearch, setInquirySearch] = useState('');

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
    fetch(`${API_URL}/api/admin/metrics`, { headers })
      .then(res => res.json())
      .then(data => setMetrics(data))
      .catch(err => console.error(err));

    // Employees
    fetch(`${API_URL}/api/admin/employees`, { headers })
      .then(res => res.json())
      .then(data => setEmployees(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));

    // Estimates
    fetch(`${API_URL}/api/admin/estimates`, { headers })
      .then(res => res.json())
      .then(data => setEstimates(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));

    // Direct Service Inquiries
    fetch(`${API_URL}/api/admin/inquiries`, { headers })
      .then(res => res.json())
      .then(data => setInquiries(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));

    // Projects
    fetch(`${API_URL}/api/admin/projects`, { headers })
      .then(res => res.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        setProjects(arr);
        // Pre-fill assigned workers mapping
        const workersMap = {};
        arr.forEach(p => {
          workersMap[p.id] = p.assigned_employees ? p.assigned_employees.split(',').map(Number) : [];
        });
        setAssignedWorkers(workersMap);
      })
      .catch(err => console.error(err));

    // Chats user list
    fetch(`${API_URL}/api/admin/chats`, { headers })
      .then(res => res.json())
      .then(data => setChats(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));

    // Website Showcase Portfolio Projects
    fetch(`${API_URL}/api/admin/showcase-projects`, { headers })
      .then(res => res.json())
      .then(data => setShowcaseProjects(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));

    // Houses For Sale
    fetch(`${API_URL}/api/properties-for-sale`)
      .then(res => res.json())
      .then(data => setPropertiesForSale(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));
  };

  const handleOpenAddProperty = () => {
    setEditingProperty(null);
    setPropertyForm({
      title: '',
      location: '',
      price: '',
      perches: '',
      bedrooms: '3',
      bathrooms: '2',
      stories: 'Two Stories',
      description: '',
      contactPhone: '076 911 73 98',
      status: 'available',
      imageUrl: ''
    });
    setPropCoverFile(null);
    setPropGalleryFiles([]);
    setPropMsg('');
    setIsPropModalOpen(true);
  };

  const handleOpenEditProperty = (prop) => {
    setEditingProperty(prop);
    setPropertyForm({
      title: prop.title || '',
      location: prop.location || '',
      price: prop.price || '',
      perches: prop.perches || '',
      bedrooms: prop.bedrooms || '3',
      bathrooms: prop.bathrooms || '2',
      stories: prop.stories || 'Two Stories',
      description: prop.description || '',
      contactPhone: prop.contact_phone || '076 911 73 98',
      status: prop.status || 'available',
      imageUrl: prop.image_url || ''
    });
    setPropCoverFile(null);
    setPropGalleryFiles([]);
    setPropMsg('');
    setIsPropModalOpen(true);
  };

  const handleDeleteProperty = async (propId) => {
    if (!window.confirm('Are you sure you want to delete this property advertisement?')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/properties-for-sale/${propId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchAllData(token);
      } else {
        alert('Failed to delete property advertisement.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePropertyStatus = async (prop, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/properties-for-sale/${prop.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchAllData(token);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProperty = async (e) => {
    e.preventDefault();
    setIsSubmittingProp(true);
    setPropMsg('');

    try {
      const formData = new FormData();
      formData.append('title', propertyForm.title);
      formData.append('location', propertyForm.location);
      formData.append('price', propertyForm.price);
      formData.append('perches', propertyForm.perches);
      formData.append('bedrooms', propertyForm.bedrooms);
      formData.append('bathrooms', propertyForm.bathrooms);
      formData.append('stories', propertyForm.stories);
      formData.append('description', propertyForm.description);
      formData.append('contactPhone', propertyForm.contactPhone);
      formData.append('status', propertyForm.status);
      formData.append('imageUrl', propertyForm.imageUrl);

      if (propCoverFile) {
        formData.append('coverFile', propCoverFile);
      }
      if (propGalleryFiles && propGalleryFiles.length > 0) {
        Array.from(propGalleryFiles).forEach(file => {
          formData.append('galleryFiles', file);
        });
      }

      const url = editingProperty 
        ? `${API_URL}/api/admin/properties-for-sale/${editingProperty.id}`
        : `${API_URL}/api/admin/properties-for-sale`;

      const method = editingProperty ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        setPropMsg(editingProperty ? 'Property updated successfully!' : 'Property added successfully!');
        fetchAllData(token);
        setTimeout(() => {
          setIsPropModalOpen(false);
        }, 1200);
      } else {
        setPropMsg(data.message || 'Failed to save property.');
      }
    } catch (err) {
      console.error(err);
      setPropMsg('Server error saving property.');
    } finally {
      setIsSubmittingProp(false);
    }
  };

  const handleOpenAddShowcase = () => {
    setEditingShowcase(null);
    setShowcaseForm({
      title: '',
      location: '',
      category: 'house',
      tag: 'Rohana Completed Build',
      description: '',
      specs: '{\n  "Builder": "Rohana Construction",\n  "Project Status": "100% Completed & Handed Over"\n}',
      imageUrl: '',
      galleryUrls: ''
    });
    setCoverFile(null);
    setGalleryFiles([]);
    setShowcaseMsg('');
    setIsShowcaseModalOpen(true);
  };

  const handleOpenEditShowcase = (proj) => {
    setEditingShowcase(proj);
    setShowcaseForm({
      title: proj.title || '',
      location: proj.location || '',
      category: proj.category || 'house',
      tag: proj.tag || 'Rohana Completed Build',
      description: proj.description || '',
      specs: proj.specs ? JSON.stringify(proj.specs, null, 2) : '',
      imageUrl: proj.image || '',
      galleryUrls: proj.gallery ? JSON.stringify(proj.gallery, null, 2) : ''
    });
    setCoverFile(null);
    setGalleryFiles([]);
    setShowcaseMsg('');
    setIsShowcaseModalOpen(true);
  };

  const handleDeleteShowcase = async (projId) => {
    if (!window.confirm('Are you sure you want to delete this showcase project from the website?')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/showcase-projects/${projId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchAllData(token);
      } else {
        alert('Failed to delete showcase project.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveShowcase = async (e) => {
    e.preventDefault();
    setIsSubmittingShowcase(true);
    setShowcaseMsg('');

    try {
      const formData = new FormData();
      formData.append('title', showcaseForm.title);
      formData.append('location', showcaseForm.location);
      formData.append('category', showcaseForm.category);
      formData.append('tag', showcaseForm.tag);
      formData.append('description', showcaseForm.description);
      formData.append('specs', showcaseForm.specs);
      formData.append('imageUrl', showcaseForm.imageUrl);
      formData.append('galleryUrls', showcaseForm.galleryUrls);

      if (coverFile) {
        formData.append('coverImage', coverFile);
      }
      if (galleryFiles && galleryFiles.length > 0) {
        Array.from(galleryFiles).forEach(file => {
          formData.append('galleryImages', file);
        });
      }

      const url = editingShowcase 
        ? `${API_URL}/api/admin/showcase-projects/${editingShowcase.id}`
        : `${API_URL}/api/admin/showcase-projects`;
      
      const method = editingShowcase ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        setShowcaseMsg('Showcase project saved successfully!');
        fetchAllData(token);
        setTimeout(() => {
          setIsShowcaseModalOpen(false);
        }, 1000);
      } else {
        setShowcaseMsg(data.message || 'Failed to save project');
      }
    } catch (err) {
      setShowcaseMsg('Network error saving project');
    } finally {
      setIsSubmittingShowcase(false);
    }
  };

  const handleDeleteInquiry = async (inqId) => {
    if (!window.confirm('Delete this inquiry?')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/inquiries/${inqId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchAllData(token);
    } catch (err) {
      console.error(err);
    }
  };

  // Direct Contact Helpers
  const handleOpenWhatsApp = (phoneStr) => {
    if (!phoneStr) return alert('No phone number registered for customer.');
    const cleanNumber = phoneStr.replace(/[^0-9]/g, '');
    const formatted = cleanNumber.startsWith('0') ? '94' + cleanNumber.slice(1) : cleanNumber;
    window.open(`https://wa.me/${formatted}?text=Hello,%20this%20is%20Rohana%20Construction%20regarding%20your%20building%20estimate%20request.`, '_blank');
  };

  const handleOpenInAppChat = (userId, username, fullName) => {
    setSelectedChatUser({ id: userId, username, display_name: fullName || username });
    setActiveTab('messages');
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
    fetch(`${API_URL}/api/messages/${targetId}`, {
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
      const res = await fetch(`${API_URL}/api/admin/employees/${empId}/action`, {
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
      const res = await fetch(`${API_URL}/api/admin/estimates/${estId}/action`, {
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

  const handleCustomEstimateUpload = async (estId) => {
    const pdfFile = uploadFiles[estId];
    const planFile = uploadPlanFiles[estId];
    const cost = adjustedCost[estId] || '';
    const weeks = adjustedWeeks[estId] || '';
    const breakdown = adminBreakdowns[estId] || '';

    if (!pdfFile && !planFile && !cost) {
      alert('Please enter cost estimate or select a file to dispatch.');
      return;
    }

    const formData = new FormData();
    if (pdfFile) formData.append('pdfFile', pdfFile);
    if (planFile) formData.append('planFile', planFile);
    if (cost) formData.append('costEstimate', cost);
    if (weeks) formData.append('durationWeeks', weeks);
    if (breakdown) formData.append('adminBreakdown', breakdown);

    try {
      const res = await fetch(`${API_URL}/api/admin/estimates/${estId}/custom-estimate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      alert('Physical Estimate & Architectural Plan successfully sent to client!');
      fetchAllData(token);
    } catch (err) {
      alert('Error uploading estimate: ' + err.message);
    }
  };

  const handleProgressChange = async (projId, progressPercent, status) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/projects/${projId}/progress`, {
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
      await fetch(`${API_URL}/api/admin/projects/${projId}/assign`, {
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
      const res = await fetch(`${API_URL}/api/messages`, {
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
      fetch(`${API_URL}/api/admin/chats`, {
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

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = (emp.full_name || '').toLowerCase().includes(empSearch.toLowerCase()) ||
                          (emp.nic || '').toLowerCase().includes(empSearch.toLowerCase()) ||
                          (emp.phone || '').toLowerCase().includes(empSearch.toLowerCase());
    const matchesCat = empCategoryFilter === 'all' || emp.category === empCategoryFilter;
    const matchesStatus = empStatusFilter === 'all' || emp.status === empStatusFilter;
    return matchesSearch && matchesCat && matchesStatus;
  });

  const filteredEstimates = estimates.filter(est => {
    const matchesSearch = (est.customer_name || '').toLowerCase().includes(estSearch.toLowerCase()) ||
                          (est.service_type || '').toLowerCase().includes(estSearch.toLowerCase()) ||
                          (est.id ? est.id.toString() : '').includes(estSearch);
    const matchesStatus = estStatusFilter === 'all' || est.status === estStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50 pt-20 flex flex-col md:flex-row">
      
      {/* Sidebar navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-white shrink-0 border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="block text-xs uppercase tracking-widest text-amber-500 font-semibold mb-1">Company Console</span>
            <h2 className="font-bold text-lg text-white leading-tight">Administrator</h2>
          </div>
          <div className="flex items-center space-x-2">
            <BackButton variant="subtle" showLabel={false} />
            <button 
              onClick={() => fetchAllData(token)} 
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: 'overview', label: 'Admin Overview', icon: Settings },
            { id: 'estimates', label: 'Estimates & Inquiries', icon: ClipboardList },
            { id: 'employees', label: 'Employees & Approvals', icon: Users },
            { id: 'projects', label: 'Projects & Tasks', icon: UserCheck },
            { id: 'propertiesForSale', label: 'Houses For Sale', icon: HouseIcon },
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
        <div className="mb-6 flex items-center justify-between">
          <BackButton variant="default" />
          {activeTab !== 'overview' && (
            <button 
              onClick={() => setActiveTab('overview')}
              className="text-xs text-amber-600 hover:text-amber-700 font-semibold underline cursor-pointer"
            >
              ← Back to Admin Overview
            </button>
          )}
        </div>
        
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
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-950">Estimates & Direct Service Inquiries</h2>
              <p className="text-slate-500 text-sm">Manage direct customer inquiries and formal estimate requests submitted through the portal and main website.</p>
            </div>

            {/* DIRECT SERVICE INQUIRIES FROM WEBSITE / PORTAL */}
            {inquiries.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <span className="bg-amber-500 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {inquiries.length} Direct Inquiries
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">Direct Customer Inquiries</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {inquiries.map(inq => (
                    <div key={inq.id} className="bg-white p-5 rounded-2xl border border-amber-500/20 shadow-md space-y-3 relative">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-widest bg-amber-500/10 text-amber-600 px-2.5 py-0.5 rounded-full">
                            {inq.service_type}
                          </span>
                          <h4 className="font-extrabold text-slate-900 text-base mt-1">{inq.name}</h4>
                          <span className="text-xs text-slate-500 font-medium block">Phone: <strong className="text-slate-900">{inq.phone}</strong></span>
                        </div>
                        <button
                          onClick={() => handleDeleteInquiry(inq.id)}
                          className="text-slate-400 hover:text-red-500 text-xs p-1 cursor-pointer transition-colors"
                          title="Delete Inquiry"
                        >
                          ✕
                        </button>
                      </div>

                      {inq.location && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
                          📍 <strong>Location:</strong> {inq.location}
                        </p>
                      )}

                      {inq.details && (
                        <p className="text-xs text-slate-700 leading-relaxed font-normal bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
                          {inq.details}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                        <span className="text-slate-400 font-medium">Best Contact Time: {inq.contact_time || 'Anytime'}</span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleOpenWhatsApp(inq.phone)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-xs flex items-center space-x-1"
                          >
                            <span>WhatsApp</span>
                          </button>
                          <a
                            href={`tel:${inq.phone}`}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-xs flex items-center space-x-1"
                          >
                            <span>Call</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Detailed Estimates & Blueprints</h3>
              {estimates.length === 0 ? (
                <p className="text-xs text-slate-400 bg-white p-6 border rounded-2xl">No estimate requests received yet.</p>
              ) : (
                <div className="space-y-6">
                {estimates.map((est) => {
                  let parsedBrands = {};
                  try { parsedBrands = JSON.parse(est.material_brands || '{}'); } catch(e){}

                  return (
                    <div key={est.id} className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
                      {/* Header */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-slate-900 font-extrabold text-base">{est.service_type || 'Residential Construction'}</span>
                            <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                              est.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                              est.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              est.status === 'revision_requested' ? 'bg-purple-100 text-purple-800' :
                              est.status === 'budgeted' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {est.status === 'pending' ? 'Pending Physical Estimation' :
                               est.status === 'budgeted' ? 'Estimate & Plan Sent' :
                               est.status === 'revision_requested' ? 'Client Requested Revision' :
                               est.status === 'approved' ? 'Approved / Active Project' : est.status}
                            </span>
                          </div>
                          <span className="block text-xs text-slate-500 font-medium">Client: <strong>{est.customer_name}</strong> ({est.phone || 'No phone'})</span>
                        </div>

                        {/* Direct Contact Buttons */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleOpenWhatsApp(est.phone)}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center space-x-1 shadow-xs"
                            title="Chat on WhatsApp"
                          >
                            <span>💬 WhatsApp Client</span>
                          </button>
                          <a
                            href={`tel:${est.phone}`}
                            className="bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center space-x-1 shadow-xs"
                            title="Call Phone"
                          >
                            <span>📞 Call</span>
                          </a>
                          <button
                            onClick={() => handleOpenInAppChat(est.customer_id, est.customer_name, est.customer_name)}
                            className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center space-x-1 shadow-xs"
                            title="Send In-App Message"
                          >
                            <span>📩 Inbox</span>
                          </button>
                        </div>
                      </div>

                      {/* Request Specs Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl text-slate-700">
                        <div>
                          <span className="block text-slate-400 font-bold uppercase text-[9px]">Plan Choice</span>
                          <span className="font-bold text-slate-900 capitalize">
                            {est.plan_option === 'upload' ? 'Customer Uploaded Plan' :
                             est.plan_option === 'request_design' ? '✏️ Customer Requested Rohana Plan Design' : 'Template Plan'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-slate-400 font-bold uppercase text-[9px]">Land Size / Area</span>
                          <span className="font-semibold">{est.land_size ? `${est.land_size} Perches` : 'N/A'}</span>
                        </div>
                        <div>
                          <span className="block text-slate-400 font-bold uppercase text-[9px]">Client Target Budget</span>
                          <span className="font-semibold">LKR {est.budget ? est.budget.toLocaleString() : 'N/A'}</span>
                        </div>
                        <div>
                          <span className="block text-slate-400 font-bold uppercase text-[9px]">Preferred Contact Method</span>
                          <span className="font-bold text-amber-600 uppercase">{est.contact_preference || 'WhatsApp'}</span>
                        </div>
                      </div>

                      {/* Brand Preferences Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl text-slate-700">
                        <div>
                          <span className="block text-amber-700 font-bold uppercase text-[9px]">Tile Brand</span>
                          <span className="font-semibold">{parsedBrands.tileBrand || 'Rocell'}</span>
                        </div>
                        <div>
                          <span className="block text-amber-700 font-bold uppercase text-[9px]">Wood Type</span>
                          <span className="font-semibold">{parsedBrands.woodType || 'Teak Wood'}</span>
                        </div>
                        <div>
                          <span className="block text-amber-700 font-bold uppercase text-[9px]">Sanitaryware</span>
                          <span className="font-semibold">{parsedBrands.sanitarywareBrand || 'Rocell'}</span>
                        </div>
                        <div>
                          <span className="block text-amber-700 font-bold uppercase text-[9px]">Paint & Electricals</span>
                          <span className="font-semibold">{parsedBrands.paintBrand || 'Dulux'}</span>
                        </div>
                      </div>

                      {/* Customer Notes */}
                      {est.customer_notes && (
                        <div className="bg-slate-100 p-3 rounded-xl text-xs space-y-1">
                          <span className="text-[9px] text-slate-500 font-bold uppercase block">Customer Special Instructions:</span>
                          <p className="text-slate-800 text-[11px] leading-relaxed">"{est.customer_notes}"</p>
                        </div>
                      )}

                      {/* Customer Revision Feedback */}
                      {est.customer_feedback && (
                        <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl text-xs space-y-1">
                          <span className="text-[9px] text-purple-700 font-bold uppercase tracking-wider block">⚠️ Client Requested Revision Feedback:</span>
                          <p className="text-purple-950 font-bold text-xs leading-relaxed">"{est.customer_feedback}"</p>
                        </div>
                      )}

                      {/* Download Links */}
                      <div className="flex flex-wrap gap-2 text-xs">
                        {(est.client_plan_url || est.plan_file_url) && (
                          <a href={`${API_URL}${est.client_plan_url || est.plan_file_url}`} target="_blank" rel="noreferrer" className="text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-bold text-[11px]">
                            📄 View Customer Land Plan File
                          </a>
                        )}
                        {est.admin_plan_url && (
                          <a href={`${API_URL}${est.admin_plan_url}`} target="_blank" rel="noreferrer" className="text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg font-bold text-[11px]">
                            ✏️ View Rohana Drawn Plan
                          </a>
                        )}
                        {est.admin_pdf_url && (
                          <a href={`${API_URL}${est.admin_pdf_url}`} target="_blank" rel="noreferrer" className="text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg font-bold text-[11px]">
                            📊 View Physical Estimate PDF
                          </a>
                        )}
                      </div>

                      {/* Admin Custom Physical Estimation Dispatch Form */}
                      {(est.status === 'pending' || est.status === 'revision_requested' || est.status === 'budgeted') && (
                        <div className="border-t border-slate-100 pt-4 space-y-4 bg-slate-50/50 p-4 rounded-2xl">
                          <span className="block text-xs font-extrabold uppercase tracking-wider text-amber-600">
                            {est.status === 'revision_requested' ? '🔄 Resend Revised Physical Estimate & Plan' : '✍️ Prepare Physical Cost Estimate & Architectural Plan'}
                          </span>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                            <div>
                              <label className="block text-[10px] text-slate-600 font-bold mb-1 uppercase">Physical Cost (LKR)</label>
                              <input
                                type="number"
                                placeholder={est.cost_estimate || 15000000}
                                value={adjustedCost[est.id] || ''}
                                onChange={(e) => setAdjustedCost({ ...adjustedCost, [est.id]: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-850 focus:outline-none focus:border-amber-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] text-slate-600 font-bold mb-1 uppercase">Timeline (Weeks)</label>
                              <input
                                type="number"
                                placeholder={est.duration_weeks || 16}
                                value={adjustedWeeks[est.id] || ''}
                                onChange={(e) => setAdjustedWeeks({ ...adjustedWeeks, [est.id]: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-850 focus:outline-none focus:border-amber-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] text-slate-600 font-bold mb-1 uppercase">Upload Drawn Plan (PDF/Img)</label>
                              <input
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg"
                                onChange={(e) => setUploadPlanFiles({ ...uploadPlanFiles, [est.id]: e.target.files[0] })}
                                className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 file:cursor-pointer"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] text-slate-600 font-bold mb-1 uppercase">Upload Estimate PDF</label>
                              <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => setUploadFiles({ ...uploadFiles, [est.id]: e.target.files[0] })}
                                className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800 file:cursor-pointer"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] text-slate-600 font-bold mb-1 uppercase">Physical Estimate Breakdown & Finishing Notes</label>
                            <textarea
                              rows={3}
                              value={adminBreakdowns[est.id] || ''}
                              onChange={(e) => setAdminBreakdowns({ ...adminBreakdowns, [est.id]: e.target.value })}
                              placeholder="e.g. Foundation & Concrete: LKR 4.5M, Masonry Walls: LKR 3.2M, Rocell Porcelain Tiling: LKR 2.8M, Teak Doors & Windows: LKR 2.5M, Sanitaryware: LKR 1.2M."
                              className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-850 focus:outline-none focus:border-amber-500"
                            />
                          </div>

                          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
                            <button
                              onClick={() => handleCustomEstimateUpload(est.id)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
                            >
                              <Check className="h-4 w-4" />
                              <span>Dispatch Physical Estimate & Plan</span>
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
                    </div>
                  );
                })}
              </div>
            )}
            </div>
          </div>
        )}

        {/* EMPLOYEES TAB */}
        {activeTab === 'employees' && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-950">Employee Roster</h2>
              <p className="text-slate-500 text-sm">Approve pending construction applications and configure their daily wages.</p>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap gap-3 items-center">
              <input
                type="text"
                placeholder="Search worker by Name, NIC, Phone..."
                value={empSearch}
                onChange={(e) => setEmpSearch(e.target.value)}
                className="flex-1 min-w-[200px] bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
              />
              <select
                value={empCategoryFilter}
                onChange={(e) => setEmpCategoryFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 cursor-pointer"
              >
                <option value="all">All Skill Categories</option>
                <option value="Masonry work">Masonry work</option>
                <option value="Tile">Tile</option>
                <option value="House wiring">House wiring</option>
                <option value="Painting">Painting</option>
                <option value="Roofing">Roofing</option>
                <option value="Carpentry">Carpentry</option>
                <option value="Gardening">Gardening</option>
              </select>
              <select
                value={empStatusFilter}
                onChange={(e) => setEmpStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {filteredEmployees.length === 0 ? (
              <p className="text-xs text-slate-400 bg-white p-6 border rounded-2xl">No workers match your filter/search criteria.</p>
            ) : (
              <div className="space-y-6">
                {filteredEmployees.map((emp) => (
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

        {/* HOUSES & PROPERTIES FOR SALE TAB */}
        {activeTab === 'propertiesForSale' && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-950">Houses & Properties For Sale</h2>
                <p className="text-slate-500 text-sm">Manage turnkey property advertisements and ready-built homes displayed on the public website.</p>
              </div>

              <button
                onClick={handleOpenAddProperty}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-5 py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-amber-500/10 cursor-pointer flex items-center justify-center space-x-2 shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span>Add New Property Listing</span>
              </button>
            </div>

            {propertiesForSale.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center space-y-3 shadow-sm">
                <HouseIcon className="h-10 w-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-600">No property listings created yet.</p>
                <p className="text-xs text-slate-400">Click "Add New Property Listing" to feature a house or land for sale on the public website.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {propertiesForSale.map(prop => (
                  <div key={prop.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between space-y-4 p-5 relative">
                    <div className="space-y-3">
                      <div className="relative h-48 rounded-2xl overflow-hidden bg-slate-900">
                        <img src={prop.image_url} alt={prop.title} className="w-full h-full object-cover" />
                        <div className="absolute top-3 left-3 flex gap-2">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md ${
                            prop.status === 'sold' ? 'bg-red-500 text-white' : prop.status === 'reserved' ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500 text-slate-950'
                          }`}>
                            {prop.status === 'sold' ? 'Sold Out' : prop.status === 'reserved' ? 'Reserved' : 'Available'}
                          </span>
                        </div>
                        <div className="absolute bottom-3 right-3 bg-slate-950/90 text-amber-400 font-extrabold px-3 py-1 rounded-xl text-xs">
                          LKR {Number(prop.price).toLocaleString()}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{prop.location}</span>
                        <h3 className="font-extrabold text-slate-900 text-base leading-snug line-clamp-1">{prop.title}</h3>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{prop.description}</p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[10px] bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-semibold text-slate-700">
                        <div><span className="text-slate-400 block font-normal">Land:</span> {prop.perches} Perches</div>
                        <div><span className="text-slate-400 block font-normal">Beds:</span> {prop.bedrooms} Bedrooms</div>
                        <div><span className="text-slate-400 block font-normal">Baths:</span> {prop.bathrooms} Baths</div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleTogglePropertyStatus(prop, prop.status === 'available' ? 'reserved' : prop.status === 'reserved' ? 'sold' : 'available')}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          Status: <span className="capitalize">{prop.status}</span> ↻
                        </button>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleOpenEditProperty(prop)}
                          className="bg-slate-900 hover:bg-slate-800 text-white p-2 rounded-xl transition-colors cursor-pointer text-xs flex items-center space-x-1"
                          title="Edit Listing"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteProperty(prop.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-xl transition-colors cursor-pointer text-xs"
                          title="Delete Listing"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* ADD / EDIT PROPERTY MODAL */}
      {isPropModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center p-4 md:p-6 overflow-y-auto pt-24 pb-12">
          <div className="bg-white rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl relative border border-slate-100 p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-amber-500 font-extrabold block">Property Listing Manager</span>
                <h3 className="text-xl font-black text-slate-950">
                  {editingProperty ? 'Edit Property Advertisement' : 'Add New Property For Sale'}
                </h3>
              </div>
              <button 
                onClick={() => setIsPropModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-full cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {propMsg && (
              <div className={`p-3 rounded-xl text-xs font-bold ${
                propMsg.includes('successfully') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {propMsg}
              </div>
            )}

            <form onSubmit={handleSaveProperty} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Property Title *</label>
                <input
                  type="text"
                  required
                  value={propertyForm.title}
                  onChange={(e) => setPropertyForm({ ...propertyForm, title: e.target.value })}
                  placeholder="e.g. Modern 2-Story Luxury Residence in Piliyandala"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Location *</label>
                  <input
                    type="text"
                    required
                    value={propertyForm.location}
                    onChange={(e) => setPropertyForm({ ...propertyForm, location: e.target.value })}
                    placeholder="e.g. Piliyandala, Western Province"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Price (LKR) *</label>
                  <input
                    type="number"
                    required
                    value={propertyForm.price}
                    onChange={(e) => setPropertyForm({ ...propertyForm, price: e.target.value })}
                    placeholder="e.g. 34500000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Land (Perches)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={propertyForm.perches}
                    onChange={(e) => setPropertyForm({ ...propertyForm, perches: e.target.value })}
                    placeholder="10.5"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Bedrooms</label>
                  <input
                    type="number"
                    value={propertyForm.bedrooms}
                    onChange={(e) => setPropertyForm({ ...propertyForm, bedrooms: e.target.value })}
                    placeholder="4"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Bathrooms</label>
                  <input
                    type="number"
                    value={propertyForm.bathrooms}
                    onChange={(e) => setPropertyForm({ ...propertyForm, bathrooms: e.target.value })}
                    placeholder="3"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Status</label>
                  <select
                    value={propertyForm.status}
                    onChange={(e) => setPropertyForm({ ...propertyForm, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs text-slate-900 font-bold"
                  >
                    <option value="available">Available / For Sale</option>
                    <option value="reserved">Reserved</option>
                    <option value="sold">Sold Out</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={propertyForm.description}
                  onChange={(e) => setPropertyForm({ ...propertyForm, description: e.target.value })}
                  placeholder="Describe house features, finishes, amenities..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Upload Main Cover Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPropCoverFile(e.target.files[0])}
                    className="w-full text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-2 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Upload Additional Gallery Photos</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setPropGalleryFiles(e.target.files)}
                    className="w-full text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-2 cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsPropModalOpen(false)}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProp}
                  className="w-1/2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
                >
                  {isSubmittingProp ? 'Saving Listing...' : editingProperty ? 'Update Listing' : 'Publish Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
