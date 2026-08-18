import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, DollarSign, MapPin, Send, MessageSquare, Briefcase, FileCheck, CheckCircle2, ShieldAlert } from 'lucide-react';
import API_URL from '../config';
import BackButton from '../components/BackButton';

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('attendance');
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);

  // Dashboard state
  const [dashboardData, setDashboardData] = useState(null);
  const [attStatus, setAttStatus] = useState({ checkedIn: false, checkedOut: false, record: null });
  const [chatMessages, setChatMessages] = useState([]);
  const [msgInput, setMsgInput] = useState('');
  const [attMsg, setAttMsg] = useState('');

  useEffect(() => {
    const storedToken = localStorage.getItem('rcms_token');
    const storedUser = localStorage.getItem('rcms_user');
    if (!storedToken || !storedUser) {
      navigate('/login');
      return;
    }

    const u = JSON.parse(storedUser);
    if (u.role !== 'employee') {
      navigate('/');
      return;
    }

    setToken(storedToken);
    setUser(u);

    // Initial load
    fetchDashboardInfo(storedToken);
    fetchAttendanceStatus(storedToken);
    fetchMessages(storedToken);
  }, []);

  const fetchDashboardInfo = async (authToken) => {
    fetch(`${API_URL}/api/employee/dashboard-info`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
      .then(res => res.json())
      .then(data => setDashboardData(data))
      .catch(err => console.error(err));
  };

  const fetchAttendanceStatus = async (authToken) => {
    fetch(`${API_URL}/api/employee/attendance-status`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
      .then(res => res.json())
      .then(data => setAttStatus(data))
      .catch(err => console.error(err));
  };

  const fetchMessages = async (authToken) => {
    fetch(`${API_URL}/api/messages/1`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
      .then(res => res.json())
      .then(data => setChatMessages(data))
      .catch(err => console.error(err));
  };

  // Keep message pulling active
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      fetchMessages(token);
    }, 5000);
    return () => clearInterval(interval);
  }, [token]);

  const handleCheckIn = async () => {
    setAttMsg('');
    try {
      const res = await fetch(`${API_URL}/api/employee/check-in`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setAttMsg(data.message);
      fetchAttendanceStatus(token);
      fetchDashboardInfo(token);
    } catch (err) {
      setAttMsg('Error checking in: ' + err.message);
    }
  };

  const handleCheckOut = async () => {
    setAttMsg('');
    try {
      const res = await fetch(`${API_URL}/api/employee/check-out`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setAttMsg(data.message);
      fetchAttendanceStatus(token);
      fetchDashboardInfo(token);
    } catch (err) {
      setAttMsg('Error checking out: ' + err.message);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!msgInput.trim()) return;

    try {
      const res = await fetch(`${API_URL}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ receiverId: 1, content: msgInput })
      });
      if (res.ok) {
        setMsgInput('');
        fetchMessages(token);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const employee = dashboardData?.employee;
  const assignments = dashboardData?.assignments || [];
  const salaries = dashboardData?.salaries || [];
  const attendanceLogs = dashboardData?.attendance || [];

  // PENDING STATUS SCREEN
  if (employee && employee.status !== 'approved') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 pt-28 relative">
        <div className="max-w-md w-full glass-dark p-8 rounded-2xl border border-slate-800 text-center space-y-6">
          <div className="flex justify-between items-center">
            <BackButton variant="subtle" />
          </div>
          <ShieldAlert className="h-16 w-16 text-amber-500 mx-auto" />
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-white uppercase tracking-wider">Application Under Review</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Hello, {employee.full_name}. Your profile as a **{employee.category}** is pending admin activation.
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl text-left text-xs space-y-1 text-slate-300">
            <div><span className="text-slate-500">NIC:</span> {employee.nic}</div>
            <div><span className="text-slate-500">Address:</span> {employee.address}</div>
            <div><span className="text-slate-500">Category:</span> {employee.category}</div>
            <div><span className="text-slate-500">Phone:</span> {employee.phone}</div>
          </div>
          <p className="text-[10px] text-slate-500">
            Once approved, you will get access to check-in logs, job locations, and wage payslips. Call 076 911 73 98 for inquiries.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-20 flex flex-col md:flex-row">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-white shrink-0 border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="block text-xs uppercase tracking-widest text-amber-500 font-semibold mb-1">Employee Portal</span>
            <h2 className="font-bold text-lg text-white leading-tight truncate">{employee?.full_name || 'Worker'}</h2>
            <span className="text-[10px] text-slate-400 capitalize block">{employee?.category}</span>
          </div>
          <BackButton variant="subtle" showLabel={false} />
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: 'attendance', label: 'Daily Attendance', icon: Clock },
            { id: 'schedule', label: 'Work Assignments', icon: Briefcase },
            { id: 'salary', label: 'Salary & Payslips', icon: DollarSign },
            { id: 'messages', label: 'Contact Office', icon: MessageSquare }
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

      {/* Main Panel */}
      <main className="flex-1 p-6 md:p-10 max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <BackButton variant="default" />
          {activeTab !== 'attendance' && (
            <button 
              onClick={() => setActiveTab('attendance')}
              className="text-xs text-amber-600 hover:text-amber-700 font-semibold underline cursor-pointer"
            >
              ← Back to Attendance
            </button>
          )}
        </div>
        
        {/* ATTENDANCE TAB */}
        {activeTab === 'attendance' && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-950">Daily Shift Attendance</h2>
              <p className="text-slate-500 text-sm">Register your check-in and check-out timings to calculate your monthly wage slip.</p>
            </div>

            {attMsg && (
              <div className="bg-amber-500/10 text-slate-800 border border-amber-500/20 p-4 rounded-xl text-xs font-bold">
                {attMsg}
              </div>
            )}

            {/* Checkin buttons card */}
            <div className="bg-white border border-slate-100 p-6 md:p-8 rounded-2xl shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-4">
                <h3 className="font-extrabold text-slate-900 text-base">Shift Status - {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                <div className="text-xs text-slate-500 space-y-1">
                  <p>• Standard working hours: 8.00 AM to 5.00 PM</p>
                  <p>• Daily Base Wage: LKR {employee?.daily_rate || 1500}/day</p>
                  {attStatus.checkedIn && <p className="text-emerald-600 font-bold">• Check In Logged: {attStatus.record?.check_in}</p>}
                  {attStatus.checkedOut && <p className="text-red-500 font-bold">• Check Out Logged: {attStatus.record?.check_out}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleCheckIn}
                  disabled={attStatus.checkedIn}
                  className={`py-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-center ${
                    attStatus.checkedIn 
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed' 
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/10'
                  }`}
                >
                  Check In
                </button>
                <button
                  onClick={handleCheckOut}
                  disabled={!attStatus.checkedIn || attStatus.checkedOut}
                  className={`py-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-center ${
                    !attStatus.checkedIn || attStatus.checkedOut 
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed' 
                      : 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/10'
                  }`}
                >
                  Check Out
                </button>
              </div>
            </div>

            {/* Attendance Logs List */}
            <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-base">Recent Attendance History</h3>
              {attendanceLogs.length === 0 ? (
                <p className="text-xs text-slate-400">No attendance logs logged this week.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-widest font-bold">
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Check In</th>
                        <th className="pb-3">Check Out</th>
                        <th className="pb-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceLogs.map((log) => (
                        <tr key={log.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                          <td className="py-3 font-semibold text-slate-700">{log.date}</td>
                          <td className="py-3 text-slate-600 font-bold">{log.check_in}</td>
                          <td className="py-3 text-slate-600 font-bold">{log.check_out || 'Active shift'}</td>
                          <td className="py-3 text-right">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                              log.check_out ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {log.check_out ? 'completed' : 'on shift'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* WORK SCHEDULE TAB */}
        {activeTab === 'schedule' && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-950">Work Assignments</h2>
              <p className="text-slate-500 text-sm">Site locations and project coordinates assigned to you by administrators.</p>
            </div>

            {assignments.length === 0 ? (
              <div className="bg-white border border-slate-100 p-8 rounded-2xl shadow-sm text-center space-y-2 text-slate-400">
                <Briefcase className="h-8 w-8 mx-auto" />
                <p className="text-xs">No active building site assignments. Admin will notify you when a site starts.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {assignments.map(proj => (
                  <div key={proj.id} className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
                    <div className="flex items-center space-x-3 text-amber-500 font-extrabold text-xs uppercase tracking-wider">
                      <Briefcase className="h-4 w-4" />
                      <span>{proj.status} Phase</span>
                    </div>

                    <h3 className="font-extrabold text-slate-900 text-lg leading-tight">{proj.name}</h3>

                    <div className="text-xs text-slate-500 space-y-1.5 border-t border-slate-50 pt-3">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>Site Location: <strong className="text-slate-700">{proj.location}</strong></span>
                      </div>
                      <p>• Standard hours: 8:00 AM - 5:00 PM</p>
                    </div>

                    <button
                      onClick={() => {
                        const text = encodeURIComponent(`Hi, I'm heading to the site ${proj.name} at ${proj.location} now.`);
                        window.open(`https://wa.me/94740633847?text=${text}`, '_blank');
                      }}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-lg transition-colors cursor-pointer text-center"
                    >
                      Notify via WhatsApp
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SALARY TAB */}
        {activeTab === 'salary' && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-950">Salary & Payslips</h2>
              <p className="text-slate-500 text-sm">Monthly structural payroll logs calculated based on active check-in shifts.</p>
            </div>

            <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-base">Monthly Wage Records</h3>
              {salaries.length === 0 ? (
                <p className="text-xs text-slate-400">No payroll payouts generated yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-widest font-bold">
                        <th className="pb-3">Month</th>
                        <th className="pb-3">Shift Wages</th>
                        <th className="pb-3">OT / Bonus</th>
                        <th className="pb-3 text-right">Total Payout</th>
                        <th className="pb-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salaries.map((sal) => (
                        <tr key={sal.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                          <td className="py-4 font-semibold text-slate-700">{sal.month}</td>
                          <td className="py-4 text-slate-600">LKR {sal.base_salary.toLocaleString()}</td>
                          <td className="py-4 text-slate-600">LKR {(sal.ot + sal.bonus).toLocaleString()}</td>
                          <td className="py-4 font-bold text-slate-900 text-right">LKR {sal.total_paid.toLocaleString()}</td>
                          <td className="py-4 text-center">
                            <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                              sal.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {sal.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MESSAGES TAB */}
        {activeTab === 'messages' && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-950">Messages</h2>
              <p className="text-slate-500 text-sm">Direct message communication with Rohana Construction office administrators.</p>
            </div>

            {/* Chat Box */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col h-[500px]">
              
              {/* Header */}
              <div className="p-4 border-b border-slate-100 flex items-center space-x-3 bg-slate-50 rounded-t-2xl">
                <div className="h-3.5 w-3.5 bg-emerald-500 rounded-full"></div>
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">Company Agent (Admin)</span>
              </div>

              {/* Message scroll container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                {chatMessages.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-10">No messages yet. Send an inquiry below.</p>
                ) : (
                  chatMessages.map(msg => {
                    const isAdmin = msg.sender_id === 1; // Assuming Admin is user ID 1
                    return (
                      <div key={msg.id} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-xs md:max-w-md px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                          isAdmin 
                            ? 'bg-slate-100 text-slate-800 rounded-tl-none' 
                            : 'bg-amber-500 text-slate-950 rounded-tr-none font-medium'
                        }`}>
                          <p>{msg.content}</p>
                          <span className="block text-[8px] text-slate-400 mt-1.5 text-right uppercase">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Send Form */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 flex space-x-2 bg-white rounded-b-2xl">
                <input
                  type="text"
                  required
                  value={msgInput}
                  onChange={(e) => setMsgInput(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-amber-500 text-slate-850"
                  placeholder="Type your message here..."
                />
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 p-3 rounded-xl transition-all cursor-pointer shadow-md shadow-amber-500/10 shrink-0"
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
