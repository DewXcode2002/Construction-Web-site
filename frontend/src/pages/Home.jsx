import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home as HouseIcon, Building2, Hammer, Ruler, HardHat, Bolt, Droplets, Paintbrush, Trees, Phone, MessageSquare, X, ChevronLeft, ChevronRight } from 'lucide-react';
import API_URL from '../config';

export default function Home() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [housePlans, setHousePlans] = useState([]);
  const [contactName, setContactName] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  const [selectedService, setSelectedService] = useState(null);
  const [activeServicePhotoIdx, setActiveServicePhotoIdx] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedProject(null);
        setSelectedService(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleProjectClick = (proj) => {
    setSelectedProject(proj);
    setActivePhotoIdx(0);
  };

  const nextPhoto = () => {
    if (!selectedProject) return;
    setActivePhotoIdx((prev) => (prev + 1) % selectedProject.gallery.length);
  };

  const prevPhoto = () => {
    if (!selectedProject) return;
    setActivePhotoIdx((prev) => (prev - 1 + selectedProject.gallery.length) % selectedProject.gallery.length);
  };

  const handleServiceClick = (srv) => {
    setSelectedService(srv);
    setActiveServicePhotoIdx(0);
  };

  const nextServicePhoto = () => {
    if (!selectedService) return;
    setActiveServicePhotoIdx((prev) => (prev + 1) % selectedService.gallery.length);
  };

  const prevServicePhoto = () => {
    if (!selectedService) return;
    setActiveServicePhotoIdx((prev) => (prev - 1 + selectedService.gallery.length) % selectedService.gallery.length);
  };

  // Fetch house plans on mount
  useEffect(() => {
    fetch(`${API_URL}/api/customer/plans`)
      .then(res => res.json())
      .then(data => setHousePlans(data))
      .catch(err => console.error('Error fetching plans:', err));
  }, []);

  const services = [
    { 
      name: 'Residential Construction', 
      desc: 'Modern, durable, and customized family homes built to specifications.', 
      icon: HouseIcon, 
      color: 'bg-emerald-500/10 text-emerald-600',
      description: 'We construct state-of-the-art custom residential homes, bungalows, and apartments across Sri Lanka. Our architectural engineers handle the entire process from structural design to modern finishing, ensuring compliance with local municipal guidelines.',
      specs: { "Process": "Turnkey Construction", "Pricing": "From LKR 6,500/sqft", "Compliance": "Local Council Approval Guaranteed", "Warranties": "10-Year Structural Guarantee" },
      gallery: [
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80"
      ]
    },
    { 
      name: 'Commercial Buildings', 
      desc: 'Sleek, structurally sound office buildings, shops, and warehouses.', 
      icon: Building2, 
      color: 'bg-blue-500/10 text-blue-600',
      description: 'We design and build contemporary office workspaces, showrooms, warehouses, and factories. Our teams utilize reinforced structural steel and heavy masonry columns built to withstand severe wind loads and seismic standards.',
      specs: { "Category": "Commercial Engineering", "Specialty": "Steel Frameworks & Glass Facades", "Foundations": "Heavy RCC Pad Foundations", "Duration": "Custom Project Timeline" },
      gallery: [
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80"
      ]
    },
    { 
      name: 'Renovation', 
      desc: 'Transformative remodeling for kitchens, bathrooms, offices, and full structures.', 
      icon: Hammer, 
      color: 'bg-amber-500/10 text-amber-600',
      description: 'Complete renovation, extension, and remodeling services. We specialize in transforming bathrooms, kitchens, office partitions, plastering repairs, and structural layout expansions.',
      specs: { "Type": "Renovation & Remodel", "Materials": "Eco-friendly paint, tiles, premium wood", "Wastage Cleanup": "Included in standard quotes", "Worksite Safety": "Fully secured scaffolding" },
      gallery: [
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80"
      ]
    },
    { 
      name: 'House Design', 
      desc: 'Architectural planning, drafting, and 3D mockups tailored for optimization.', 
      icon: Ruler, 
      color: 'bg-purple-500/10 text-purple-600',
      description: 'Get custom 2D blueprints, detailed electrical/plumbing diagrams, and 3D architectural walkthrough animations. Our draftsmen build state of the art layouts tailored to optimize natural lighting and ventilation.',
      specs: { "Deliverables": "2D Blueprints & 3D walkthroughs", "Formats": "AutoCAD DWG, PDF, High-Res PNG", "Revisions": "Up to 3 revisions included", "Design Fee": "Deducted if construction is handled by us" },
      gallery: [
        "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"
      ]
    },
    { 
      name: 'Structural Engineering', 
      desc: 'Technical guidance, stress testing, stability reporting and inspections.', 
      icon: HardHat, 
      color: 'bg-slate-500/10 text-slate-700',
      description: 'Expert stress analysis, column concrete assessments, soil boring analysis, and stability certificates. We offer professional structural sign-offs for housing loans and council clearances.',
      specs: { "Service": "Inspection & Certifications", "Core Testing": "Soil bearing & concrete compression testing", "Compliance": "IESL Structural Standards", "Lead Time": "3-5 business days" },
      gallery: [
        "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80"
      ]
    },
    { 
      name: 'Electrical Work', 
      desc: 'Safe wiring, installations, and system maintenance by certified pros.', 
      icon: Bolt, 
      color: 'bg-red-500/10 text-red-600',
      description: 'Certified residential and industrial wiring solutions. We configure distribution boards, smart lighting controls, lightning protectors, earth rods, and backup generators.',
      specs: { "Installation": "Single & Three-phase wiring", "Materials": "Fire-retardant conduits & copper cables", "Safety Checks": "Full insulation resistance test", "Certification": "CEB & LECO compliance standards" },
      gallery: [
        "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80"
      ]
    },
    { 
      name: 'Plumbing', 
      desc: 'High-quality pipe layout, leakage fixing, and sanitary setup.', 
      icon: Droplets, 
      color: 'bg-cyan-500/10 text-cyan-600',
      description: 'Precision plumbing layout routing, high-pressure booster pump installs, leak debugging, and high-end bathroom sanitary fitting setups.',
      specs: { "Pipes": "Type-1000 PVC & PPR hot/cold water pipes", "Fittings": "Premium brass gate valves", "Inspections": "24-hour pressure leak checks", "Guarantee": "5-Year leak-free assurance" },
      gallery: [
        "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80"
      ]
    },
    { 
      name: 'Painting', 
      desc: 'Aesthetic interior & exterior coating using premium paint materials.', 
      icon: Paintbrush, 
      color: 'bg-pink-500/10 text-pink-600',
      description: 'Premium interior wall smoothing using putty, moisture sealers, and aesthetic weather-guard exterior coating to keep your walls pristine.',
      specs: { "Coats": "1 Putty coat + 1 Sealer + 2 Paint coats", "Paints": "Dulux WeatherShield / Robbialac Permoglaze", "Warranty": "5-Year weather proofing paint warranty", "Eco Standards": "Ultra low VOC paint option" },
      gallery: [
        "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80"
      ]
    },
    { 
      name: 'Landscaping', 
      desc: 'Garden designs, turf setup, pathways and outdoor structural beauty.', 
      icon: Trees, 
      color: 'bg-teal-500/10 text-teal-600',
      description: 'Landscape design incorporating turf grass layout, decorative retaining stone walls, stone paved driveways, and plants mapping for natural shading.',
      specs: { "Turf Type": "Australian Blue Grass / Local Turf", "Paving": "Interlocking concrete blocks", "Drainage": "Integrated water runoff gullies", "Maintenance": "Optional weekly trimming packages" },
      gallery: [
        "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=800&q=80"
      ]
    },
  ];

  const projects = [
    { 
      title: 'Luxury House', 
      location: 'Colombo', 
      category: 'house', 
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80', 
      tag: 'Residential',
      description: 'A double-story luxury contemporary villa boasting high ceilings, open architectural planning, and custom mahogany woodwork. Features 4 spacious bedrooms, a modern modular kitchen, smart lighting control systems, and high-efficiency solar panel layouts.',
      specs: { Size: '3,200 Sq Ft', Duration: '6 Months', 'Structure Type': 'Reinforced Concrete', 'Key Materials': 'Grade-A Timber, Italian Marble, Custom Steel Framing' },
      gallery: [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80'
      ]
    },
    { 
      title: 'Office Building', 
      location: 'Gampaha', 
      category: 'commercial', 
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80', 
      tag: 'Commercial',
      description: 'A state-of-the-art 4-story commercial office building designed for multi-tenant configurations. Incorporates double-glazed glass facades for temperature control, backup diesel generator housings, fire suppression piping, and modular office cubicles.',
      specs: { Size: '12,500 Sq Ft', Duration: '14 Months', 'Structure Type': 'Steel Portal Frame', 'Key Materials': 'Structural Steel, Glass Curtain Wall, AAC Blocks' },
      gallery: [
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'
      ]
    },
    { 
      title: 'Shop Renovation', 
      location: 'Negombo', 
      category: 'renovation', 
      image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80', 
      tag: 'Renovation',
      description: 'Complete structural interior tear-down and architectural remodeling of a high-end retail showroom. We restructured load-bearing partition blocks, laid brand new large-format porcelain tiling, and set up custom drop-ceiling fixtures with warm LED strips.',
      specs: { Size: '1,800 Sq Ft', Duration: '6 Weeks', 'Remodel Type': 'Full Interior Refit', 'Key Materials': 'Gypsum Boards, LED fixtures, Large format Tiles' },
      gallery: [
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=80'
      ]
    },
    { 
      title: 'Modern Villa', 
      location: 'Colombo', 
      category: 'house', 
      image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80', 
      tag: 'Residential',
      description: 'A single-story contemporary villa highlighting seamless indoor-outdoor living boundaries. The design features a private central courtyard pool, high-span sliding aluminum doors, and customized structural masonry columns.',
      specs: { Size: '2,400 Sq Ft', Duration: '8 Months', 'Structure Type': 'Masonry load-bearing', 'Key Materials': 'Exposed Concrete, Safety Glass, Hardwood decking' },
      gallery: [
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1595841696667-55275b706c4f?auto=format&fit=crop&w=800&q=80'
      ]
    },
    { 
      title: 'Mall Showroom', 
      location: 'Negombo', 
      category: 'commercial', 
      image: 'https://images.unsplash.com/photo-1555421689-491a97ff2040?auto=format&fit=crop&w=800&q=80', 
      tag: 'Commercial',
      description: 'Structural expansion and architectural fit-out for a clothing franchise store inside a busy commercial complex. Includes heavy metal mezzanine floors, load testing, custom shelving, and modern display fixtures.',
      specs: { Size: '4,000 Sq Ft', Duration: '3 Months', 'Fit-out Type': 'Commercial Shell Fit-out', 'Key Materials': 'Mezzanine Steel, Powder-coated Aluminum, Tempered Glass' },
      gallery: [
        'https://images.unsplash.com/photo-1555421689-491a97ff2040?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80'
      ]
    },
    { 
      title: 'Home Expansion', 
      location: 'Gampaha', 
      category: 'renovation', 
      image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80', 
      tag: 'Renovation',
      description: 'Adding a secondary unit story to an existing residential building. Conducted load calculations on historical columns, cast concrete floor spans, reinforced foundations, and added a customized steel staircase.',
      specs: { Size: '1,200 Sq Ft (Added)', Duration: '3 Months', 'Extension Type': 'Second Story Addition', 'Key Materials': 'Reinforcement bars, Ready-mix concrete, Iron staircase' },
      gallery: [
        'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=800&q=80'
      ]
    }
  ];

  const filteredProjects = activeFilter === 'all' 
    ? projects 
    : projects.filter(p => p.category === activeFilter);

  const handleEstimateClick = () => {
    const user = localStorage.getItem('rcms_user');
    if (user) {
      navigate('/customer');
    } else {
      navigate('/login?redirect=estimate');
    }
  };

  const handleRequestPlan = (planId) => {
    const user = localStorage.getItem('rcms_user');
    if (user) {
      navigate(`/customer?plan=${planId}`);
    } else {
      navigate(`/login?redirect=plan&id=${planId}`);
    }
  };

  const handleWhatsAppSubmit = (e) => {
    e.preventDefault();
    if (!contactName || !contactMessage) return;
    const text = encodeURIComponent(`Hi Rohana Construction, I am ${contactName}. ${contactMessage}`);
    window.open(`https://wa.me/94769117398?text=${text}`, '_blank');
  };

  return (
    <div className="relative pt-20">
      {/* Hero Section */}
      <section className="relative bg-slate-950 text-white overflow-hidden py-32 md:py-48 flex items-center justify-center">
        {/* Background Image Overlay */}
        <div className="absolute inset-0 opacity-25">
          <img 
            src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1920&q=80" 
            alt="Construction Background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 z-10">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight uppercase">
            Build Your <span className="text-amber-500">Dream Home</span> With Us
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-300 font-medium">
            We provide reliable construction services with experienced engineers and skilled workers. From concept drawing to structural painting, we handle it all.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={handleEstimateClick}
              className="w-full sm:w-auto bg-amber-500 text-slate-950 px-8 py-4 rounded-xl font-bold text-base hover:bg-amber-400 hover:scale-105 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              Get Free Estimate
            </button>
            <a 
              href="#projects"
              className="w-full sm:w-auto border border-slate-600 bg-slate-900/50 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-bold text-base hover:bg-slate-800 transition-all hover:scale-105 cursor-pointer text-center"
            >
              View Projects
            </a>
          </div>
        </div>
      </section>

      {/* Counters Section */}
      <section className="bg-slate-900 text-white border-y border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-1">
              <span className="block text-4xl md:text-5xl font-black text-amber-500">15+</span>
              <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">Years Experience</span>
            </div>
            <div className="space-y-1">
              <span className="block text-4xl md:text-5xl font-black text-amber-500">250+</span>
              <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">Completed Projects</span>
            </div>
            <div className="space-y-1">
              <span className="block text-4xl md:text-5xl font-black text-amber-500">50+</span>
              <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">Skilled Employees</span>
            </div>
            <div className="space-y-1">
              <span className="block text-4xl md:text-5xl font-black text-amber-500">100%</span>
              <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">Customer Satisfaction</span>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <span className="text-xs uppercase tracking-widest font-extrabold text-amber-600 bg-amber-500/10 px-3 py-1 rounded-full">
              What We Do
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">
              Our Professional Services
            </h2>
            <p className="max-w-xl mx-auto text-sm text-slate-500">
              Reliable, professional builders supporting residential design, commercial setups, remodeling, and electrical wiring.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((srv, idx) => (
              <div 
                key={idx} 
                onClick={() => handleServiceClick(srv)}
                className="bg-white p-8 rounded-2xl border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all group duration-300 cursor-pointer"
              >
                <div className={`p-4 rounded-xl w-fit ${srv.color} mb-6 transition-transform group-hover:scale-110`}>
                  <srv.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-amber-500 transition-colors">{srv.name}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{srv.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
            <div className="space-y-4">
              <span className="text-xs uppercase tracking-widest font-extrabold text-amber-600 bg-amber-500/10 px-3 py-1 rounded-full">
                Our Work
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">
                Recent Completed Projects
              </h2>
            </div>
            
            {/* Project Filters */}
            <div className="flex flex-wrap gap-2">
              {['all', 'house', 'commercial', 'renovation'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all cursor-pointer ${
                    activeFilter === filter
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {filter}s
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((proj, idx) => (
              <div 
                key={idx} 
                onClick={() => handleProjectClick(proj)}
                className="group relative overflow-hidden rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer hover:border-amber-500/50"
              >
                <div className="h-64 overflow-hidden relative">
                  <img 
                    src={proj.image} 
                    alt={proj.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-sm text-amber-500 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded">
                    {proj.tag}
                  </div>
                </div>
                <div className="p-6 bg-white flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{proj.title}</h3>
                    <span className="text-xs text-slate-500">{proj.location}</span>
                  </div>
                  <div className="text-xs font-bold text-amber-605 hover:text-amber-500 transition-colors">
                    View Details
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* House Plans Section */}
      <section id="plans" className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <span className="text-xs uppercase tracking-widest font-extrabold text-amber-600 bg-amber-500/10 px-3 py-1 rounded-full">
              Ready Designs
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">
              Browse House Design Plans
            </h2>
            <p className="max-w-xl mx-auto text-sm text-slate-500">
              Select one of our architectural blueprints to start. You can request cost estimation and custom modifications.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {housePlans.map((plan) => (
              <div key={plan.id} className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all">
                <div className="h-56 relative overflow-hidden">
                  <img src={plan.image_url} alt={plan.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-6 space-y-4">
                  <h3 className="font-bold text-slate-900 text-lg">{plan.title}</h3>
                  <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">{plan.description}</p>
                  
                  <div className="grid grid-cols-3 gap-2 border-y border-slate-100 py-3 text-center text-xs text-slate-600">
                    <div>
                      <span className="block font-bold text-slate-900">{plan.bedrooms}</span>
                      Bedrooms
                    </div>
                    <div>
                      <span className="block font-bold text-slate-900">{plan.bathrooms}</span>
                      Bathrooms
                    </div>
                    <div>
                      <span className="block font-bold text-slate-900">{plan.floors}</span>
                      {plan.floors > 1 ? 'Floors' : 'Floor'}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Rough Price</span>
                      <span className="font-bold text-emerald-600 text-base">LKR {(plan.price_estimate/1000000).toFixed(1)}M</span>
                    </div>
                    <button
                      onClick={() => handleRequestPlan(plan.id)}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Request Plan
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact & WhatsApp Section */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            
            {/* Quick Contact Info */}
            <div className="space-y-6">
              <h2 className="text-3xl font-extrabold text-slate-900 leading-tight">
                Let's Discuss <br />Your Future Construction
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Contact our customer relationship office via WhatsApp or call us directly. You can request a quote, schedule a site inspection, or get details on build timelines.
              </p>
              
              <div className="flex items-center space-x-4">
                <a 
                  href="tel:0769117398" 
                  className="flex items-center space-x-3 bg-slate-900 text-white px-5 py-3 rounded-xl hover:bg-slate-800 transition-colors text-sm font-semibold"
                >
                  <Phone className="h-4 w-4 text-amber-500" />
                  <span>Call 076 911 73 98</span>
                </a>
              </div>
            </div>

            {/* Quick WhatsApp Inquiry Form */}
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center space-x-3 text-emerald-600">
                <MessageSquare className="h-6 w-6" />
                <span className="font-bold text-sm uppercase tracking-wider">Fast WhatsApp Connect</span>
              </div>
              
              <form onSubmit={handleWhatsAppSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Your Name</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors text-slate-800"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Message</label>
                  <textarea
                    required
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    rows={4}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors text-slate-800 resize-none"
                    placeholder="Describe your construction plan (e.g. Single Story, Colombo, 1500 sqft)"
                  ></textarea>
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-emerald-600/10 cursor-pointer flex items-center justify-center space-x-2 text-sm"
                >
                  <span>Send WhatsApp Message</span>
                </button>
              </form>
            </div>

          </div>
        </div>
      </section>

      {/* Project Details Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-6">
          <div className="bg-white rounded-3xl overflow-hidden max-w-4xl w-full shadow-2xl relative border border-slate-100 flex flex-col md:flex-row max-h-[90vh] md:max-h-[85vh]">
            
            {/* Close Button */}
            <button 
              onClick={() => setSelectedProject(null)}
              className="absolute top-4 right-4 z-20 bg-slate-900/60 backdrop-blur-sm hover:bg-slate-900 text-white rounded-full p-2.5 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Left Column: Photos Gallery */}
            <div className="w-full md:w-1/2 bg-slate-950 flex flex-col justify-between p-4 relative min-h-[300px] md:min-h-[450px]">
              
              {/* Main Active Photo */}
              <div className="flex-1 flex items-center justify-center overflow-hidden rounded-xl bg-slate-900 relative">
                <img 
                  src={selectedProject.gallery[activePhotoIdx]} 
                  alt={`${selectedProject.title} stage`} 
                  className="max-h-full max-w-full object-contain"
                />

                {/* Left/Right Slideshow navigation buttons */}
                {selectedProject.gallery.length > 1 && (
                  <>
                    <button 
                      onClick={prevPhoto}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-sm transition-all cursor-pointer"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={nextPhoto}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-sm transition-all cursor-pointer"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Gallery Thumbnails List */}
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1 justify-center">
                {selectedProject.gallery.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePhotoIdx(idx)}
                    className={`h-12 w-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                      activePhotoIdx === idx ? 'border-amber-500 scale-105' : 'border-slate-800 opacity-60'
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Project details */}
            <div className="w-full md:w-1/2 p-6 md:p-8 overflow-y-auto flex flex-col space-y-6">
              <div className="space-y-2">
                <span className="bg-amber-500/10 text-amber-600 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded">
                  {selectedProject.tag}
                </span>
                <h3 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">{selectedProject.title}</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{selectedProject.location}, Sri Lanka</p>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                {selectedProject.description}
              </p>

              {/* Specs List */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Technical Specifications</h4>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  {Object.entries(selectedProject.specs).map(([key, val]) => (
                    <div key={key} className="flex justify-between py-1.5 border-b border-slate-50 last:border-0">
                      <span className="text-slate-400 font-medium">{key}</span>
                      <span className="font-bold text-slate-800 text-right">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Service Details Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-6">
          <div className="bg-white rounded-3xl overflow-hidden max-w-4xl w-full shadow-2xl relative border border-slate-100 flex flex-col md:flex-row max-h-[90vh] md:max-h-[85vh]">
            
            {/* Close Button */}
            <button 
              onClick={() => setSelectedService(null)}
              className="absolute top-4 right-4 z-20 bg-slate-900/60 backdrop-blur-sm hover:bg-slate-900 text-white rounded-full p-2.5 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Left Column: Photos Gallery */}
            <div className="w-full md:w-1/2 bg-slate-950 flex flex-col justify-between p-4 relative min-h-[300px] md:min-h-[450px]">
              
              {/* Main Active Photo */}
              <div className="flex-1 flex items-center justify-center overflow-hidden rounded-xl bg-slate-900 relative">
                <img 
                  src={selectedService.gallery[activeServicePhotoIdx]} 
                  alt={`${selectedService.name} gallery`} 
                  className="max-h-full max-w-full object-contain"
                />

                {/* Left/Right Slideshow navigation buttons */}
                {selectedService.gallery.length > 1 && (
                  <>
                    <button 
                      onClick={prevServicePhoto}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-sm transition-all cursor-pointer"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={nextServicePhoto}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-sm transition-all cursor-pointer"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Gallery Thumbnails List */}
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1 justify-center">
                {selectedService.gallery.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveServicePhotoIdx(idx)}
                    className={`h-12 w-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                      activeServicePhotoIdx === idx ? 'border-amber-500 scale-105' : 'border-slate-800 opacity-60'
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Service details */}
            <div className="w-full md:w-1/2 p-6 md:p-8 overflow-y-auto flex flex-col justify-between">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className={`p-1.5 rounded-lg ${selectedService.color}`}>
                      <selectedService.icon className="h-4 w-4" />
                    </div>
                    <span className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">
                      Our Specialization
                    </span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">{selectedService.name}</h3>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  {selectedService.description}
                </p>

                {/* Specs List */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Technical Standards</h4>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    {Object.entries(selectedService.specs).map(([key, val]) => (
                      <div key={key} className="flex justify-between py-1.5 border-b border-slate-55 last:border-0">
                        <span className="text-slate-400 font-medium">{key}</span>
                        <span className="font-bold text-slate-800 text-right">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Redirect Call-To-Action */}
              <div className="pt-6 border-t border-slate-100 mt-6 space-y-3">
                <button
                  onClick={() => {
                    const user = localStorage.getItem('rcms_user');
                    const serviceName = encodeURIComponent(selectedService.name);
                    setSelectedService(null);
                    if (user) {
                      navigate(`/customer?tab=estimator&service=${serviceName}`);
                    } else {
                      navigate(`/login?redirect=service&service=${serviceName}`);
                    }
                  }}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3.5 rounded-xl transition-all shadow-md shadow-amber-500/20 cursor-pointer text-center text-sm"
                >
                  Get Cost Estimate for {selectedService.name}
                </button>
                <button
                  onClick={() => {
                    const user = localStorage.getItem('rcms_user');
                    setSelectedService(null);
                    if (user) {
                      navigate('/customer?tab=messages');
                    } else {
                      navigate('/login?redirect=messages');
                    }
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-all cursor-pointer text-center text-xs border border-slate-700"
                >
                  Contact Us / Ask a Question
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
