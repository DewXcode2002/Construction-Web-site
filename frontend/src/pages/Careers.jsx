import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  HardHat, 
  User, 
  Mail, 
  Lock, 
  Phone, 
  MapPin, 
  IdCard, 
  Briefcase, 
  Wrench, 
  ShieldCheck, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Sparkles,
  Layers,
  Zap,
  Paintbrush,
  Trees,
  Hammer,
  Globe,
  Eye,
  EyeOff
} from 'lucide-react';
import API_URL from '../config';
import BackButton from '../components/BackButton';
import Footer from '../components/Footer';

// Translations Dictionary
const translations = {
  en: {
    badge: 'Join Rohana Construction Workforce',
    heroTitlePart1: 'Are You a Skilled Tradesperson?',
    heroTitlePart2: 'Join Us to Find Steady Job Opportunities',
    heroDesc: 'If you are a mason, painter, tiler, electrician, carpenter, or roofer, Rohana Construction offers consistent work opportunities across all construction services we provide.',
    perk1: 'Daily / Monthly Fair Wages',
    perk2: 'Safe Worksite Environment',
    perk3: 'Continuous Project Opportunities',
    sectionTitle: 'Available Service Categories',
    sectionDesc: 'If you have experience in any of the following trades, connect with our team today.',
    applyRole: 'Apply for this role',
    formTitle: 'Skilled Worker Application Form',
    formSubtitle: 'Fill in the details below to submit your job application.',
    sec1Title: '1. Personal Details',
    fullNameLabel: 'Full Name',
    fullNamePlaceholder: 'e.g. W. K. Suneth Perera',
    nicLabel: 'NIC Number',
    nicPlaceholder: '95XXXXXXXXV / 1995XXXXXXXX',
    phoneLabel: 'Contact Phone Number',
    phonePlaceholder: '077XXXXXXX',
    addressLabel: 'Permanent Address',
    addressPlaceholder: 'No. 12, Main Street, Matara',
    sec2Title: '2. Work Skills & Category',
    categoryLabel: 'Primary Service Category',
    expLabel: 'Work Experience',
    exp1: '1 Year',
    exp2: '2 Years',
    exp3: '3 - 5 Years',
    exp5: '5+ Years',
    sec3Title: '3. Login Account Credentials',
    usernameLabel: 'Username',
    usernamePlaceholder: 'e.g. suneth95',
    emailLabel: 'Email Address',
    emailPlaceholder: 'suneth@gmail.com',
    passLabel: 'Password',
    passPlaceholder: '••••••••',
    submitBtn: 'Submit Application',
    submittingBtn: 'Submitting Application...',
    alreadyRegistered: 'Already registered as an employee?',
    signInLink: 'Employee Portal Sign In',
    successMsg: 'Registration Successful! You can now sign in to your Employee Dashboard portal.',
    catMason: { title: 'Masonry Work', desc: 'Foundation, block laying, brickwork, plastering & structural masonry.' },
    catTile: { title: 'Tile Fitting', desc: 'Floor tiling, wall tiles, bathroom & kitchen tile installation.' },
    catWiring: { title: 'House Wiring & Electrical', desc: 'Main switchboards, conduit wiring, lighting & power fittings.' },
    catPainting: { title: 'Painting & Finishing', desc: 'Interior/exterior wall painting, putty work, weatherproofing.' },
    catRoofing: { title: 'Roofing & Truss Work', desc: 'Roof structure, tile/sheet installation & waterproofing.' },
    catCarpentry: { title: 'Carpentry & Woodwork', desc: 'Doors, windows, cupboards, roof timbers & custom woodwork.' },
    catGardening: { title: 'Gardening & Landscaping', desc: 'Lawn laying, garden design, paving & outdoor landscaping.' }
  },
  si: {
    badge: 'සේවක එකතුවට එක්වන්න',
    heroTitlePart1: 'ඔබ කාර්මික ශිල්පියෙක්ද?',
    heroTitlePart2: 'අප සමග එක්ව ස්ථිර රැකියා අවස්ථා ලබාගන්න',
    heroDesc: 'ඔබ මේසන් බාස් කෙනෙක්, පේන්ටර් කෙනෙක්, ටයිල් බාස් කෙනෙක් හෝ විදුලි කාර්මිකයෙක් නම්, රොහණ Construction ආයතනය මගින් සැපයෙන සෑම Construction Service එකකටම අදාළව ඔබට ස්ථිර රැකියා අවස්ථා ලබාගත හැක.',
    perk1: 'දිනපතා / මාසික සාධාරණ වේතන',
    perk2: 'ආරක්ෂිත වැඩබිම් පරිසරය',
    perk3: 'නිරන්තර ව්‍යාපෘති අවස්ථා',
    sectionTitle: 'අප ආයතනයේ සේවා ක්ෂේත්‍ර',
    sectionDesc: 'පහත සඳහන් ඕනෑම ක්ෂේත්‍රයක පළපුරුද්දක් ඇති ඔබට අප ආයතනය හා සම්බන්ධ විය හැක.',
    applyRole: 'මෙම ක්ෂේත්‍රයට ඉල්ලුම් කරන්න',
    formTitle: 'සේවක ලියාපදිංචි වීමේ පෝරමය',
    formSubtitle: 'රැකියාව ලබාගැනීමට පහත තොරතුරු නිවැරදිව පුරවා යොමු කරන්න.',
    sec1Title: '1. පෞද්ගලික තොරතුරු',
    fullNameLabel: 'සම්පූර්ණ නම',
    fullNamePlaceholder: 'උදා: ඩබ්. කේ. සුනෙත් පෙරේරා',
    nicLabel: 'ජාතික හැඳුනුම්පත් අංකය',
    nicPlaceholder: '95XXXXXXXXV / 1995XXXXXXXX',
    phoneLabel: 'දුරකථන අංකය',
    phonePlaceholder: '077XXXXXXX',
    addressLabel: 'ලිපිනය',
    addressPlaceholder: 'නො. 12, ප්‍රධාන පාර, මාතර',
    sec2Title: '2. ක්ෂේත්‍රය සහ පළපුරුද්ද',
    categoryLabel: 'ප්‍රධාන රක්ෂා ක්ෂේත්‍රය',
    expLabel: 'පළපුරුද්ද ප්‍රමාණය',
    exp1: 'වසර 1',
    exp2: 'වසර 2',
    exp3: 'වසර 3 - 5',
    exp5: 'වසර 5ට වැඩි',
    sec3Title: '3. ගිණුම් තොරතුරු (Portal Login)',
    usernameLabel: 'පරිශීලක නමය (Username)',
    usernamePlaceholder: 'උදා: suneth95',
    emailLabel: 'විද්‍යුත් තැපෑල (Email)',
    emailPlaceholder: 'suneth@gmail.com',
    passLabel: 'මුරපදය (Password)',
    passPlaceholder: '••••••••',
    submitBtn: 'ලියාපදිංචි වන්න',
    submittingBtn: 'යොමු වෙමින් පවතී...',
    alreadyRegistered: 'දැනටමත් ලියාපදිංචි වී ඇති සේවකයෙක්ද?',
    signInLink: 'Employee Portal එකට පිවිසෙන්න',
    successMsg: 'ලියාපදිංචිය සාර්ථකයි! ඔබට දැන් Employee Dashboard එකට Log විය හැක.',
    catMason: { title: 'මේසන් වැඩ (Masonry)', desc: 'අත්තිවාරම්, ගඩොල් / බ්ලොක් ගැලපීම, ප්ලාස්ටර් සහ මේසන් වැඩ.' },
    catTile: { title: 'ටයිල් ඇල්ලීම (Tile)', desc: 'පොළව ටයිල්, බිත්ති ටයිල්, නාන කාමර සහ මුළුතැන්ගෙයි ටයිල් වැඩ.' },
    catWiring: { title: 'විදුලි වැඩ (Electrical)', desc: 'ප්‍රධාන ස්විච් පුවරු, වයරින්, ආලෝකකරණය සහ විදුලි සවිකිරීම්.' },
    catPainting: { title: 'පේන්ට් වැඩ (Painting)', desc: 'අභ්‍යන්තර / බාහිර බිත්ති පින්තාරු කිරීම, පුට්ටි සහ වර්ණ ගැන්වීම.' },
    catRoofing: { title: 'වහල වැඩ (Roofing)', desc: 'වහලයේ සැකිලි, උළු / තහඩු සවිකිරීම සහ වහල වැඩ.' },
    catCarpentry: { title: 'වඩු වැඩ (Carpentry)', desc: 'දොරවල්, ජනෙල්, අල්මාරි සහ ලී කැටයම් ඇතුළු වඩු වැඩ.' },
    catGardening: { title: 'ගෙවතු අලංකරණය (Gardening)', desc: 'තණකොළ වගාව, ගෙවතු සැලසුම් සහ එළිමහන් අලංකරණය.' }
  }
};

export default function Careers() {
  const navigate = useNavigate();

  // Language state (Default: 'en' for English)
  const [lang, setLang] = useState('en');
  const t = translations[lang];

  // Form States
  const [fullName, setFullName] = useState('');
  const [nic, setNic] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('Masonry work');
  const [experience, setExperience] = useState('1 year');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const categories = [
    {
      id: 'Masonry work',
      title: t.catMason.title,
      icon: Hammer,
      desc: t.catMason.desc,
      badge: 'High Demand'
    },
    {
      id: 'Tile',
      title: t.catTile.title,
      icon: Layers,
      desc: t.catTile.desc,
      badge: 'Hot Job'
    },
    {
      id: 'House wiring',
      title: t.catWiring.title,
      icon: Zap,
      desc: t.catWiring.desc,
      badge: 'Skilled'
    },
    {
      id: 'Painting',
      title: t.catPainting.title,
      icon: Paintbrush,
      desc: t.catPainting.desc,
      badge: 'Popular'
    },
    {
      id: 'Roofing',
      title: t.catRoofing.title,
      icon: HardHat,
      desc: t.catRoofing.desc,
      badge: 'Skilled'
    },
    {
      id: 'Carpentry',
      title: t.catCarpentry.title,
      icon: Wrench,
      desc: t.catCarpentry.desc,
      badge: 'Craftsman'
    },
    {
      id: 'Gardening',
      title: t.catGardening.title,
      icon: Trees,
      desc: t.catGardening.desc,
      badge: 'Creative'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Strict NIC and Phone validation
    const isNicValid = /^[0-9]{9}[vVxX]$|^[0-9]{12}$/.test(nic.trim());
    if (!isNicValid) {
      setError('Invalid NIC number format. Please enter a valid 9-digit + V/X or 12-digit NIC number (e.g. 951234567V or 199512345678).');
      return;
    }

    const isPhoneValid = /^(?:0|\+94)?7[0-9]{8}$/.test(phone.trim().replace(/[\s-]/g, ''));
    if (!isPhoneValid) {
      setError('Invalid Sri Lankan phone number format. Please enter a valid mobile number (e.g. 0771234567).');
      return;
    }

    setLoading(true);

    const payload = {
      role: 'employee',
      username,
      email,
      password,
      fullName,
      phone,
      address,
      nic,
      experience,
      category
    };

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed. Please try again.');
      }

      setSuccess(t.successMsg);
      
      // Clear form
      setFullName('');
      setNic('');
      setAddress('');
      setPhone('');
      setUsername('');
      setEmail('');
      setPassword('');
      
      setTimeout(() => {
        navigate('/login');
      }, 2500);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pt-20 pb-16 relative overflow-hidden">
      
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Language Selector & Back Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex items-center justify-between">
        <BackButton variant="default" />
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400">
          <Globe className="h-4 w-4 text-amber-500" />
          <span>Language Options:</span>
        </div>
        
        <div className="inline-flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setLang('en')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              lang === 'en'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🇬🇧 English
          </button>
          <button
            onClick={() => setLang('si')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              lang === 'si'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🇱🇰 සිංහල
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-8 pb-16 max-w-7xl mx-auto">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          
          <div className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-full">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              {t.badge}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight uppercase leading-tight">
            {t.heroTitlePart1} <br className="hidden sm:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600">
              {t.heroTitlePart2}
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed font-light">
            {t.heroDesc}
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400 font-medium">
            <div className="flex items-center space-x-2 bg-slate-900/80 px-4 py-2 rounded-lg border border-slate-800">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              <span>{t.perk1}</span>
            </div>
            <div className="flex items-center space-x-2 bg-slate-900/80 px-4 py-2 rounded-lg border border-slate-800">
              <ShieldCheck className="h-4 w-4 text-amber-400" />
              <span>{t.perk2}</span>
            </div>
            <div className="flex items-center space-x-2 bg-slate-900/80 px-4 py-2 rounded-lg border border-slate-800">
              <Clock className="h-4 w-4 text-blue-400" />
              <span>{t.perk3}</span>
            </div>
          </div>

        </div>
      </section>

      {/* Available Categories Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-10 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="text-center mb-10 space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-wider text-white">
            {t.sectionTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            {t.sectionDesc}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((item) => {
            const IconComponent = item.icon;
            const isSelected = category === item.id;
            return (
              <div 
                key={item.id}
                onClick={() => {
                  setCategory(item.id);
                  document.getElementById('worker-form')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`group relative p-6 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${
                  isSelected 
                    ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/10' 
                    : 'bg-slate-900/60 border-slate-800 hover:border-amber-500/50 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl transition-colors ${
                    isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950'
                  }`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
                    {item.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  {item.desc}
                </p>

                <div className="flex items-center text-xs font-semibold text-amber-500 group-hover:translate-x-1 transition-transform">
                  <span>{t.applyRole}</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Worker Registration Form Section */}
      <section id="worker-form" className="px-4 sm:px-6 lg:px-8 py-12 max-w-4xl mx-auto">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-6 sm:p-10 rounded-3xl shadow-2xl relative">
          
          <div className="text-center mb-8 space-y-2">
            <div className="inline-flex p-3 bg-amber-500/10 rounded-2xl text-amber-500 mb-2">
              <HardHat className="h-8 w-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white uppercase tracking-tight">
              {t.formTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              {t.formSubtitle}
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-center space-x-3 bg-red-500/10 text-red-400 p-4 rounded-xl border border-red-500/20 text-sm">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 flex items-center space-x-3 bg-emerald-500/10 text-emerald-400 p-4 rounded-xl border border-emerald-500/20 text-sm">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Section 1: Personal Details */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-800 pb-2">
                {t.sec1Title}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {t.fullNameLabel} <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t.fullNamePlaceholder}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>

                {/* NIC */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {t.nicLabel} <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative">
                    <IdCard className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={nic}
                      onChange={(e) => setNic(e.target.value)}
                      placeholder={t.nicPlaceholder}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Contact Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {t.phoneLabel} <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t.phonePlaceholder}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {t.addressLabel} <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder={t.addressPlaceholder}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Work Skills & Experience */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-800 pb-2">
                {t.sec2Title}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {t.categoryLabel} <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                    >
                      <option value="Masonry work">Masonry Work</option>
                      <option value="Tile">Tile Fitting</option>
                      <option value="House wiring">House Wiring</option>
                      <option value="Painting">Painting</option>
                      <option value="Roofing">Roofing & Truss</option>
                      <option value="Carpentry">Carpentry</option>
                      <option value="Gardening">Gardening</option>
                    </select>
                  </div>
                </div>

                {/* Experience */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {t.expLabel} <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    <select
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                    >
                      <option value="1 year">{t.exp1}</option>
                      <option value="2 years">{t.exp2}</option>
                      <option value="3-5 years">{t.exp3}</option>
                      <option value="5+ years">{t.exp5}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Portal Login Credentials */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-800 pb-2">
                {t.sec3Title}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Username */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {t.usernameLabel} <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={t.usernamePlaceholder}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {t.emailLabel} <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t.emailPlaceholder}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {t.passLabel} <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t.passPlaceholder}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title={showPassword ? 'Hide Password' : 'Show Password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold py-4 rounded-xl text-base tracking-wide transition-all shadow-xl shadow-amber-500/10 cursor-pointer disabled:opacity-50"
              >
                {loading ? t.submittingBtn : t.submitBtn}
              </button>
            </div>

          </form>

          {/* Shortcut to Login */}
          <div className="mt-8 text-center border-t border-slate-800/80 pt-6">
            <p className="text-xs text-slate-400">
              {t.alreadyRegistered}
            </p>
            <Link 
              to="/login"
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 mt-2 transition-colors"
            >
              <span>{t.signInLink}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

        </div>
      </section>
    </div>
  );
}
