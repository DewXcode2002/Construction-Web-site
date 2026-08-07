import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Mail, Lock, Phone, MapPin, Award, ShieldAlert, KeyRound } from 'lucide-react';

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('customer'); // customer, employee
  
  // Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [nic, setNic] = useState('');
  const [experience, setExperience] = useState('1 year');
  const [category, setCategory] = useState('Masonry work');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle redirect queries
  const redirect = searchParams.get('redirect');
  const planId = searchParams.get('id');
  const serviceParam = searchParams.get('service');

  useEffect(() => {
    // Clear alerts on page toggle
    setError('');
    setSuccess('');
  }, [isLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const url = isLogin ? 'http://localhost:5000/api/auth/login' : 'http://localhost:5000/api/auth/register';
    const payload = isLogin 
      ? { username, password }
      : { 
          username, password, email, role, fullName, phone, address,
          nic: role === 'employee' ? nic : undefined,
          experience: role === 'employee' ? experience : undefined,
          category: role === 'employee' ? category : undefined
        };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      if (isLogin) {
        localStorage.setItem('rcms_token', data.token);
        localStorage.setItem('rcms_user', JSON.stringify(data.user));
        
        // Navigation based on role
        if (data.user.role === 'admin') {
          navigate('/admin');
        } else if (data.user.role === 'employee') {
          navigate('/employee');
        } else {
          if (redirect === 'service' && serviceParam) {
            navigate(`/customer?tab=estimator&service=${encodeURIComponent(serviceParam)}`);
          } else if (redirect === 'estimate') {
            navigate('/customer?tab=estimator');
          } else if (redirect === 'plan' && planId) {
            navigate(`/customer?plan=${planId}`);
          } else if (redirect === 'messages') {
            navigate('/customer?tab=messages');
          } else {
            navigate('/customer');
          }
        }
      } else {
        setSuccess('Registration successful! Please login with your credentials.');
        setIsLogin(true);
        // Clear registration specific fields
        setUsername('');
        setPassword('');
        setEmail('');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Graphic */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <img 
          src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1920&q=80" 
          alt="Overlay"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="relative max-w-md w-full space-y-8 glass-dark p-8 rounded-2xl border border-slate-800 z-10">
        
        {/* Title */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight uppercase">
            Rohana <span className="text-amber-500">Construction</span>
          </h2>
          <p className="text-xs text-slate-400">
            {isLogin ? 'Sign in to access your dashboard portal' : 'Create an account to join us'}
          </p>
        </div>

        {/* Service context banner — shown when coming from a service page */}
        {serviceParam && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-center">
            <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">You selected</p>
            <p className="text-sm font-extrabold text-white mt-0.5">{serviceParam}</p>
            <p className="text-[10px] text-slate-400 mt-1">Sign in or register below to get your cost estimate.</p>
          </div>
        )}

        {/* Form Selection Toggle */}
        <div className="flex border border-slate-800 rounded-lg p-1">
          <button
            onClick={() => setIsLogin(true)}
            className={`w-1/2 text-center py-2.5 rounded text-xs font-bold uppercase transition-all cursor-pointer ${
              isLogin ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`w-1/2 text-center py-2.5 rounded text-xs font-bold uppercase transition-all cursor-pointer ${
              !isLogin ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="flex items-center space-x-2 bg-red-500/10 text-red-500 p-4 rounded-xl border border-red-500/20 text-xs">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center space-x-2 bg-emerald-500/10 text-emerald-500 p-4 rounded-xl border border-emerald-500/20 text-xs">
            <KeyRound className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Sign Up Role Choice */}
          {!isLogin && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Registering As</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('customer')}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    role === 'customer' 
                      ? 'bg-amber-500/10 border-amber-500 text-amber-500' 
                      : 'border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Customer (Build house)
                </button>
                <button
                  type="button"
                  onClick={() => setRole('employee')}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    role === 'employee' 
                      ? 'bg-amber-500/10 border-amber-500 text-amber-500' 
                      : 'border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Employee (Find work)
                </button>
              </div>
            </div>
          )}

          {/* Input Fields */}
          <div className="space-y-4">
            
            {/* Username */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors text-white"
                  placeholder="e.g. silva99"
                />
              </div>
            </div>

            {/* Email (Register only) */}
            {!isLogin && (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors text-white"
                    placeholder="name@gmail.com"
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors text-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Full Name & Phone & Address (Register only) */}
            {!isLogin && (
              <>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors text-white"
                    placeholder="Mr. Kamal Silva"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Phone className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors text-white"
                      placeholder="07XXXXXXXX"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors text-white"
                      placeholder="Street, City"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Employee Specific Fields */}
            {!isLogin && role === 'employee' && (
              <div className="border-t border-slate-800 pt-4 space-y-4">
                <span className="block text-[10px] font-bold uppercase text-amber-500 tracking-wider">Employee Settings</span>
                
                {/* NIC */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">NIC Number</label>
                  <input
                    type="text"
                    required
                    value={nic}
                    onChange={(e) => setNic(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors text-white"
                    placeholder="99XXXXXXXV or 1999XXXXXXXX"
                  />
                </div>

                {/* Worker Category */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Category Skill</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors text-white cursor-pointer"
                  >
                    <option value="Masonry work">Masonry work</option>
                    <option value="Tile">Tile</option>
                    <option value="House wiring">House wiring</option>
                    <option value="Painting">Painting</option>
                    <option value="Gardening">Gardening</option>
                    <option value="Roofing">Roofing</option>
                    <option value="Carpentry">Carpentry</option>
                  </select>
                </div>

                {/* Experience */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Experience level</label>
                  <select
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors text-white cursor-pointer"
                  >
                    <option value="1 year">1 Year</option>
                    <option value="2 years">2 Years</option>
                    <option value="3-5 years">3 - 5 Years</option>
                    <option value="5+ years">5+ Years</option>
                  </select>
                </div>
              </div>
            )}

          </div>

          <button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3.5 rounded-xl transition-all shadow-md shadow-amber-500/10 cursor-pointer text-sm"
          >
            {isLogin ? 'Sign In to Portal' : 'Register Profile'}
          </button>
        </form>

        {isLogin && (
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => alert("Please contact Administrator at rohanaconstruction@gmail.com to reset password.")}
              className="text-xs text-slate-500 hover:text-slate-400 transition-colors cursor-pointer"
            >
              Forgot password?
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
