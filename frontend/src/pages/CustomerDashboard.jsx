import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Home, Calculator, Sparkles, Send, MessageSquare, ClipboardList, CheckCircle, UploadCloud, AlertCircle, Phone, Mail } from 'lucide-react';
import API_URL from '../config';

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);

  // Data states
  const [estimates, setEstimates] = useState([]);
  const [projects, setProjects] = useState([]);
  const [plans, setPlans] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [adminId, setAdminId] = useState(1); // default 1, fetched dynamically
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef(null);

  // Estimator fields
  const [serviceType, setServiceType] = useState('Residential Construction');
  const [serviceDetails, setServiceDetails] = useState({});
  const [landSize, setLandSize] = useState(10);
  const [budget, setBudget] = useState(5000000);
  const [houseType, setHouseType] = useState('single');
  const [bedrooms, setBedrooms] = useState(3);
  const [bathrooms, setBathrooms] = useState(2);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [materialTier, setMaterialTier] = useState('high'); // 'high' or 'medium'
  
  // Custom Plan & Brand preferences
  const [planOption, setPlanOption] = useState('upload'); // 'upload', 'request_design', 'template'
  const [clientPlanUrl, setClientPlanUrl] = useState('');
  const [materialBrands, setMaterialBrands] = useState({
    tileBrand: 'Rocell',
    woodType: 'Teak Wood',
    sanitarywareBrand: 'Rocell',
    paintBrand: 'Dulux',
    electricalBrand: 'Orange Electric'
  });
  const [customerNotes, setCustomerNotes] = useState('');
  const [contactPreference, setContactPreference] = useState('whatsapp');

  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash Payments');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [isPaying, setIsPaying] = useState(false);

  // Revision Modal State
  const [revisionModalEst, setRevisionModalEst] = useState(null);
  const [revisionFeedback, setRevisionFeedback] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Estimation feedback preview
  const [previewCost, setPreviewCost] = useState(0);
  const [previewDuration, setPreviewDuration] = useState(0);

  const ALL_SERVICES = [
    'Residential Construction', 'Electrical Wiring', 'Painting', 'Plumbing',
    'Carpentry', 'Slab Shuttering (Satalin)', 'Tile Work',
    'Commercial Buildings', 'Renovation',
    'House Design', 'Structural Engineering', 'Landscaping'
  ];

  const updateDetail = (key, value) => setServiceDetails(prev => ({ ...prev, [key]: value }));
  const updateBrand = (key, value) => setMaterialBrands(prev => ({ ...prev, [key]: value }));
  const toggleDetailArray = (key, value) => setServiceDetails(prev => {
    const arr = prev[key] || [];
    return { ...prev, [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
  });

  // Chat message input
  const [msgInput, setMsgInput] = useState('');

  // Alerts
  const [estError, setEstError] = useState('');
  const [estSuccess, setEstSuccess] = useState('');
  const [fileMsg, setFileMsg] = useState('');

  useEffect(() => {
    const storedToken = localStorage.getItem('rcms_token');
    const storedUser = localStorage.getItem('rcms_user');
    if (!storedToken || !storedUser) {
      navigate('/login');
      return;
    }

    const u = JSON.parse(storedUser);
    if (u.role !== 'customer') {
      navigate('/');
      return;
    }

    setToken(storedToken);
    setUser(u);

    // Initial data fetch
    fetchData(storedToken);

    // Check if query params select a specific plan
    const requestedPlan = searchParams.get('plan');
    if (requestedPlan) {
      setSelectedPlanId(parseInt(requestedPlan));
      setPlanOption('template');
      setActiveTab('estimator');
    }

    // Check if query params select a specific tab
    const requestedTab = searchParams.get('tab');
    if (requestedTab) {
      setActiveTab(requestedTab);
    }

    // Check if query params pre-select a service type for the estimator
    const requestedService = searchParams.get('service');
    if (requestedService) {
      const decodedSvc = decodeURIComponent(requestedService);
      setServiceType(decodedSvc);
      setServiceDetails({});
      setActiveTab('estimator');
    }
  }, [searchParams]);

  const fetchData = async (authToken) => {
    const headers = { 'Authorization': `Bearer ${authToken}` };
    
    // Fetch estimates
    fetch(`${API_URL}/api/customer/estimates`, { headers })
      .then(res => res.json())
      .then(data => setEstimates(data))
      .catch(err => console.error(err));

    // Fetch projects
    fetch(`${API_URL}/api/customer/projects`, { headers })
      .then(res => res.json())
      .then(data => setProjects(data))
      .catch(err => console.error(err));

    // Fetch house plans
    fetch(`${API_URL}/api/customer/plans`, { headers })
      .then(res => res.json())
      .then(data => setHousePlans(data))
      .catch(err => console.error(err));

    // Fetch admin id for chat
    fetch(`${API_URL}/api/admin/id`, { headers })
      .then(res => res.json())
      .then(data => {
        if (data.adminId) setAdminUserId(data.adminId);
      })
      .catch(err => console.error(err));
  };

  const fetchMessages = async (authToken, targetAdminId) => {
    const id = targetAdminId || adminUserId;
    fetch(`${API_URL}/api/messages/${id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
      .then(res => res.json())
      .then(data => {
        setChatMessages(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error(err));
  };

  // Fetch unread count periodically
  useEffect(() => {
    if (!token) return;
    const fetchUnread = () => {
      fetch(`${API_URL}/api/messages/unread/count`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json()).then(d => setUnreadCount(d.count || 0)).catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 8000);
    return () => clearInterval(interval);
  }, [token]);

  // Keep message pulling active
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      fetchMessages(token, adminUserId);
    }, 5000);
    return () => clearInterval(interval);
  }, [token, adminUserId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Recalculate cost estimator whenever parameters change
  useEffect(() => {
    const sqFt = landSize * 272; // Convert perches to approximate sqft
    const matMult = materialTier === 'ultra_premium' ? 1.35 : materialTier === 'premium' ? 1.15 : 1.0;
    let cost = 0, dur = 4;

    if (serviceType === 'Electrical Wiring' || serviceType === 'Electrical Work') {
      const pts = parseInt(serviceDetails.wiringPoints || 10);
      const phaseAdd = serviceDetails.phaseType === 'Three Phase' ? 150000 : 0;
      cost = (pts * 8500 * matMult) + phaseAdd;
      dur = pts > 30 ? 3 : 1;
    } else if (serviceType === 'Painting') {
      const rate = serviceDetails.puttyCoating === 'Yes' ? 350 : 180;
      cost = (sqFt > 0 ? sqFt : 1000) * rate * matMult;
      dur = Math.round((sqFt > 0 ? sqFt : 1000) / 500) + 1;
    } else if (serviceType === 'Plumbing') {
      const pts = parseInt(serviceDetails.waterPoints || 8);
      const pipeAdd = serviceDetails.pipeMaterial === 'PPR Hot/Cold' ? 40000 : 0;
      cost = (pts * 6500 * matMult) + pipeAdd;
      dur = 2;
    } else if (serviceType === 'Carpentry') {
      const scopeMap = {
        'Solid Teak Main Doors & Windows': 180000,
        'Modular Pantry Cabinets': 250000,
        'Roof Timber Framing': 380000,
        'Decorative Ceiling Woodwork': 120000
      };
      const sc = serviceDetails.carpentryScope || 'Solid Teak Main Doors & Windows';
      cost = (scopeMap[sc] || 180000) * matMult;
      dur = 3;
    } else if (serviceType === 'Slab Shuttering (Satalin)' || serviceType === 'Slab Shuttering') {
      const slabSq = parseFloat(serviceDetails.slabSqFt || 800);
      const levelMult = serviceDetails.slabLevel === '2nd Floor Slab' ? 1.25 : serviceDetails.slabLevel === '1st Floor Slab' ? 1.15 : 1.0;
      cost = slabSq * 520 * levelMult * matMult;
      dur = Math.round(slabSq / 200) + 2;
    } else if (serviceType === 'Tile Work') {
      const tileSq = parseFloat(serviceDetails.tileSqFt || 500);
      const tileTypeMult = serviceDetails.tileType === 'Granite Countertop' ? 2.2 : serviceDetails.tileType === '2x4 ft Large Format Tiles' ? 1.4 : 1.0;
      cost = tileSq * 340 * tileTypeMult * matMult;
      dur = Math.round(tileSq / 250) + 1;
    } else if (serviceType === 'Residential Construction') {
      const hFloor = houseType === 'three' ? 4500000 : houseType === 'two' ? 2200000 : 0;
      const tierMult = materialTier === 'medium' ? 0.88 : 1.15;
      cost = (sqFt * 6500 * matMult * tierMult) + (bedrooms * 200000) + (bathrooms * 150000) + hFloor;
      dur = Math.round(sqFt / 100) + (houseType === 'three' ? 16 : houseType === 'two' ? 12 : 8);
    } else if (serviceType === 'Commercial Buildings') {
      const hFloor = houseType === 'two' ? 2500000 : houseType === 'three' ? 5500000 : 0;
      cost = (sqFt * 8500 * matMult) + hFloor;
      dur = Math.round(sqFt / 120) + 12;
    } else if (serviceType === 'Renovation') {
      const scMap = { 'Kitchen Remodel': 1200000, 'Bathroom Remodel': 450000, 'Room Expansion': 800000, 'Full Office Refit': 2500000 };
      const sc = serviceDetails.renovationScope || 'Kitchen Remodel';
      const ls = parseFloat(landSize || 0);
      cost = (scMap[sc] || 1200000) * matMult * (1 + ls * 0.1);
      dur = sc === 'Full Office Refit' ? 12 : 6;
    } else if (serviceType === 'House Design') {
      const dMap = { '2D Blueprint': 75000, '3D Rendering': 120000, 'Full CAD Layout & 3D Walkthrough': 250000 };
      const dt = serviceDetails.designType || '2D Blueprint';
      cost = (dMap[dt] || 75000) + (landSize > 0 ? landSize * 5000 : 0);
      dur = dt.includes('CAD') ? 4 : 2;
    } else if (serviceType === 'Structural Engineering') {
      const tMap = { 'Soil Boring Test': 150000, 'Concrete Column Stress Test': 95000, 'Structural Load Certification': 180000 };
      cost = tMap[serviceDetails.assessmentType] || 150000;
      dur = 2;
    } else if (serviceType === 'Landscaping') {
      const baseR = serviceDetails.turfType === 'Australian Blue Grass' ? 80000 : 50000;
      cost = (landSize > 0 ? landSize : 5) * baseR;
      if ((serviceDetails.features || []).includes('Concrete Paving Stone')) cost += 150000;
      if ((serviceDetails.features || []).includes('Stone Retaining Wall')) cost += 250000;
      dur = Math.round((landSize > 0 ? landSize : 5) * 0.5) + 1;
    }
    setPreviewCost(Math.round(cost));
    setPreviewDuration(dur);
  }, [serviceType, serviceDetails, landSize, houseType, bedrooms, bathrooms, selectedMaterials, materialTier]);

  const handleMaterialToggle = (material) => {
    setSelectedMaterials(prev => 
      prev.includes(material) 
        ? prev.filter(m => m !== material) 
        : [...prev, material]
    );
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('planFile', file);

    try {
      const res = await fetch(`${API_URL}/api/customer/upload-plan`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      setClientPlanUrl(data.fileUrl);
      setFileMsg('Plan file uploaded successfully!');
    } catch (err) {
      setFileMsg('Upload failed: ' + err.message);
    }
  };

  const handleEstimateReply = async (estId, action, feedbackMsg = '') => {
    setIsSubmittingReply(true);
    try {
      const res = await fetch(`${API_URL}/api/customer/estimates/${estId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action, feedbackMessage: feedbackMsg })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      alert(data.message);
      setRevisionModalEst(null);
      setRevisionFeedback('');
      fetchData(token);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleSubmitEstimate = async (e) => {
    e.preventDefault();
    setEstError('');
    setEstSuccess('');

    if (planOption === 'upload' && !clientPlanUrl) {
      if (!window.confirm("You chose 'Upload My Land Plan' but haven't uploaded a file. Do you want to submit without a plan file?")) {
        return;
      }
    }

    setIsPaying(true);

    // Simulate payment gateway checkout verification (1.5 seconds)
    setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/api/customer/estimates`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            landSize,
            budget,
            houseType,
            bedrooms,
            bathrooms,
            materials: selectedMaterials,
            requestedPlanId: planOption === 'template' ? selectedPlanId : null,
            paymentMethod,
            serviceType,
            serviceDetails: JSON.stringify(serviceDetails),
            planOption,
            clientPlanUrl,
            materialBrands,
            customerNotes,
            contactPreference
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        setEstSuccess(`${serviceType} estimate request submitted! Admin will physically analyze your requirements and dispatch your custom estimate & architectural plan.`);
        fetchData(token);
        setSelectedMaterials([]);
        setSelectedPlanId(null);
        setClientPlanUrl('');
        setCustomerNotes('');
        setServiceDetails({});
        setCardName('');
        setCardNumber('');
        setCardExpiry('');
        setCardCvc('');
      } catch (err) {
        setEstError(err.message);
      } finally {
        setIsPaying(false);
      }
    }, 1200);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!msgInput.trim() || isSending) return;

    const text = msgInput.trim();
    setMsgInput('');
    setIsSending(true);

    try {
      const res = await fetch(`${API_URL}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ receiverId: adminId, content: text })
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setChatMessages(prev => [...prev, data.data]);
      } else {
        fetchMessages(token, adminId);
      }
    } catch (err) {
      console.error(err);
      fetchMessages(token, adminId);
    } finally {
      setIsSending(false);
    }
  };

  const getProgressStepIndex = (status) => {
    const steps = ['foundation', 'walls', 'roofing', 'painting', 'completed'];
    return steps.indexOf(status);
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-20 flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-white shrink-0 border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <span className="block text-xs uppercase tracking-widest text-amber-500 font-semibold mb-1">Customer Area</span>
          <h2 className="font-bold text-lg text-white leading-tight truncate">{user?.full_name || 'Guest User'}</h2>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: 'overview', label: 'Overview Portal', icon: ClipboardList },
            { id: 'progress', label: 'Construction Progress', icon: Home },
            { id: 'estimator', label: 'Build Cost Estimator', icon: Calculator },
            { id: 'messages', label: 'Messages / Contact', icon: MessageSquare }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setEstSuccess('');
                setEstError('');
                if (tab.id === 'messages') {
                  setUnreadCount(0);
                  fetchMessages(token, adminId);
                }
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                activeTab === tab.id 
                  ? 'bg-amber-500 text-slate-950 shadow-md' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <tab.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">{tab.label}</span>
              {tab.id === 'messages' && unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[9px] font-black rounded-full h-4 w-4 flex items-center justify-center shrink-0">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 max-w-5xl">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-950">Welcome Back, {user?.full_name}!</h2>
              <p className="text-slate-500 text-sm">Track your estimates, construction stages, and messages in real time.</p>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                  <span className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Active Projects</span>
                  <span className="block text-2xl font-black text-slate-900">{projects.length}</span>
                </div>
                <div className="bg-amber-500/10 p-3 rounded-xl text-amber-600">
                  <Home className="h-6 w-6" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                  <span className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Quotation Estimates</span>
                  <span className="block text-2xl font-black text-slate-900">{estimates.length}</span>
                </div>
                <div className="bg-amber-500/10 p-3 rounded-xl text-amber-600">
                  <Calculator className="h-6 w-6" />
                </div>
              </div>
            </div>

            {/* Estimates list */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 shadow-sm">
              <h3 className="font-extrabold text-slate-900 text-base">Your Estimate Inquiries & Requests</h3>
              {estimates.length === 0 ? (
                <p className="text-xs text-slate-400">You haven't requested any estimates yet. Go to the Estimator tab to calculate.</p>
              ) : (
                <div className="space-y-4">
                  {estimates.map((est) => {
                    let parsedBrands = {};
                    try { parsedBrands = JSON.parse(est.material_brands || '{}'); } catch(e){}

                    return (
                      <div key={est.id} className="border border-slate-100 rounded-2xl p-5 hover:bg-slate-50 transition-colors space-y-3">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-extrabold text-slate-900 text-sm">{est.service_type || 'Residential Construction'}</span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                est.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                                est.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                est.status === 'revision_requested' ? 'bg-purple-100 text-purple-800' :
                                est.status === 'budgeted' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {est.status === 'pending' ? 'Pending Physical Estimate' :
                                 est.status === 'budgeted' ? 'Estimate & Plan Ready' :
                                 est.status === 'revision_requested' ? 'Revision Requested' :
                                 est.status === 'approved' ? 'Approved / Active Project' : est.status}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              Plan Choice: <strong className="text-slate-700 capitalize">{est.plan_option === 'upload' ? 'Customer Uploaded Plan' : est.plan_option === 'request_design' ? 'Requested Rohana Plan Design' : 'Template Plan'}</strong>
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="block text-[10px] text-slate-400 font-bold uppercase">Estimated Cost</span>
                            <span className="text-sm font-black text-slate-900">
                              LKR {est.cost_estimate ? est.cost_estimate.toLocaleString() : 'Calculating...'}
                            </span>
                            {est.duration_weeks && <span className="text-[10px] text-amber-600 font-bold block">{est.duration_weeks} Weeks Build Time</span>}
                          </div>
                        </div>

                        {/* Customer preferences details */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-slate-600 bg-slate-50/80 p-3 rounded-xl">
                          <div><span className="text-slate-400 text-[9px] font-bold uppercase block">Land Size:</span> {est.land_size ? `${est.land_size} Perches` : 'N/A'}</div>
                          <div><span className="text-slate-400 text-[9px] font-bold uppercase block">Target Budget:</span> LKR {est.budget ? est.budget.toLocaleString() : 'N/A'}</div>
                          <div><span className="text-slate-400 text-[9px] font-bold uppercase block">Tile Brand:</span> {parsedBrands.tileBrand || 'Rocell'}</div>
                          <div><span className="text-slate-400 text-[9px] font-bold uppercase block">Wood Type:</span> {parsedBrands.woodType || 'Teak Wood'}</div>
                        </div>

                        {/* Documents & Admin feedback notes */}
                        {est.admin_breakdown && (
                          <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-xs space-y-1">
                            <span className="text-[9px] text-amber-700 font-bold uppercase tracking-wider block">Admin Physical Estimate Breakdown:</span>
                            <p className="text-slate-800 text-[11px] leading-relaxed whitespace-pre-line">{est.admin_breakdown}</p>
                          </div>
                        )}

                        {est.customer_feedback && (
                          <div className="bg-purple-50 border border-purple-100 p-3 rounded-xl text-xs space-y-1">
                            <span className="text-[9px] text-purple-700 font-bold uppercase tracking-wider block">Your Feedback / Revision Notes:</span>
                            <p className="text-purple-900 text-[11px] italic">"{est.customer_feedback}"</p>
                          </div>
                        )}

                        {/* Download Links & Actions */}
                        <div className="flex flex-wrap items-center justify-between pt-2 gap-2 border-t border-slate-100 text-xs">
                          <div className="flex flex-wrap gap-2 items-center">
                            {est.client_plan_url && (
                              <a href={`${API_URL}${est.client_plan_url}`} target="_blank" rel="noreferrer" className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-2.5 py-1 rounded text-[10px] flex items-center space-x-1">
                                <span>📄 My Uploaded Plan</span>
                              </a>
                            )}
                            {est.admin_plan_url && (
                              <a href={`${API_URL}${est.admin_plan_url}`} target="_blank" rel="noreferrer" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2.5 py-1 rounded text-[10px] flex items-center space-x-1">
                                <span>✏️ Rohana Drawn Plan PDF</span>
                              </a>
                            )}
                            {est.admin_pdf_url && (
                              <a href={`${API_URL}${est.admin_pdf_url}`} target="_blank" rel="noreferrer" className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-2.5 py-1 rounded text-[10px] flex items-center space-x-1">
                                <span>📊 Physical Estimate PDF</span>
                              </a>
                            )}
                          </div>

                          {/* Approval / Revision Action Buttons */}
                          {(est.status === 'budgeted' || est.status === 'revision_requested') && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEstimateReply(est.id, 'accept', 'Satisfied with physical budget')}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-sm"
                              >
                                Accept & Start Construction
                              </button>
                              <button
                                onClick={() => { setRevisionModalEst(est); setRevisionFeedback(est.customer_feedback || ''); }}
                                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-sm"
                              >
                                Request Budget Revision
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Revision Feedback Modal */}
            {revisionModalEst && (
              <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-100">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-slate-900 text-base">Request Budget Revision</h3>
                    <button onClick={() => setRevisionModalEst(null)} className="text-slate-400 hover:text-slate-600">✕</button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Specify how you'd like Admin to revise your physical estimate (e.g. changing tile brands, reducing floor count, adjusting fittings quality).
                  </p>
                  <textarea
                    rows={4}
                    value={revisionFeedback}
                    onChange={(e) => setRevisionFeedback(e.target.value)}
                    placeholder="e.g. Can we change tile brand to Rocell Standard and reduce total cost to LKR 14,000,000?"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex justify-end space-x-2 pt-2">
                    <button onClick={() => setRevisionModalEst(null)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                    <button
                      onClick={() => handleEstimateReply(revisionModalEst.id, 'request_revision', revisionFeedback)}
                      disabled={isSubmittingReply || !revisionFeedback.trim()}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isSubmittingReply ? 'Sending...' : 'Send Revision Feedback'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PROJECTS & PROGRESS TAB */}
        {activeTab === 'progress' && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-950">Live Construction Progress</h2>
              <p className="text-slate-500 text-sm">Monitor what stage your project is at. Updated instantly by site supervisors.</p>
            </div>

            {projects.length === 0 ? (
              <div className="bg-white border border-slate-100 p-8 rounded-2xl shadow-sm text-center space-y-4">
                <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  You don't have any active construction projects. Create a build cost estimate and get it approved to launch the project.
                </p>
              </div>
            ) : (
              projects.map(proj => {
                const currentStepIdx = getProgressStepIndex(proj.status);
                const stepsList = [
                  { label: 'Foundation', statusName: 'foundation' },
                  { label: 'Walls Construction', statusName: 'walls' },
                  { label: 'Roof Setup', statusName: 'roofing' },
                  { label: 'Painting Work', statusName: 'painting' },
                  { label: 'Completed', statusName: 'completed' }
                ];

                return (
                  <div key={proj.id} className="bg-white border border-slate-100 p-6 md:p-8 rounded-2xl shadow-sm space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-4">
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-lg">{proj.name}</h3>
                        <span className="text-xs text-slate-400">Location: {proj.location} | Cost: LKR {proj.estimate_cost.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-400 font-bold uppercase">Overall Completion</span>
                        <span className="text-sm font-black text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded">
                          {proj.progress_percent}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar Graphic */}
                    <div className="w-full bg-slate-100 rounded-full h-3.5 mb-6 overflow-hidden">
                      <div 
                        className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${proj.progress_percent}%` }}
                      ></div>
                    </div>

                    {/* Stepper Graphic */}
                    <div className="grid grid-cols-5 text-center gap-2">
                      {stepsList.map((step, idx) => {
                        const isDone = idx <= currentStepIdx;
                        const isCurrent = idx === currentStepIdx;
                        return (
                          <div key={idx} className="space-y-2">
                            <div className="flex justify-center">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                isCurrent ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-500/20' :
                                isDone ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                              }`}>
                                {isDone && !isCurrent ? <CheckCircle className="h-4 w-4" /> : idx + 1}
                              </div>
                            </div>
                            <span className={`block text-[9px] md:text-xs font-semibold ${
                              isCurrent ? 'text-amber-500 font-bold' :
                              isDone ? 'text-slate-700' : 'text-slate-400'
                            }`}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ESTIMATOR TAB */}
        {activeTab === 'estimator' && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-2xl text-white shadow-xl border border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="bg-amber-500 text-slate-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Direct Company Contact
                  </span>
                  <span className="text-slate-400 text-xs font-semibold">Need urgent help or direct work?</span>
                </div>
                <h2 className="text-xl md:text-2xl font-black">Direct Service Booking & Estimator</h2>
                <p className="text-xs text-slate-300">Contact our site engineers directly for Electrical Wiring, Painting, Plumbing, Carpentry, Slab Shuttering & Tile Work.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="tel:+94769117398"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Phone className="h-4 w-4" />
                  <span>Call 076 911 73 98</span>
                </a>
                <a
                  href={`https://wa.me/94769117398?text=${encodeURIComponent(`Hello Rohana Construction, I am in customer portal looking for ${serviceType} service.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>WhatsApp Inquiry</span>
                </a>
                <button
                  onClick={() => setActiveTab('messages')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <span>Chat With Engineer</span>
                </button>
              </div>
            </div>

            {/* Service Type Selector Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {ALL_SERVICES.map(svc => (
                <button
                  key={svc}
                  type="button"
                  onClick={() => { setServiceType(svc); setServiceDetails({}); }}
                  className={`p-3 rounded-xl border text-[10px] md:text-xs font-bold text-center transition-all cursor-pointer leading-tight ${
                    serviceType === svc
                      ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-amber-400 hover:text-amber-600'
                  }`}
                >
                  {svc}
                </button>
              ))}
            </div>

            {estSuccess && (
              <div className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 p-4 rounded-xl text-xs font-bold">
                {estSuccess}
              </div>
            )}

            {estError && (
              <div className="bg-red-500/10 text-red-500 border border-red-500/20 p-4 rounded-xl text-xs font-bold">
                {estError}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form Input fields */}
              <form onSubmit={handleSubmitEstimate} className="lg:col-span-2 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-6">

                {/* Service type banner */}
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
                  <span className="block text-[10px] text-amber-600 uppercase font-bold tracking-wider mb-1">Selected Service</span>
                  <span className="text-base font-extrabold text-slate-900">{serviceType}</span>
                </div>

                {/* STEP 1: ARCHITECTURAL PLAN OPTIONS */}
                <div className="space-y-3">
                  <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider">1. Architectural Land Plan Option</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setPlanOption('upload')}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
                        planOption === 'upload'
                          ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="block text-xs font-bold text-slate-900">📄 Upload My Land Plan</span>
                      <span className="block text-[10px] text-slate-500">I have my land plan drawing & want physical estimation.</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPlanOption('request_design')}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
                        planOption === 'request_design'
                          ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="block text-xs font-bold text-slate-900">✏️ Request Plan Design</span>
                      <span className="block text-[10px] text-slate-500">I don't have a plan — Rohana team will draw & estimate.</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPlanOption('template')}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
                        planOption === 'template'
                          ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="block text-xs font-bold text-slate-900">🏛️ Pick Template Plan</span>
                      <span className="block text-[10px] text-slate-500">Select one of Rohana's pre-designed house plans.</span>
                    </button>
                  </div>
                </div>

                {/* Plan Upload Field if planOption === 'upload' */}
                {planOption === 'upload' && (
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase">Upload Your Land Plan Drawing (PDF / Image)</label>
                    <div className="flex items-center space-x-3">
                      <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileUpload} className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800 file:cursor-pointer" />
                      {clientPlanUrl && <span className="text-[10px] text-emerald-600 font-bold">✔ Uploaded</span>}
                    </div>
                    {fileMsg && <span className="block text-[10px] text-emerald-600 font-bold">{fileMsg}</span>}
                  </div>
                )}

                {/* Template Selection if planOption === 'template' */}
                {planOption === 'template' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Select House Plan Template</label>
                    <select
                      value={selectedPlanId || ''}
                      onChange={e => setSelectedPlanId(e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-slate-800 cursor-pointer"
                    >
                      <option value="">-- Choose a Pre-drawn House Plan --</option>
                      {plans.map(p => (
                        <option key={p.id} value={p.id}>{p.title} ({p.bedrooms} Beds, {p.bathrooms} Baths, {p.floors} Floors) — ~LKR {p.price_estimate?.toLocaleString()}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* ====================== RESIDENTIAL CONSTRUCTION FIELDS ====================== */}
                {serviceType === 'Residential Construction' && (
                  <>
                    <div className="bg-amber-50 border border-amber-200/70 p-4 rounded-xl space-y-1">
                      <span className="block text-[10px] font-extrabold text-amber-800 uppercase tracking-wider">⭐ Flagship Core Service (නිවාස ඉදිකිරීම්)</span>
                      <p className="text-[11px] text-amber-950 leading-relaxed">
                        Upload your existing House Plan blueprint to receive an official detailed cost estimate from our structural engineers (a small processing payment applies for official estimate drafting).
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Material Quality Grade (High vs Medium Quality)</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setMaterialTier('high')}
                          className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all space-y-1 ${
                            materialTier === 'high'
                              ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20'
                              : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <span className="block text-xs font-bold text-slate-900">⭐ High Quality (Premium Build)</span>
                          <span className="block text-[10px] text-slate-500 leading-normal">Seasoned Teak Wood (experienced wood craftsmen), Rocell/Lanka Tiles, Concealed Wiring, Rocell/American Standard Bathware, Dulux Paint & Quality Tile Roofing.</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setMaterialTier('medium')}
                          className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all space-y-1 ${
                            materialTier === 'medium'
                              ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20'
                              : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <span className="block text-xs font-bold text-slate-900">🏷️ Medium Quality (Standard Build)</span>
                          <span className="block text-[10px] text-slate-500 leading-normal">Selected material items adjusted to optimize overall cost while preserving 100% structural build strength & durability.</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Land Size (Perches)</label>
                      <input type="number" required value={landSize} step="0.1" onChange={e => setLandSize(parseFloat(e.target.value)||0)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-slate-800" placeholder="e.g. 10" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">House Type (Stories)</label>
                      <select value={houseType} onChange={e => setHouseType(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-slate-800 cursor-pointer">
                        <option value="single">Single Story House</option>
                        <option value="two">Two-Story Residence</option>
                        <option value="three">Three-Story Luxury Residence</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Bedrooms</label>
                        <input type="number" required value={bedrooms} min={1} onChange={e => setBedrooms(parseInt(e.target.value)||1)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-slate-800" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Bathrooms</label>
                        <input type="number" required value={bathrooms} min={1} onChange={e => setBathrooms(parseInt(e.target.value)||1)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-slate-800" />
                      </div>
                    </div>
                  </>
                )}

                {/* ====================== COMMERCIAL BUILDINGS FIELDS ====================== */}
                {serviceType === 'Commercial Buildings' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Plot Size (Perches)</label>
                      <input type="number" required value={landSize} step="0.1" onChange={e => setLandSize(parseFloat(e.target.value)||0)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-slate-800" placeholder="e.g. 40" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Number of Floors</label>
                      <select value={houseType} onChange={e => setHouseType(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-slate-800 cursor-pointer">
                        <option value="single">Single Floor</option>
                        <option value="two">2 Floors</option>
                        <option value="three">3+ Floors</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Building Purpose</label>
                      <select value={serviceDetails.buildingPurpose||'Office'} onChange={e => updateDetail('buildingPurpose', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-slate-800 cursor-pointer">
                        <option>Office</option>
                        <option>Retail / Shop</option>
                        <option>Hotel / Guesthouse</option>
                        <option>Warehouse</option>
                        <option>Hospital / Clinic</option>
                      </select>
                    </div>
                  </>
                )}

                {/* ====================== RENOVATION FIELDS ====================== */}
                {serviceType === 'Renovation' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Renovation Scope</label>
                      <select value={serviceDetails.renovationScope||'Kitchen Remodel'} onChange={e => updateDetail('renovationScope', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-slate-800 cursor-pointer">
                        <option>Kitchen Remodel</option>
                        <option>Bathroom Remodel</option>
                        <option>Room Expansion</option>
                        <option>Full Office Refit</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Property Size (Perches)</label>
                      <input type="number" required value={landSize} step="0.1" onChange={e => setLandSize(parseFloat(e.target.value)||0)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-slate-800" placeholder="e.g. 8" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Existing Structure Age (Years)</label>
                      <input type="number" value={serviceDetails.structureAge||0} min={0} onChange={e => updateDetail('structureAge', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-slate-800" />
                    </div>
                  </>
                )}

                {/* ====================== HOUSE DESIGN FIELDS ====================== */}
                {serviceType === 'House Design' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Design Package</label>
                      <select value={serviceDetails.designType||'2D Blueprint'} onChange={e => updateDetail('designType', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-slate-800 cursor-pointer">
                        <option>2D Blueprint</option>
                        <option>3D Rendering</option>
                        <option>Full CAD Layout & 3D Walkthrough</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Land Size (Perches)</label>
                      <input type="number" required value={landSize} step="0.1" onChange={e => setLandSize(parseFloat(e.target.value)||0)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-slate-800" placeholder="e.g. 12" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">House Style Preference</label>
                      <select value={serviceDetails.houseStyle||'Modern'} onChange={e => updateDetail('houseStyle', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-slate-800 cursor-pointer">
                        <option>Modern</option>
                        <option>Colonial</option>
                        <option>Tropical / Open-plan</option>
                        <option>Minimalist</option>
                        <option>Traditional Sri Lankan</option>
                      </select>
                    </div>
                  </>
                )}

                {/* ====================== STRUCTURAL ENGINEERING FIELDS ====================== */}
                {serviceType === 'Structural Engineering' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Assessment Type</label>
                      <select value={serviceDetails.assessmentType||'Soil Boring Test'} onChange={e => updateDetail('assessmentType', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-slate-800 cursor-pointer">
                        <option>Soil Boring Test</option>
                        <option>Concrete Column Stress Test</option>
                        <option>Structural Load Certification</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Project Location / Site Address</label>
                      <input type="text" value={serviceDetails.siteAddress||''} onChange={e => updateDetail('siteAddress', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-slate-800" placeholder="e.g. Galle Road, Colombo 3" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Urgency</label>
                      <select value={serviceDetails.urgency||'Standard (2-3 weeks)'} onChange={e => updateDetail('urgency', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-slate-800 cursor-pointer">
                        <option>Standard (2-3 weeks)</option>
                        <option>Urgent (Within 1 week)</option>
                      </select>
                    </div>
                  </>
                )}

                {/* ====================== ELECTRICAL WORK FIELDS ====================== */}
                {serviceType === 'Electrical Work' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Number of Wiring Points</label>
                      <input type="number" required value={serviceDetails.wiringPoints||10} min={1}
                        onChange={e => updateDetail('wiringPoints', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-slate-800" placeholder="e.g. 25" />
                      <p className="text-[10px] text-slate-400 mt-1">Each wiring point = 1 socket, switch, or light fitting</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Phase Type</label>
                      <select value={serviceDetails.phaseType||'Single Phase'} onChange={e => updateDetail('phaseType', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-slate-800 cursor-pointer">
                        <option>Single Phase</option>
                        <option>Three Phase</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">CEB Compliance Inspection Required?</label>
                      <select value={serviceDetails.cebInspection||'No'} onChange={e => updateDetail('cebInspection', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-slate-800 cursor-pointer">
                        <option>No</option>
                        <option>Yes</option>
                      </select>
                    </div>
                  </>
                )}

                {/* ====================== PLUMBING FIELDS ====================== */}
                {serviceType === 'Plumbing' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Number of Water Points</label>
                      <input type="number" required value={serviceDetails.waterPoints||8} min={1}
                        onChange={e => updateDetail('waterPoints', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-slate-800" placeholder="e.g. 10" />
                      <p className="text-[10px] text-slate-400 mt-1">Each water point = 1 tap, shower, or drainage connection</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Pipe Material</label>
                      <select value={serviceDetails.pipeMaterial||'Standard PVC'} onChange={e => updateDetail('pipeMaterial', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-slate-800 cursor-pointer">
                        <option>Standard PVC</option>
                        <option>PPR Hot/Cold</option>
                        <option>CPVC Premium</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Includes Underground Drainage?</label>
                      <select value={serviceDetails.drainage||'No'} onChange={e => updateDetail('drainage', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-slate-800 cursor-pointer">
                        <option>No</option>
                        <option>Yes</option>
                      </select>
                    </div>
                  </>
                )}

                {/* ====================== PAINTING FIELDS ====================== */}
                {serviceType === 'Painting' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Total Wall Area (Perches equivalent)</label>
                      <input type="number" required value={landSize} step="0.1" onChange={e => setLandSize(parseFloat(e.target.value)||0)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-slate-800" placeholder="e.g. 6" />
                      <p className="text-[10px] text-slate-400 mt-1">Enter your wall area in perch equivalents (1 perch = 272 sq ft)</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Putty Coating Required?</label>
                      <select value={serviceDetails.puttyCoating||'No'} onChange={e => updateDetail('puttyCoating', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-slate-800 cursor-pointer">
                        <option>No</option>
                        <option>Yes</option>
                      </select>
                    </div>
                  </>
                )}

                {/* ====================== LANDSCAPING FIELDS ====================== */}
                {serviceType === 'Landscaping' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Garden / Land Size (Perches)</label>
                      <input type="number" required value={landSize} step="0.1" onChange={e => setLandSize(parseFloat(e.target.value)||0)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-slate-800" placeholder="e.g. 15" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Turf / Grass Type</label>
                      <select value={serviceDetails.turfType||'Standard Lawn Grass'} onChange={e => updateDetail('turfType', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-slate-800 cursor-pointer">
                        <option>Standard Lawn Grass</option>
                        <option>Australian Blue Grass</option>
                        <option>Carpet Grass</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Additional Features</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Concrete Paving Stone', 'Stone Retaining Wall', 'Garden Lighting', 'Water Feature / Pond'].map(feat => (
                          <button key={feat} type="button"
                            onClick={() => toggleDetailArray('features', feat)}
                            className={`py-2 px-3 border rounded-lg text-[10px] font-bold transition-all cursor-pointer text-left ${
                              (serviceDetails.features||[]).includes(feat)
                                ? 'bg-amber-500/10 border-amber-500 text-amber-600'
                                : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}>{feat}</button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* ====================== CARPENTRY FIELDS ====================== */}
                {serviceType === 'Carpentry' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Primary Carpentry Work Scope</label>
                      <select value={serviceDetails.carpentryScope||'Solid Teak Main Doors & Windows'} onChange={e => updateDetail('carpentryScope', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-slate-800 cursor-pointer">
                        <option>Solid Teak Main Doors & Windows</option>
                        <option>Modular Pantry Cabinets</option>
                        <option>Roof Timber Framing</option>
                        <option>Decorative Ceiling Woodwork</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Timber Wood Material</label>
                      <select value={serviceDetails.timberType||'Seasoned Teak Wood'} onChange={e => updateDetail('timberType', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-slate-800 cursor-pointer">
                        <option>Seasoned Teak Wood</option>
                        <option>Mahogany Wood</option>
                        <option>Kempas Hardwood</option>
                        <option>Mahogany Plywood Board</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Site Location / Address</label>
                      <input type="text" value={serviceDetails.siteAddress||''} onChange={e => updateDetail('siteAddress', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-slate-800" placeholder="e.g. Maharagama, Colombo" />
                    </div>
                  </>
                )}

                {/* ====================== SLAB SHUTTERING (SATALIN) FIELDS ====================== */}
                {(serviceType === 'Slab Shuttering (Satalin)' || serviceType === 'Slab Shuttering') && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Slab Area (Square Feet)</label>
                      <input type="number" required value={serviceDetails.slabSqFt||800} min={100} step={50}
                        onChange={e => updateDetail('slabSqFt', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-slate-800" placeholder="e.g. 1200" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Slab Level</label>
                      <select value={serviceDetails.slabLevel||'1st Floor Slab'} onChange={e => updateDetail('slabLevel', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-slate-800 cursor-pointer">
                        <option>Ground Floor Slab</option>
                        <option>1st Floor Slab</option>
                        <option>2nd Floor Slab</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Formwork Material</label>
                      <select value={serviceDetails.shutteringMat||'Heavy Marine Plywood'} onChange={e => updateDetail('shutteringMat', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-slate-800 cursor-pointer">
                        <option>Heavy Marine Plywood</option>
                        <option>Steel Formwork Props</option>
                      </select>
                    </div>
                  </>
                )}

                {/* ====================== TILE WORK FIELDS ====================== */}
                {serviceType === 'Tile Work' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Total Tiling Area (Square Feet)</label>
                      <input type="number" required value={serviceDetails.tileSqFt||500} min={50} step={25}
                        onChange={e => updateDetail('tileSqFt', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-slate-800" placeholder="e.g. 850" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Tile Type & Format</label>
                      <select value={serviceDetails.tileType||'2x2 ft Porcelain Tiles'} onChange={e => updateDetail('tileType', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-slate-800 cursor-pointer">
                        <option>2x2 ft Porcelain Tiles</option>
                        <option>2x4 ft Large Format Tiles</option>
                        <option>Anti-Slip Porch & Outdoor Tiles</option>
                        <option>Granite Countertop</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Surface Location</label>
                      <select value={serviceDetails.surfaceLoc||'Living & Bedroom Floor'} onChange={e => updateDetail('surfaceLoc', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-slate-800 cursor-pointer">
                        <option>Living & Bedroom Floor</option>
                        <option>Bathroom Walls & Floor</option>
                        <option>Kitchen Countertop & Splashback</option>
                        <option>Car Porch & Verandah</option>
                      </select>
                    </div>
                  </>
                )}

                {/* STEP 2: MATERIAL BRANDS & SPECIFICATION PREFERENCES */}
                <div className="border-t border-slate-100 pt-6 space-y-4">
                  <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider">2. Material Brands & Specifications</label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Tile Brand / Finish</label>
                      <select value={materialBrands.tileBrand} onChange={e => updateBrand('tileBrand', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-amber-500">
                        <option>Rocell Luxury Porcelain</option>
                        <option>Lanka Tiles Standard</option>
                        <option>Imported Large Format Tiles</option>
                        <option>Terrazzo / Granito Finish</option>
                        <option>Non-Slip Outdoor Tiles</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Wood Species (Doors & Windows)</label>
                      <select value={materialBrands.woodType} onChange={e => updateBrand('woodType', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-amber-500">
                        <option>Teak Wood (Senior Grade)</option>
                        <option>Mahogany Hardwood</option>
                        <option>Jak Wood</option>
                        <option>Nadun / Kumbuk</option>
                        <option>Treated Timber Frame</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Sanitaryware & Fittings</label>
                      <select value={materialBrands.sanitarywareBrand} onChange={e => updateBrand('sanitarywareBrand', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-amber-500">
                        <option>Rocell Premium Fittings</option>
                        <option>American Standard</option>
                        <option>Kohler Luxury Line</option>
                        <option>Cotto Sanitaryware</option>
                        <option>Grohe German Brassware</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Paint & Electricals</label>
                      <select value={materialBrands.paintBrand} onChange={e => updateBrand('paintBrand', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-amber-500">
                        <option>Dulux Paint + Orange Electric</option>
                        <option>Nippon Paint + ACL Cables</option>
                        <option>Jotun WeatherShield + Clipsal</option>
                        <option>Eco Weather Paint + Siemens</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* STEP 3: CONTACT METHOD & SPECIAL INSTRUCTIONS */}
                <div className="border-t border-slate-100 pt-6 space-y-4">
                  <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider">3. Direct Contact & Instructions</label>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-2">How should Admin contact you for physical details?</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'whatsapp', label: '💬 WhatsApp' },
                        { id: 'phone', label: '📞 Direct Call' },
                        { id: 'in_app', label: '📩 In-App Inbox' }
                      ].map(method => (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setContactPreference(method.id)}
                          className={`py-2 px-3 border rounded-xl text-xs font-bold cursor-pointer transition-all ${
                            contactPreference === method.id
                              ? 'bg-amber-500/10 border-amber-500 text-amber-600'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {method.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Special Requirements / Notes for Engineers</label>
                    <textarea
                      rows={3}
                      value={customerNotes}
                      onChange={e => setCustomerNotes(e.target.value)}
                      placeholder="e.g. Please include rooftop terrace framing, double garage layout, and custom mahogany pantry cabinets."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* ===== SHARED FIELDS (Budget + Payment) ===== */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Target Budget (LKR)</label>
                    <input type="number" required value={budget} onChange={e => setBudget(parseInt(e.target.value)||0)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-slate-800" placeholder="e.g. 15000000" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Preferred Payment Method</label>
                    <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-slate-800 cursor-pointer">
                      <option value="Cash Payments">Cash Payments</option>
                      <option value="Bank Installment Loans">Bank Installment Loans</option>
                      <option value="Phase-by-Phase Milestones">Phase-by-Phase Milestones</option>
                    </select>
                  </div>
                </div>

                {['Residential Construction', 'Commercial Buildings', 'Renovation'].includes(serviceType) && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Building Materials Quality</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['Premium Wood', 'Luxury Tiles', 'High-grade Electricals', 'Eco Paint'].map(material => (
                        <button type="button" key={material} onClick={() => handleMaterialToggle(material)}
                          className={`py-2 px-3 border rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            selectedMaterials.includes(material)
                              ? 'bg-amber-500/10 border-amber-500 text-amber-500'
                              : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                          }`}>{material}</button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Upload Reference File (Optional)</label>
                  <div className="flex items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-6 hover:border-amber-500 transition-colors">
                    <label className="flex flex-col items-center space-y-2 cursor-pointer">
                      <UploadCloud className="h-8 w-8 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-600">Choose PDF / AutoCAD / Photo</span>
                      <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                  {fileMsg && <span className="block text-[10px] text-emerald-600 font-bold mt-2">{fileMsg}</span>}
                </div>

                {/* Credit Card Checkout */}
                <div className="bg-slate-900 border border-slate-800 text-white p-5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-xs font-black uppercase text-amber-500 tracking-wider">Estimate Processing Fee</span>
                    <span className="text-sm font-black text-emerald-400">LKR 1,500</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Cardholder Name</label>
                      <input type="text" required placeholder="Kamal Silva" value={cardName} onChange={e => setCardName(e.target.value)}
                        className="w-full bg-slate-850 border border-slate-750 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Card Number</label>
                      <input type="text" required placeholder="4111 2222 3333 4444" value={cardNumber}
                        onChange={e => setCardNumber(e.target.value.replace(/\s?/g,'').replace(/(\d{4})/g,'$1 ').trim())} maxLength={19}
                        className="w-full bg-slate-850 border border-slate-750 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Expiry Date</label>
                        <input type="text" required placeholder="MM/YY" value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} maxLength={5}
                          className="w-full bg-slate-850 border border-slate-750 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">CVC Code</label>
                        <input type="password" required placeholder="123" value={cardCvc} onChange={e => setCardCvc(e.target.value)} maxLength={3}
                          className="w-full bg-slate-850 border border-slate-750 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500" />
                      </div>
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={isPaying}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3.5 rounded-xl transition-all shadow-md shadow-amber-500/10 cursor-pointer text-sm flex items-center justify-center space-x-2 disabled:opacity-50">
                  {isPaying ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-950 border-t-transparent" />
                      <span>Processing Payment of LKR 1,500...</span>
                    </>
                  ) : (
                    <span>Submit {serviceType} Estimate & Pay LKR 1,500</span>
                  )}
                </button>
              </form>

              {/* Live Pricing Preview Panel */}
              <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-sm h-fit space-y-6">
                <div className="flex items-center space-x-2 text-amber-500">
                  <Sparkles className="h-5 w-5" />
                  <h3 className="font-extrabold text-sm uppercase tracking-wider">Live Pricing Preview</h3>
                </div>
                <div className="bg-amber-500/10 rounded-xl px-3 py-2">
                  <span className="block text-[9px] text-amber-400 uppercase font-bold tracking-wider">Service</span>
                  <span className="block text-xs font-bold text-white">{serviceType}</span>
                </div>

                <div className="space-y-3 border-b border-slate-700 pb-4 text-xs">
                  {['Residential Construction', 'Commercial Buildings', 'Painting', 'Landscaping'].includes(serviceType) && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Land / Area</span>
                        <span className="font-bold">{landSize} Perches</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Equivalent</span>
                        <span className="font-bold">{Math.round(landSize * 272.25)} sq ft</span>
                      </div>
                    </>
                  )}
                  {serviceType === 'Residential Construction' && (
                    <>
                      <div className="flex justify-between"><span className="text-slate-400">Floors</span><span className="font-bold capitalize">{houseType}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Bedrooms</span><span className="font-bold">{bedrooms}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Bathrooms</span><span className="font-bold">{bathrooms}</span></div>
                    </>
                  )}
                  {serviceType === 'Electrical Work' && (
                    <>
                      <div className="flex justify-between"><span className="text-slate-400">Wiring Points</span><span className="font-bold">{serviceDetails.wiringPoints||10}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Phase</span><span className="font-bold">{serviceDetails.phaseType||'Single Phase'}</span></div>
                    </>
                  )}
                  {serviceType === 'Plumbing' && (
                    <>
                      <div className="flex justify-between"><span className="text-slate-400">Water Points</span><span className="font-bold">{serviceDetails.waterPoints||8}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Pipe Type</span><span className="font-bold">{serviceDetails.pipeMaterial||'Standard PVC'}</span></div>
                    </>
                  )}
                  {serviceType === 'Renovation' && (
                    <div className="flex justify-between"><span className="text-slate-400">Scope</span><span className="font-bold">{serviceDetails.renovationScope||'Kitchen Remodel'}</span></div>
                  )}
                  {serviceType === 'House Design' && (
                    <div className="flex justify-between"><span className="text-slate-400">Package</span><span className="font-bold">{serviceDetails.designType||'2D Blueprint'}</span></div>
                  )}
                  {serviceType === 'Structural Engineering' && (
                    <div className="flex justify-between"><span className="text-slate-400">Assessment</span><span className="font-bold">{serviceDetails.assessmentType||'Soil Boring Test'}</span></div>
                  )}
                  {serviceType === 'Landscaping' && (
                    <>
                      <div className="flex justify-between"><span className="text-slate-400">Turf Type</span><span className="font-bold">{serviceDetails.turfType||'Standard'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Add-ons</span><span className="font-bold">{(serviceDetails.features||[]).length} Selected</span></div>
                    </>
                  )}
                  {selectedMaterials.length > 0 && (
                    <div className="flex justify-between"><span className="text-slate-400">Premium Materials</span><span className="font-bold">{selectedMaterials.length} Added</span></div>
                  )}
                </div>

                <div>
                  <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Estimated Cost</span>
                  <span className="block font-black text-2xl text-emerald-400">LKR {previewCost.toLocaleString()}</span>
                </div>

                <div>
                  <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Estimated Timeline</span>
                  <span className="block font-black text-xl text-amber-400">{previewDuration} Weeks</span>
                </div>

                <p className="text-[10px] text-slate-500 leading-relaxed">
                  *This calculation is computed programmatically and is subject to final adjustments and approval by our senior engineer.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* MESSAGES TAB */}
        {activeTab === 'messages' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-950">Messages</h2>
              <p className="text-slate-500 text-sm">Direct chat with Rohana Construction office. We typically reply within 2 hours.</p>
            </div>

            {/* Contact Info Bar */}
            <div className="bg-slate-900 rounded-2xl p-4 flex flex-wrap gap-4 text-xs text-slate-300">
              <div className="flex items-center space-x-2">
                <Phone className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span>076 911 73 98</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span>rohanaconstruction@gmail.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse shrink-0"></div>
                <span className="text-emerald-400 font-semibold">Admin Online</span>
              </div>
            </div>

            {/* Chat Window */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col" style={{ height: '520px' }}>
              
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-100 flex items-center space-x-3 bg-slate-50 rounded-t-2xl">
                <div className="h-9 w-9 bg-amber-500 rounded-full flex items-center justify-center text-slate-950 font-black text-sm shrink-0">
                  RC
                </div>
                <div>
                  <span className="block font-extrabold text-slate-900 text-sm">Rohana Construction</span>
                  <span className="block text-[10px] text-emerald-500 font-semibold">● Company Admin — Available</span>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
                {chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-3 text-center">
                    <div className="h-14 w-14 bg-amber-500/10 rounded-2xl flex items-center justify-center">
                      <MessageSquare className="h-7 w-7 text-amber-500" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-700 text-sm">No messages yet</p>
                      <p className="text-slate-400 text-xs mt-1">Start a conversation — ask about services, estimates, or project status.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {chatMessages.map((msg, idx) => {
                      const isMe = msg.sender_id !== adminId;
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
                                RC
                              </div>
                            )}
                            <div className={`max-w-xs md:max-w-sm ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                              <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                                isMe 
                                  ? 'bg-amber-500 text-slate-950 rounded-br-sm font-medium' 
                                  : 'bg-white text-slate-800 rounded-bl-sm border border-slate-100 shadow-sm'
                              }`}>
                                <p>{msg.content}</p>
                              </div>
                              <span className={`text-[9px] text-slate-400 mt-1 ${isMe ? 'text-right' : 'text-left'}`}>{time}</span>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                    <div ref={chatEndRef} />
                  </>
                )}
              </div>

              {/* Send Form */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 flex space-x-2 bg-white rounded-b-2xl">
                <input
                  type="text"
                  value={msgInput}
                  onChange={(e) => setMsgInput(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-slate-800 transition-colors"
                  placeholder="Type your message here..."
                  disabled={isSending}
                />
                <button
                  type="submit"
                  disabled={isSending || !msgInput.trim()}
                  className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 p-3 rounded-xl transition-all cursor-pointer shadow-md shadow-amber-500/10 shrink-0"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
