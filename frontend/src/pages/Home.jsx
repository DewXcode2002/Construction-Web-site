import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home as HouseIcon, Building2, Hammer, Ruler, HardHat, Bolt, Zap, 
  Droplets, Paintbrush, Trees, Phone, MessageSquare, X, ChevronLeft, 
  ChevronRight, ShieldCheck, CheckCircle2, Award, Sparkles, PhoneCall,
  Grid, Layers, LayoutGrid, Wrench, Send, Clock, MapPin, UploadCloud, Calculator,
  CreditCard, CheckCircle, DollarSign, FileText, Building, Users
} from 'lucide-react';
import API_URL from '../config';
import { useLanguage } from '../context/LanguageContext';
import BackButton from '../components/BackButton';
import Footer from '../components/Footer';

export default function Home() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Interactive Live Calculator State
  const [calcInputMode, setCalcInputMode] = useState('perches'); // 'perches' or 'sqft'
  const [calcPerches, setCalcPerches] = useState(10);
  const [calcSqft, setCalcSqft] = useState(1500);
  const [calcStories, setCalcStories] = useState(1);
  const [calcQuality, setCalcQuality] = useState('high');

  const [activeFilter, setActiveFilter] = useState('all');
  const [housePlans, setHousePlans] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [propertiesForSale, setPropertiesForSale] = useState([]);
  const [selectedPropertyModal, setSelectedPropertyModal] = useState(null);
  const [activePropertyPhotoIdx, setActivePropertyPhotoIdx] = useState(0);

  // Property Marketplace Search & Filter State
  const [propSearchTerm, setPropSearchTerm] = useState('');
  const [propStatusFilter, setPropStatusFilter] = useState('all');

  const [contactName, setContactName] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  const [selectedService, setSelectedService] = useState(null);
  const [activeServicePhotoIdx, setActiveServicePhotoIdx] = useState(0);
  const [modalQualityTier, setModalQualityTier] = useState('high'); // 'high', 'medium', 'customize'
  const [uploadedPlanFile, setUploadedPlanFile] = useState(null);

  // Request to Estimate & Payment Modal State
  const [isRequestEstimateOpen, setIsRequestEstimateOpen] = useState(false);
  const [estimateForm, setEstimateForm] = useState({
    name: '',
    phone: '',
    location: '',
    landSize: 10,
    houseStories: 'single',
    paymentMethod: 'card', // 'card', 'bank_transfer', 'cash'
    cardName: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    bankRef: '',
    bankSlipName: '',
    bankSlipFile: null,
    notes: ''
  });
  const [isSubmittingEstimate, setIsSubmittingEstimate] = useState(false);
  const [estimateSuccess, setEstimateSuccess] = useState(null);
  const [estimateError, setEstimateError] = useState('');

  // Direct Inquiry Modal State
  const [directInquiryService, setDirectInquiryService] = useState(null);
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    phone: '',
    location: '',
    details: '',
    contactTime: 'Morning (8AM - 12PM)'
  });
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [inquiryError, setInquiryError] = useState('');

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

    fetch(`${API_URL}/api/showcase-projects`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setProjectsList(data);
        }
      })
      .catch(err => console.error('Error fetching showcase projects:', err));

    fetch(`${API_URL}/api/properties-for-sale`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPropertiesForSale(data);
        }
      })
      .catch(err => console.error('Error fetching properties for sale:', err));
  }, []);

  const handleOpenDirectInquiry = (srv, e) => {
    if (e) e.stopPropagation();
    setDirectInquiryService(srv);
    setInquiryForm({
      name: '',
      phone: '',
      location: '',
      details: '',
      contactTime: 'Morning (8AM - 12PM)'
    });
    setInquirySuccess(false);
    setInquiryError('');
  };

  const handleDirectInquirySubmit = async (e) => {
    e.preventDefault();
    if (!inquiryForm.name || !inquiryForm.phone) {
      setInquiryError('Please provide your name and phone number.');
      return;
    }
    setIsSubmittingInquiry(true);
    setInquiryError('');

    try {
      const res = await fetch(`${API_URL}/api/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: inquiryForm.name,
          phone: inquiryForm.phone,
          location: inquiryForm.location,
          service_type: directInquiryService ? directInquiryService.name : 'General Inquiry',
          details: inquiryForm.details,
          contact_time: inquiryForm.contactTime
        })
      });
      const data = await res.json();
      if (res.ok) {
        setInquirySuccess(true);
      } else {
        setInquiryError(data.message || 'Failed to submit inquiry.');
      }
    } catch (err) {
      setInquiryError('Network error. Please try calling us directly.');
    } finally {
      setIsSubmittingInquiry(false);
    }
  };

  const handleOpenRequestEstimate = () => {
    setSelectedService(null);
    setIsRequestEstimateOpen(true);
    setEstimateSuccess(null);
    setEstimateError('');
  };

  const handleEstimateRequestSubmit = async (e) => {
    e.preventDefault();
    if (!estimateForm.name || !estimateForm.phone) {
      setEstimateError('Please fill in your name and phone number.');
      return;
    }
    if (estimateForm.paymentMethod === 'card' && (!estimateForm.cardNumber || !estimateForm.cardName)) {
      setEstimateError('Please complete your credit/debit card payment details.');
      return;
    }

    setIsSubmittingEstimate(true);
    setEstimateError('');

    try {
      const refNo = 'RC-EST-' + Math.floor(100000 + Math.random() * 900000);
      const bankSlipInfo = estimateForm.bankSlipName ? ` [Slip attached: ${estimateForm.bankSlipName}]` : '';
      const paymentSummary = estimateForm.paymentMethod === 'card'
        ? `Card Payment (Visa/Mastercard ending ${estimateForm.cardNumber.slice(-4) || '8912'})`
        : estimateForm.paymentMethod === 'bank_transfer'
        ? `Bank Transfer (Ref: ${estimateForm.bankRef || 'BOC Deposit'})${bankSlipInfo}`
        : `Cash Payment at Office/Site${bankSlipInfo}`;

      const detailsStr = `Official Estimate Request (${refNo}) | House Stories: ${estimateForm.houseStories} | Land: ${estimateForm.landSize} Perches | Quality Tier: ${modalQualityTier.toUpperCase()} | Attached Plan: ${uploadedPlanFile || 'Pending Blueprint Upload'} | Payment Method: ${paymentSummary} (LKR 1,500.00 Processing Fee Paid)`;

      const res = await fetch(`${API_URL}/api/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: estimateForm.name,
          phone: estimateForm.phone,
          location: estimateForm.location,
          service_type: 'Residential Construction (Estimate Request)',
          details: detailsStr,
          contact_time: 'Urgent Estimate Callback'
        })
      });

      const data = await res.json();
      if (res.ok) {
        setEstimateSuccess({
          refNo,
          amount: 'LKR 1,500.00',
          method: paymentSummary,
          tier: modalQualityTier.toUpperCase(),
          stories: estimateForm.houseStories
        });
      } else {
        setEstimateError(data.message || 'Failed to submit estimate request.');
      }
    } catch (err) {
      setEstimateError('Network error. Please try again or call 076 911 73 98.');
    } finally {
      setIsSubmittingEstimate(false);
    }
  };

  const services = [
    { 
      name: 'Residential Construction', 
      desc: 'Turnkey home building (Single, 2 & 3-Story). Upload your house plan for official engineer estimation.', 
      icon: HouseIcon, 
      color: 'bg-amber-500/10 text-amber-600',
      isFlagship: true,
      description: 'Our primary core expertise: Complete turnkey residential house construction across Sri Lanka. If you have an existing House Plan drawing, upload your blueprint to receive an official detailed cost estimate from our structural engineers (a small processing payment applies for official estimate drafting). Construction costs are determined by house stories (Single Story, 2-Story, 3-Story, etc.) and your selected material quality tier (High Quality Premium vs Medium Grade for tiles, bathware, timber species, electrical fittings, and roofing). Contact us directly to discuss site execution!',
      specs: { 
        "Primary Focus": "Flagship Core Service (නිවාස ඉදිකිරීම්)",
        "House Levels": "Single-Story, Two-Stories, Three-Stories & Multi-Level",
        "Plan Upload Estimate": "Upload House Plan Blueprint for Engineer Estimate (Processing Fee applies)",
        "Material Quality": "High Quality (Rocell, Teak Wood, Dulux) / Medium Grade Options",
        "Direct Contact": "Call 076 911 73 98 or WhatsApp for direct site discussion"
      },
      gallery: [
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80"
      ]
    },
    { 
      name: 'Electrical Wiring', 
      desc: 'Certified single & three-phase wiring, conduit laying, DB box wiring & system installs.', 
      icon: Bolt, 
      color: 'bg-red-500/10 text-red-600',
      description: 'Certified residential and industrial electrical wiring solutions by Rohana Construction. We configure concealed conduits, distribution boards, smart lighting controls, earthing systems, and CEB/LECO compliant safety setups.',
      specs: { "Wiring Type": "Concealed Single & Three-Phase", "Materials": "Fire-retardant PVC conduits & ACL copper cables", "Safety Checks": "Insulation resistance & earth testing", "Certification": "CEB & LECO standards approval" },
      gallery: [
        "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80",
        "/images/electrical-wiring-outlet.jpg"
      ]
    },
    { 
      name: 'Painting', 
      desc: 'Interior wall putty smoothing, moisture sealing & premium exterior weather-shield coating.', 
      icon: Paintbrush, 
      color: 'bg-pink-500/10 text-pink-600',
      description: 'High-finish wall coating and aesthetic interior/exterior painting services. We apply multi-layer wall putty, moisture-proof sealers, and weather-guard coats to keep your walls vibrant and weather-resistant.',
      specs: { "Layering": "1 Sealer + 2 Putty Coats + 2 Paint Coats", "Paint Brands": "Dulux WeatherShield / Robbialac Permoglaze", "Warranty": "5-Year weather proof coating warranty", "Eco Standard": "Ultra low VOC odourless paint" },
      gallery: [
        "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=1200&q=80",
        "/images/painting-roller-wall.jpg",
        "/images/painting-brush-window.jpg"
      ]
    },
    { 
      name: 'Plumbing', 
      desc: 'High-pressure water supply lines, underground drainage, PPR hot water & sanitary setup.', 
      icon: Droplets, 
      color: 'bg-cyan-500/10 text-cyan-600',
      description: 'Complete plumbing layout routing, high-pressure booster pump installs, leak repairs, and high-end bathroom sanitary fitting setups. Engineered for zero leaks and long term reliability.',
      specs: { "Piping": "Type-1000 PVC & PPR hot/cold lines", "Fittings": "Brass gate valves & stainless steel traps", "Inspections": "24-Hour hydrostatic leak pressure test", "Guarantee": "5-Year leak-free assurance" },
      gallery: [
        "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=1200&q=80",
        "/images/plumbing-pvc-pipes.jpg",
        "/images/plumbing-leak-repair.jpg"
      ]
    },
    { 
      name: 'Carpentry', 
      desc: 'Solid teak doors & windows, modular pantry cupboards, roof wood framing & ceilings.', 
      icon: Hammer, 
      color: 'bg-amber-500/10 text-amber-600',
      description: 'Master carpentry craftsmanship for custom solid teak & mahogany doors, window frames, kitchen pantry counters, timber roof framing, and decorative wooden ceiling installations.',
      specs: { "Wood Types": "Seasoned Teak, Mahogany, Kempas Hardwood", "Roof Framing": "Micro-treated timber framework", "Pantry Setup": "Soft-close modular kitchen cabinets", "Treatment": "100% Anti-termite pressure treatment" },
      gallery: [
        "/images/carpentry-wooden-door.jpg",
        "/images/carpentry-timber-wood.jpg",
        "/images/carpentry-woodworking-tools.jpg"
      ]
    },
    { 
      name: 'Slab Shuttering (Satalin)', 
      desc: 'Heavy marine plywood formwork, TMT steel rod binding & ready-mix concreting.', 
      icon: Layers, 
      color: 'bg-indigo-500/10 text-indigo-600',
      description: 'Professional slab shuttering (Satalin), beam formwork, column shuttering, TMT steel rebar binding, and ready-mix concrete pouring for single & multi-story structures.',
      specs: { "Formwork": "Heavy Marine Plywood & Steel props", "Rebar Steel": "High-yield TMT Fe500 steel bars", "Concrete Grade": "Grade 25 / Grade 30 Ready-Mix", "Curing": "Supervised membrane water curing" },
      gallery: [
        "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80",
        "/images/slab-shuttering-rebar.jpg"
      ]
    },
    { 
      name: 'Tile Work', 
      desc: 'Precision floor & wall tiling, non-slip outdoor tiles, granite tops & marble laying.', 
      icon: LayoutGrid, 
      color: 'bg-emerald-500/10 text-emerald-600',
      description: 'Flawless floor and wall tiling for residential and commercial spaces. We install 2x2ft & 2x4ft porcelain tiles, non-slip car porch tiles, granite kitchen countertops, and polished marble.',
      specs: { "Tile Formats": "2x2 ft, 2x4 ft Porcelain & Granite Slabs", "Adhesive": "Waterproof polymer modified tile mortar", "Leveling": "Laser-level alignment & epoxy grouting", "Finishing": "Beveled edge grinding & stain seal" },
      gallery: [
        "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80",
        "/images/tile-work-marble-floor.jpg",
        "/images/tile-work-pattern-backsplash.jpg"
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
        "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80"
      ]
    }
  ];

  const defaultProjects = [
    { 
      id: 'rohana-single-house-1',
      title: 'Modern Single Story House', 
      location: 'Western Province', 
      category: 'house', 
      isVerified: true,
      image: '/images/rohana-completed-house/house1.jpg', 
      tag: 'Rohana Completed Build',
      description: 'A completed turnkey modern single-story family home engineered and constructed by Rohana Construction. Features custom mahogany-patterned sliding entrance gates, structural white masonry pillars, high-grade roof tiling, a wide paved car porch with non-slip floor tiles, weather-shield exterior paint finish, landscaped front lawn, premium interior marble-pattern floor tiling, custom kitchen pantry counter, arched interior doorways, and solid teak wood main doors with glass window frames.',
      specs: { 
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
      },
      gallery: [
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
      ],
      galleryCaptions: [
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
      ]
    },
    { 
      id: 'rohana-3story-piliyandala-1',
      title: 'Luxury 3-Story Modern Residence', 
      location: 'Piliyandala Town', 
      category: 'house', 
      isVerified: true,
      image: '/images/rohana-piliyandala-house/piliyandala1.jpg', 
      tag: 'Rohana Completed Build',
      description: 'A grand 3-story luxury contemporary residence engineered and constructed turnkey by Rohana Construction in Piliyandala Town. Highlights vaulted exposed timber under-roof ceiling structures, custom floating hardwood staircases with modern black steel wire tension balustrades, polished marble porcelain floor tiling, mahogany kitchen pantry cabinets with black granite countertops, open rooftop terrace deck with wood-texture tiles, floor-to-ceiling louvered glass window panels for natural daylighting, automated motorized roller shutter garage, and upper floor balcony.',
      specs: { 
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
      },
      gallery: [
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
      ],
      galleryCaptions: [
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
      ]
    },
    { 
      id: 'rohana-3story-modern-2',
      title: 'Contemporary 3-Story Modern Residence', 
      location: 'Western Province', 
      category: 'house', 
      isVerified: true,
      image: '/images/rohana-3story-house-2/house_3s_5.jpg', 
      tag: 'Rohana Completed Build',
      description: 'A newly engineered 3-story contemporary family home constructed turnkey by Rohana Construction. Features a vaulted exposed timber roof ceiling in the top floor lounge, covered rooftop terrace deck paved with non-slip granite-texture outdoor tiles, terracotta brick paved veranda walkways with dark under-eaves timber framing, multi-flight wooden staircases with carved timber banisters & steel motif spindles, upper floor balcony lobbies, solid timber studded entrance doors, mahogany dining pantry wall cabinets, wood pendant light fixtures, high-gloss marble & wood-grain porcelain floor tiling, white exterior finishing with gray masonry boundary walls, custom security entrance gate with wicket door, ambient outdoor wall sconce illumination, steel carport pergola framework, and expansive glass windows with security grills.',
      specs: { 
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
      },
      gallery: [
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
      ],
      galleryCaptions: [
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
      ]
    },
    { 
      id: 'rohana-5story-avissawella-1',
      title: '5-Story Medical & Commercial Complex', 
      location: 'Avissawella Town', 
      category: 'commercial', 
      isVerified: true,
      image: '/images/rohana-avissawella-building/avissawella1.jpg', 
      tag: 'Rohana Completed Commercial',
      description: 'A heavy-duty 5-story commercial medical center constructed turnkey by Rohana Construction for a specialist medical doctor in Avissawella Town (VS Fertility & Women’s Health Care Center). Features spacious open-plan patient waiting lounges with high-gloss porcelain floor tiling, doctor consultation rooms, clinical reception lobbies with teak French doors, staff pantry & refreshment units with mahogany cabinetry and black granite countertops, internal access staircases with non-slip tiled treads, solid teak entrance doors with top louvers, open rooftop terrace deck with steel superstructure for the illuminated billboard tower, weather-shield exterior coating, and reinforced concrete column framing engineered for healthcare facilities.',
      specs: { 
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
      },
      gallery: [
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
      ],
      galleryCaptions: [
        'Front Roadside Elevation: 5-Story Commercial Building & Rooftop Signage Tower',
        'Balcony Walkways: Non-Slip Tiled Outer Corridors & Black Steel Safety Railings',
        'Multi-Tier Balcony Architecture: 5-Level Stepped Concrete Frame & AC Compressor Setup',
        'Side Elevation: Commercial Entrance Bay & VS Fertility Medical Center Billboard',
        'Corner Façade View: Geometric Balcony Design & Heavy Structural Columns across 5 Floors',
        'Upper Stair Landing: Black Steel Safety Balustrades & Access Hallway',
        'Teak Entrance Doors: Custom Teak Frame Glass Paned Doors & Top Louver Vents',
        'Elevated Balcony View: Upper Floor Corridor Railings overlooking Avissawella Town',
        'Main Internal Staircase: Non-Slip Tiled Treads, Black Steel Balustrades & Lobby Space',
        'Rooftop Terrace Deck: Open Outdoor Deck & VS Fertility Center Billboard Steel Superstructure',
        'Patient Waiting Lounge: Open-Plan Clinical Floor, High-Gloss Porcelain Tiling & Teak Windows',
        'Doctor’s Consultation Room: Polished Porcelain Tiling & Teak Window View to Staircase Landing',
        'Clinical Hall Floor: Structural Load-Bearing Columns, Ceiling Fans & Teak Glass Windows',
        'Clinical Reception Lobby: Polished Floor & Teak French Doors to Outdoor Balcony',
        'Internal Clinical Corridor: Multiple Solid Teak Doors to Consultation Chambers',
        'Doctor’s Private Chamber: Matte Floor Tiling & Teak Window View to Stair Landing',
        'Medical Staff Pantry: Custom Mahogany Wall & Base Cabinets with Black Granite Countertop'
      ]
    }
  ];

  const displayProjects = projectsList.length > 0 ? projectsList : defaultProjects;

  const filteredProjects = activeFilter === 'all' 
    ? displayProjects 
    : displayProjects.filter(p => p.category === activeFilter);

  const handleEstimateClick = () => {
    handleOpenDirectInquiry({ name: 'Free Construction Cost Estimate / පිරිවැය ගණන් හැදීම' });
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
              <span className="block text-4xl md:text-5xl font-black text-amber-500">25+</span>
              <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">Years Experience</span>
            </div>
            <div className="space-y-1">
              <span className="block text-4xl md:text-5xl font-black text-amber-500">100+</span>
              <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">Completed Projects</span>
            </div>
            <div className="space-y-1 flex flex-col items-center justify-center">
              <div className="h-10 md:h-12 flex items-center justify-center">
                <Users className="w-10 h-10 text-amber-500" />
              </div>
              <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">Skilled Employees</span>
            </div>
            <div className="space-y-1">
              <span className="block text-4xl md:text-5xl font-black text-amber-500">100%</span>
              <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">Customer Satisfaction</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Live Cost Calculator Section */}
      <section id="calculator" className="py-20 bg-slate-900 text-white border-b border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center space-y-3 mb-12">
            <span className="text-xs uppercase tracking-widest font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5">
              <Calculator className="h-4 w-4" /> {t.calcTitle}
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold uppercase text-white">
              Instant Construction Budget Estimator
            </h2>
            <p className="max-w-xl mx-auto text-sm text-slate-400">
              {t.calcSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-slate-950/80 backdrop-blur-xl border border-slate-800 p-6 md:p-10 rounded-3xl shadow-2xl">
            
            {/* Sliders & Controls Column */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* Control 1: Land Extent (Perches) */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-slate-300 uppercase tracking-wide">{t.landSize}</span>
                  <span className="text-amber-400 text-base font-black bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-xl">
                    {calcPerches} Perches Land
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={40}
                  step={1}
                  value={calcPerches}
                  onChange={(e) => setCalcPerches(parseInt(e.target.value))}
                  className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[10px] font-bold text-slate-500">
                  <span>5 Perches (Small Plot)</span>
                  <span>20 Perches (Medium Plot)</span>
                  <span>40 Perches (Large Estate)</span>
                </div>
              </div>

              {/* Control 2: Independent House Built Area (SqFt) */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-slate-300 uppercase tracking-wide">{t.customSqftLabel}</span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min={400}
                      max={8000}
                      step={50}
                      value={calcSqft}
                      onChange={(e) => setCalcSqft(Math.max(400, parseInt(e.target.value) || 400))}
                      className="w-28 bg-slate-900 border border-amber-500/40 text-amber-400 text-base font-black px-3 py-1 rounded-xl text-center focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-xs text-amber-400 font-bold">SqFt</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={500}
                  max={6000}
                  step={50}
                  value={calcSqft}
                  onChange={(e) => setCalcSqft(parseInt(e.target.value))}
                  className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[10px] font-bold text-slate-500">
                  <span>500 SqFt (Compact)</span>
                  <span>2,000 SqFt (Family Home)</span>
                  <span>6,000 SqFt (Luxury Villa)</span>
                </div>
              </div>

              {/* Stories Selector */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide">
                  {t.houseStories}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { num: 1, label: 'Single Story (1 Floor)' },
                    { num: 2, label: 'Two Stories (2 Floors)' },
                    { num: 3, label: 'Three Stories (3 Floors)' }
                  ].map((s) => (
                    <button
                      key={s.num}
                      type="button"
                      onClick={() => setCalcStories(s.num)}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                        calcStories === s.num
                          ? 'bg-amber-500 text-slate-950 border-amber-500 ring-2 ring-amber-500/30 shadow-lg'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality Tier Selector */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide">
                  {t.qualityTier}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCalcQuality('high')}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      calcQuality === 'high'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-400 ring-1 ring-amber-500/30'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="block text-sm font-black text-white">⭐ High Quality Tier</span>
                    <span className="block text-[11px] text-slate-400 mt-1">{t.highQuality}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalcQuality('medium')}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      calcQuality === 'medium'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-400 ring-1 ring-amber-500/30'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="block text-sm font-black text-white">🏗️ Medium Grade Tier</span>
                    <span className="block text-[11px] text-slate-400 mt-1">{t.mediumQuality}</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Live Output Summary Column */}
            {(() => {
              const activeBuiltSqft = calcSqft * (calcStories === 1 ? 1 : calcStories === 2 ? 1.8 : 2.5);
              
              const ratePerSqft = calcQuality === 'high' ? 7500 : 5800;
              const calcTotalCost = Math.round(activeBuiltSqft * ratePerSqft);
              const calcStructCost = Math.round(calcTotalCost * 0.55);
              const calcFinishCost = Math.round(calcTotalCost * 0.45);
              
              const calcWeeks = Math.round(14 + (activeBuiltSqft / 120) + ((calcStories - 1) * 6));
              const calcMonths = (calcWeeks / 4.33).toFixed(1);

              return (
                <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl space-y-6">
                  
                  {/* Competitive Price Badge */}
                  <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-[10px] font-extrabold text-emerald-400 flex items-center space-x-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>{t.calcCompetitiveBadge}</span>
                  </div>

                  <div className="space-y-1 border-b border-slate-800 pb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Live Breakdown</span>
                    <div className="text-3xl md:text-4xl font-black text-emerald-400">
                      LKR {calcTotalCost.toLocaleString('en-US')}
                    </div>
                    <span className="text-xs text-slate-400">{t.estimatedTotal} ({calcSqft} SqFt on {calcPerches} Perches)</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">{t.structuralCost} (55%)</span>
                      <span className="font-bold text-slate-200">
                        LKR {calcStructCost.toLocaleString('en-US')}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">{t.finishCost} (45%)</span>
                      <span className="font-bold text-slate-200">
                        LKR {calcFinishCost.toLocaleString('en-US')}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60 items-center">
                      <span className="text-slate-400">{t.estimatedDuration}</span>
                      <span className="font-bold text-amber-400">
                        {calcWeeks} {t.weeks} (~{calcMonths} Months)
                      </span>
                    </div>
                  </div>

                  {/* Disclaimer Notice Box */}
                  <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-[11px] text-amber-300 leading-relaxed">
                    {t.calcDisclaimer}
                  </div>

                  <button
                    onClick={() => handleOpenDirectInquiry({ name: `Official Engineer Verification (${calcSqft} SqFt / ${calcPerches} Perches / ${calcStories} Story / ${calcQuality} Quality)` })}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <PhoneCall className="h-4 w-4" />
                    <span>{t.requestEngineer}</span>
                  </button>
                </div>
              );
            })()}

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
                className="bg-white p-7 rounded-2xl border border-slate-200/80 hover:shadow-xl hover:-translate-y-1 transition-all group duration-300 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className={`p-3.5 rounded-xl ${srv.color} transition-transform group-hover:scale-110 shadow-sm`}>
                      <srv.icon className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                      Professional Service
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 mb-2.5 group-hover:text-amber-600 transition-colors">{srv.name}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-6 font-normal">{srv.desc}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={(e) => handleOpenDirectInquiry(srv, e)}
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 px-3 rounded-xl text-xs transition-all flex items-center justify-center space-x-1.5 shadow-sm shadow-amber-500/20 cursor-pointer"
                  >
                    <PhoneCall className="h-3.5 w-3.5" />
                    <span>Direct Contact</span>
                  </button>
                  <button
                    onClick={() => handleServiceClick(srv)}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-3 rounded-xl text-xs transition-all cursor-pointer text-center"
                  >
                    View Specs
                  </button>
                </div>
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
              <span className="text-xs uppercase tracking-widest font-extrabold text-amber-600 bg-amber-500/10 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
                <Sparkles className="h-3.5 w-3.5" /> Our Completed Work
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">
                Recent Completed Projects
              </h2>
              <p className="text-sm text-slate-500 max-w-xl">
                Explore real completed builds by Rohana Construction. We deliver high-quality craftsmanship, structural integrity, and 100% customer satisfaction.
              </p>
            </div>
            
            {/* Project Filters */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'All Builds' },
                { id: 'house', label: 'Residential Houses' },
                { id: 'commercial', label: 'Commercial Complexes' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveFilter(cat.id)}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all cursor-pointer ${
                    activeFilter === cat.id
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((proj, idx) => (
              <div 
                key={idx} 
                onClick={() => handleProjectClick(proj)}
                className={`group relative overflow-hidden rounded-2xl border shadow-sm hover:shadow-xl transition-all cursor-pointer ${
                  proj.isVerified 
                    ? 'border-amber-500/50 ring-2 ring-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent hover:border-amber-500' 
                    : 'border-slate-100 hover:border-amber-500/50 bg-white'
                }`}
              >
                <div className="h-64 overflow-hidden relative">
                  <img 
                    src={proj.image} 
                    alt={proj.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-sm text-amber-500 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded flex items-center gap-1.5 shadow-md">
                    {proj.isVerified && <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />}
                    {proj.tag}
                  </div>
                  {proj.isVerified && (
                    <div className="absolute top-4 right-4 bg-emerald-600 text-white text-[9px] font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Real Build
                    </div>
                  )}
                </div>
                <div className="p-6 bg-white flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg group-hover:text-amber-600 transition-colors flex items-center gap-1.5">
                      {proj.title}
                    </h3>
                    <span className="text-xs text-slate-500">{proj.location}</span>
                  </div>
                  <div className="text-xs font-bold text-amber-600 hover:text-amber-500 transition-colors bg-amber-500/10 px-3 py-1.5 rounded-lg">
                    View Photos
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
          <div className="text-center space-y-4 mb-12">
            <span className="text-xs uppercase tracking-widest font-extrabold text-amber-600 bg-amber-500/10 px-3 py-1 rounded-full">
              Architectural & House Plans
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">
              Custom House Plan Drawing Service
            </h2>
            <p className="max-w-2xl mx-auto text-sm text-slate-500">
              Our experienced draftsmen and structural engineers create tailored 2D blueprints, municipal council approval drawings, and 3D architectural walkthroughs directly for your plot of land.
            </p>
          </div>

          {/* Direct Custom House Plan Drawing Panel */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 p-8 md:p-12 rounded-3xl text-white shadow-2xl border border-slate-800 space-y-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border-b border-slate-800 pb-8">
              <div className="space-y-3 max-w-3xl">
                <span className="bg-amber-500 text-slate-950 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                  Direct Architectural Contact
                </span>
                <h3 className="text-2xl md:text-4xl font-black text-white">Get a Custom House Plan Drawn for Your Land</h3>
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                  Have specific ideas or land dimensions for your new house? Contact our engineering team directly to discuss your layout requirements, land boundaries, budget, and structural needs.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <a
                  href="tel:+94769117398"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-5 py-3.5 rounded-xl text-xs flex items-center space-x-2 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  <Phone className="h-4 w-4" />
                  <span>Call 076 911 73 98</span>
                </a>
                <a
                  href={`https://wa.me/94769117398?text=${encodeURIComponent("Hello Rohana Construction, I would like to inquire about drawing a custom house plan for my land.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-5 py-3.5 rounded-xl text-xs flex items-center space-x-2 transition-all shadow-lg cursor-pointer"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>WhatsApp Inquiry</span>
                </a>
                <button
                  onClick={(e) => handleOpenDirectInquiry({ name: 'Custom Architectural House Design' }, e)}
                  className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-extrabold px-5 py-3.5 rounded-xl text-xs flex items-center space-x-2 transition-all cursor-pointer"
                >
                  <PhoneCall className="h-4 w-4 text-amber-400" />
                  <span>Submit Inquiry</span>
                </button>
              </div>
            </div>

            {/* Key Deliverables Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 pt-2">
              <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-2">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                  <Ruler className="h-5 w-5" />
                </div>
                <h4 className="font-extrabold text-sm text-white">2D Blueprints</h4>
                <p className="text-[11px] text-slate-400 leading-normal">Detailed structural & architectural floor plans, elevations & section cuts.</p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h4 className="font-extrabold text-sm text-white">Council Approvals</h4>
                <p className="text-[11px] text-slate-400 leading-normal">Guaranteed municipal council & local authority approval drawing formats.</p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-2">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h4 className="font-extrabold text-sm text-white">3D Walkthroughs</h4>
                <p className="text-[11px] text-slate-400 leading-normal">High-resolution 3D interior & exterior realistic walkthrough animations.</p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-2">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                  <Bolt className="h-5 w-5" />
                </div>
                <h4 className="font-extrabold text-sm text-white">MEP Diagrams</h4>
                <p className="text-[11px] text-slate-400 leading-normal">Complete mechanical, electrical wiring & plumbing system drawings.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================== HOUSES & PROPERTIES FOR SALE SECTION ====================== */}
      <section id="for-sale" className="py-24 bg-slate-900 text-white relative overflow-hidden border-t border-slate-800">
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 blur-[140px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/30 px-4 py-1.5 rounded-full">
              <HouseIcon className="h-4 w-4 text-amber-500" />
              <span className="text-amber-500 font-extrabold text-xs uppercase tracking-widest">
                Ready Built Homes Marketplace
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white uppercase">
              Houses & Properties <span className="text-amber-500">For Sale</span>
            </h2>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed">
              Explore turnkey modern residences and properties engineered and built by Rohana Construction, available for immediate purchase.
            </p>
          </div>

          {/* Search & Filter Controls Bar */}
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 max-w-4xl mx-auto shadow-lg">
            <div className="relative w-full md:w-1/2">
              <input
                type="text"
                value={propSearchTerm}
                onChange={(e) => setPropSearchTerm(e.target.value)}
                placeholder="Search location or keyword (e.g. Matara, Piliyandala)..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
              {propSearchTerm && (
                <button
                  onClick={() => setPropSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 justify-center">
              {[
                { id: 'all', label: 'All Properties' },
                { id: 'available', label: 'Available' },
                { id: 'reserved', label: 'Reserved' },
                { id: 'sold', label: 'Sold Out' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setPropStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    propStatusFilter === tab.id
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {propertiesForSale.filter(p => {
            const matchesSearch = !propSearchTerm || 
              p.title.toLowerCase().includes(propSearchTerm.toLowerCase()) || 
              p.location.toLowerCase().includes(propSearchTerm.toLowerCase());
            const matchesStatus = propStatusFilter === 'all' || p.status === propStatusFilter;
            return matchesSearch && matchesStatus;
          }).length === 0 ? (
            <div className="text-center py-12 bg-slate-950/60 border border-slate-800 rounded-3xl">
              <HouseIcon className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm font-semibold">No property listings found matching your search.</p>
              <p className="text-slate-500 text-xs mt-1">Try clearing your search query or selecting a different status filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {propertiesForSale.filter(p => {
                const matchesSearch = !propSearchTerm || 
                  p.title.toLowerCase().includes(propSearchTerm.toLowerCase()) || 
                  p.location.toLowerCase().includes(propSearchTerm.toLowerCase());
                const matchesStatus = propStatusFilter === 'all' || p.status === propStatusFilter;
                return matchesSearch && matchesStatus;
              }).map((prop) => (
                <div 
                  key={prop.id}
                  className="bg-slate-950/80 border border-slate-800 rounded-3xl overflow-hidden hover:border-amber-500/40 transition-all duration-300 shadow-xl flex flex-col justify-between group"
                >
                  {/* Image & Status Badge */}
                  <div className="relative h-64 overflow-hidden bg-slate-900">
                    <img 
                      src={prop.image_url} 
                      alt={prop.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-lg ${
                        prop.status === 'sold'
                          ? 'bg-red-500 text-white'
                          : prop.status === 'reserved'
                          ? 'bg-amber-500 text-slate-950 font-extrabold'
                          : 'bg-emerald-500 text-slate-950 font-extrabold'
                      }`}>
                        {prop.status === 'sold' ? 'Sold Out' : prop.status === 'reserved' ? 'Reserved' : 'For Sale / Available'}
                      </span>
                    </div>

                    <div className="absolute bottom-4 right-4 bg-slate-950/90 border border-slate-800 backdrop-blur-md px-3 py-1.5 rounded-xl">
                      <span className="text-xs text-amber-500 font-extrabold block">
                        LKR {Number(prop.price).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-1.5 text-slate-400 text-xs">
                        <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">{prop.location}</span>
                      </div>
                      <h3 className="font-extrabold text-lg text-white leading-snug line-clamp-2">{prop.title}</h3>
                      <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed font-normal">{prop.description}</p>
                    </div>

                    {/* Spec Pills */}
                    <div className="grid grid-cols-3 gap-2 text-[11px] bg-slate-900/80 p-3 rounded-2xl border border-slate-800/80 text-slate-300">
                      <div className="text-center">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Land</span>
                        <span className="font-bold text-amber-400">{prop.perches} Perches</span>
                      </div>
                      <div className="text-center border-x border-slate-800">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Bedrooms</span>
                        <span className="font-bold text-amber-400">{prop.bedrooms} Beds</span>
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Bathrooms</span>
                        <span className="font-bold text-amber-400">{prop.bathrooms} Baths</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        onClick={() => {
                          setSelectedPropertyModal(prop);
                          setActivePropertyPhotoIdx(0);
                        }}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all border border-slate-700 cursor-pointer text-center"
                      >
                        View Photos
                      </button>
                      <a
                        href={`https://wa.me/94769117398?text=${encodeURIComponent(`Hi Rohana Construction, I am interested in purchasing the property: "${prop.title}" in ${prop.location} (Price: LKR ${Number(prop.price).toLocaleString()}). Please provide more details.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer text-center flex items-center justify-center space-x-1"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Inquire Now</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center p-4 md:p-6 overflow-y-auto pt-24 pb-12">
          <div className="bg-white rounded-3xl overflow-hidden max-w-4xl w-full shadow-2xl relative border border-slate-100 flex flex-col md:flex-row max-h-[90vh] md:max-h-[85vh]">
            
            {/* Action Buttons */}
            <div className="absolute top-4 left-4 z-20">
              <BackButton onClick={() => setSelectedProject(null)} label="Back" variant="subtle" />
            </div>
            <button 
              onClick={() => setSelectedProject(null)}
              className="absolute top-4 right-4 z-20 bg-slate-900/60 backdrop-blur-sm hover:bg-slate-900 text-white rounded-full p-2.5 transition-colors cursor-pointer"
              title="Close"
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

                {/* Photo Caption Overlay */}
                {selectedProject.galleryCaptions && selectedProject.galleryCaptions[activePhotoIdx] && (
                  <div className="absolute bottom-2 left-2 right-2 bg-slate-950/85 backdrop-blur-md border border-slate-800 text-amber-400 text-xs font-semibold px-3 py-2 rounded-lg text-center shadow-lg">
                    {selectedProject.galleryCaptions[activePhotoIdx]}
                  </div>
                )}
              </div>

              {/* Gallery Thumbnails List */}
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1 justify-center">
                {selectedProject.gallery.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePhotoIdx(idx)}
                    className={`h-12 w-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                      activePhotoIdx === idx ? 'border-amber-500 scale-105 ring-2 ring-amber-500/30' : 'border-slate-800 opacity-60 hover:opacity-100'
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
                <div className="flex items-center gap-2">
                  <span className="bg-amber-500/10 text-amber-600 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded">
                    {selectedProject.tag}
                  </span>
                  {selectedProject.isVerified && (
                    <span className="bg-emerald-500/10 text-emerald-600 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" /> Verified Rohana Build
                    </span>
                  )}
                </div>
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center p-4 md:p-6 overflow-y-auto pt-24 pb-12">
          <div className="bg-white rounded-3xl overflow-hidden max-w-4xl w-full shadow-2xl relative border border-slate-100 flex flex-col md:flex-row max-h-[90vh] md:max-h-[85vh]">
            
            {/* Action Buttons */}
            <div className="absolute top-4 left-4 z-20">
              <BackButton onClick={() => setSelectedService(null)} label="Back" variant="subtle" />
            </div>
            <button 
              onClick={() => setSelectedService(null)}
              className="absolute top-4 right-4 z-20 bg-slate-900/60 backdrop-blur-sm hover:bg-slate-900 text-white rounded-full p-2.5 transition-colors cursor-pointer"
              title="Close"
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
              {selectedService.name === 'Residential Construction' ? (
                <div className="space-y-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <div className={`p-1.5 rounded-lg ${selectedService.color}`}>
                          <selectedService.icon className="h-4 w-4" />
                        </div>
                        <span className="text-amber-700 text-[10px] font-black uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded">
                          Flagship Core Service (නිවාස ඉදිකිරීම්)
                        </span>
                      </div>
                      <h3 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">Residential Construction</h3>
                    </div>

                    {/* Step 1: Upload House Plan */}
                    <div className="border-2 border-dashed border-amber-400/80 bg-amber-50/60 p-3.5 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                          <UploadCloud className="h-4 w-4 text-amber-600" /> 1. Upload House Plan
                        </span>
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded-full">Required</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-normal">
                        Upload your existing house plan blueprint to receive a physical cost estimate.
                      </p>
                      <input 
                        type="file" 
                        accept=".pdf,.png,.jpg,.jpeg,.dwg" 
                        onChange={(e) => setUploadedPlanFile(e.target.files[0]?.name || null)}
                        className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                      />
                      {uploadedPlanFile && (
                        <p className="text-[11px] font-bold text-emerald-700">✓ Blueprint Attached: {uploadedPlanFile}</p>
                      )}
                    </div>

                    {/* Step 2: Select Quality */}
                    <div className="space-y-2">
                      <label className="block text-xs font-black text-slate-900 uppercase tracking-wide">
                        2. Select Quality Tier
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setModalQualityTier('high')}
                          className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                            modalQualityTier === 'high'
                              ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md ring-2 ring-amber-500/30'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          ⭐ High
                        </button>
                        <button
                          type="button"
                          onClick={() => setModalQualityTier('medium')}
                          className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                            modalQualityTier === 'medium'
                              ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md ring-2 ring-amber-500/30'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          🏷️ Medium
                        </button>
                        <button
                          type="button"
                          onClick={() => setModalQualityTier('customize')}
                          className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                            modalQualityTier === 'customize'
                              ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md ring-2 ring-amber-500/30'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          ⚙️ Customize
                        </button>
                      </div>

                      {/* Specs breakdown from handwritten notes */}
                      <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl text-xs space-y-2 max-h-56 overflow-y-auto shadow-inner">
                        {modalQualityTier === 'high' && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between border-b border-amber-200/60 pb-1.5">
                              <span className="font-black text-amber-800 text-[11px] uppercase tracking-wider">⭐ High Quality (Premium Construction)</span>
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Grade A Luxury</span>
                            </div>
                            <ul className="space-y-1.5 text-[11px] text-slate-700 leading-snug">
                              <li className="flex items-start gap-1.5">
                                <span className="text-amber-600 font-bold">▪</span>
                                <div><strong>Tiles & Bathware:</strong> Premium Rocell bathware & Lanka tiles (Porcelain & anti-slip)</div>
                              </li>
                              <li className="flex items-start gap-1.5">
                                <span className="text-amber-600 font-bold">▪</span>
                                <div><strong>Wood Work:</strong> Seasoned Grade-A Teak, Mahogany, or Jak wood crafted by experienced carpenters</div>
                              </li>
                              <li className="flex items-start gap-1.5">
                                <span className="text-amber-600 font-bold">▪</span>
                                <div><strong>Electricals:</strong> Certified ACL, Orange, or top quality brand cables & modular switch boards</div>
                              </li>
                              <li className="flex items-start gap-1.5">
                                <span className="text-amber-600 font-bold">▪</span>
                                <div><strong>Plumbing:</strong> Heavy-duty S-lon pressure pipes & engineered brass fittings</div>
                              </li>
                              <li className="flex items-start gap-1.5">
                                <span className="text-amber-600 font-bold">▪</span>
                                <div><strong>Painting:</strong> Multi-layer wall putty with Nippon, Dulux WeatherShield, or JAT wood stains</div>
                              </li>
                              <li className="flex items-start gap-1.5">
                                <span className="text-amber-600 font-bold">▪</span>
                                <div><strong>Masonry & Roofing:</strong> Wire-cut red clay bricks or high-density block stone (as per customer choice), river sand, Melwa / Lanwa TMT steel wire, Tokyo Super / Sanstha cement & quality Rhino Roofing.</div>
                              </li>
                            </ul>
                          </div>
                        )}
                        {modalQualityTier === 'medium' && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                              <span className="font-black text-slate-900 text-[11px] uppercase tracking-wider">🏷️ Medium Quality (Value Construction)</span>
                              <span className="text-[10px] font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">Cost Optimized</span>
                            </div>
                            <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                              Some non-structural finish items will be optimized to budget options, but overall <strong>structural build quality, foundation strength, and engineering safety will NOT be compromised</strong>.
                            </p>
                            <ul className="space-y-1 text-[11px] text-slate-600">
                              <li>• <strong>Bathware & Tiles:</strong> Standard Lanka Tiles & Cotto sanitaryware</li>
                              <li>• <strong>Timber:</strong> Kiln-dried Mahogany / Seasoned Hardwood</li>
                              <li>• <strong>Electricals & Plumbing:</strong> SLS-approved ACL wiring & S-lon plumbing</li>
                              <li>• <strong>Masonry & Roof:</strong> Concrete block masonry & durable roofing sheets</li>
                            </ul>
                          </div>
                        )}
                        {modalQualityTier === 'customize' && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                              <span className="font-black text-slate-900 text-[11px] uppercase tracking-wider">⚙️ Customized (Tailored Client Specs)</span>
                              <span className="text-[10px] font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">100% Bespoke</span>
                            </div>
                            <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                              Material selection, brand specifications, timber choices, and architectural parameters will depend <strong>100% on your specific budget and personal aesthetic preferences</strong>.
                            </p>
                            <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200/60 font-semibold">
                              Direct engineering consultation provided to select each material brand prior to construction kickoff.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Step 3: Request to Estimate */}
                    <button
                      type="button"
                      onClick={handleOpenRequestEstimate}
                      className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3.5 rounded-xl transition-all cursor-pointer text-center text-xs flex items-center justify-center space-x-2 border border-amber-400 shadow-md shadow-amber-500/20 uppercase tracking-wider"
                    >
                      <Calculator className="h-4 w-4 text-slate-950" />
                      <span>3. Request to Estimate & Pay Fee</span>
                    </button>

                    {/* Step 4: Payment Note */}
                    <div className="bg-amber-50 border border-amber-200/80 p-2.5 rounded-xl text-[11px] text-amber-950 font-medium leading-relaxed">
                      <strong>Payment Notice:</strong> An official estimation processing payment applies for our engineers to draft and dispatch an official physical cost estimate for your build.
                    </div>
                  </div>

                  {/* Step 5: Direct Contact */}
                  <div className="pt-3 border-t border-slate-100 space-y-2 mt-2">
                    <p className="text-[11px] text-slate-600 italic font-medium">
                      "Direct contact and confirm after we provide to your estimate cost for your build."
                    </p>
                    <button
                      onClick={(e) => {
                        const srv = selectedService;
                        setSelectedService(null);
                        handleOpenDirectInquiry(srv, e);
                      }}
                      className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl transition-all shadow-md shadow-amber-500/20 cursor-pointer text-center text-xs flex items-center justify-center space-x-2"
                    >
                      <PhoneCall className="h-4 w-4" />
                      <span>Direct Contact & Confirm</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 flex-1 flex flex-col justify-between">
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
                  <div className="pt-6 border-t border-slate-100 mt-6 space-y-2.5">
                    <button
                      onClick={(e) => {
                        const srv = selectedService;
                        setSelectedService(null);
                        handleOpenDirectInquiry(srv, e);
                      }}
                      className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3.5 rounded-xl transition-all shadow-md shadow-amber-500/20 cursor-pointer text-center text-sm flex items-center justify-center space-x-2"
                    >
                      <PhoneCall className="h-4 w-4" />
                      <span>Direct Contact / Book {selectedService.name}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ====================== DIRECT SERVICE CONTACT MODAL ====================== */}
      {directInquiryService && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-start justify-center p-4 md:p-6 overflow-y-auto pt-24 pb-12 animate-fade-in"
          onClick={() => setDirectInquiryService(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 p-6 md:p-8 space-y-5 relative text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Action Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <BackButton onClick={() => setDirectInquiryService(null)} label="Back" variant="subtle" />
              <button
                onClick={() => setDirectInquiryService(null)}
                className="text-slate-400 hover:text-slate-900 bg-slate-100 p-1.5 rounded-full transition-colors cursor-pointer"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Header */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest bg-amber-500/10 text-amber-600 px-3 py-1 rounded-full flex items-center gap-1">
                  <PhoneCall className="h-3 w-3" /> Direct Contact
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-widest bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                  Rohana Construction
                </span>
              </div>
              <h3 className="text-2xl font-black text-slate-900">
                {directInquiryService.name.includes('Free') ? 'Get Free Estimate & Direct Contact' : `Inquire for ${directInquiryService.name}`}
              </h3>
              <p className="text-xs text-slate-500">
                Call our structural engineers directly via phone, WhatsApp, or submit your site details below for an immediate free estimate callback. No sign up required!
              </p>
            </div>

            {/* Direct Quick Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <a
                href="tel:+94769117398"
                className="flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-md cursor-pointer border border-slate-800"
              >
                <Phone className="h-4 w-4 text-amber-400" />
                <span>Call 076 911 73 98</span>
              </a>
              <a
                href={`https://wa.me/94769117398?text=${encodeURIComponent(`Hello Rohana Construction, I am interested in ${directInquiryService.name} service for my site.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <MessageSquare className="h-4 w-4" />
                <span>WhatsApp Inquiry</span>
              </a>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-[10px] uppercase font-bold text-slate-400 tracking-wider">or send direct message</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Direct Form */}
            {inquirySuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
                <h4 className="font-extrabold text-emerald-950 text-base">Inquiry Sent Successfully!</h4>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Thank you! Our technical engineer will call you at <span className="font-bold">{inquiryForm.phone}</span> shortly to discuss your <span className="font-bold">{directInquiryService.name}</span> project.
                </p>
                <button
                  onClick={() => setDirectInquiryService(null)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-6 rounded-xl text-xs cursor-pointer transition-all"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleDirectInquirySubmit} className="space-y-4 text-left">
                {inquiryError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-bold">
                    {inquiryError}
                  </div>
                )}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={inquiryForm.name}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                    placeholder="e.g. Ruwan Perera"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Phone / WhatsApp Number *</label>
                  <input
                    type="tel"
                    required
                    value={inquiryForm.phone}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                    placeholder="077 123 4567"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Site Location / City</label>
                  <input
                    type="text"
                    value={inquiryForm.location}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, location: e.target.value })}
                    placeholder="e.g. Maharagama, Colombo"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Work Description / Details</label>
                  <textarea
                    rows={3}
                    value={inquiryForm.details}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, details: e.target.value })}
                    placeholder={`Describe your ${directInquiryService.name} requirements (e.g. 1200 sqft slab shuttering / house wiring...)`}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingInquiry}
                  className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold py-3.5 rounded-xl transition-all shadow-md shadow-amber-500/20 cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>{isSubmittingInquiry ? 'Sending Inquiry...' : 'Submit Direct Inquiry'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ====================== REQUEST OFFICIAL ESTIMATE & PAYMENT MODAL ====================== */}
      {isRequestEstimateOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-start justify-center p-4 md:p-6 overflow-y-auto pt-24 pb-12 animate-fade-in"
          onClick={() => setIsRequestEstimateOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 p-6 md:p-8 space-y-5 relative text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Action Header with Back & Close */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <BackButton onClick={() => setIsRequestEstimateOpen(false)} label="Back" variant="subtle" />
              <button
                onClick={() => setIsRequestEstimateOpen(false)}
                className="text-slate-400 hover:text-slate-900 bg-slate-100 p-1.5 rounded-full transition-colors cursor-pointer"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Header Title & Subtitle */}
            <div className="space-y-1.5 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-700 px-3 py-1 rounded-full flex items-center gap-1">
                  <Calculator className="h-3.5 w-3.5" /> Official Build Estimate
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  Processing Fee LKR 1,500.00
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
                Request Estimate & Physical Blueprints
              </h3>
              <p className="text-xs text-slate-500">
                Our structural engineers will analyze your blueprint & dispatch an official physical cost estimate.
              </p>
            </div>

            {estimateSuccess ? (
              /* Success Screen */
              <div className="py-6 text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-10 w-10" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-black text-slate-900">Estimate Request Submitted!</h4>
                  <p className="text-xs text-slate-500">
                    Reference ID: <strong className="text-amber-600">{estimateSuccess.refNo}</strong>
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs space-y-2 text-left">
                  <div className="flex justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-slate-500">Service:</span>
                    <span className="font-bold text-slate-900">Residential Construction</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-slate-500">Selected Quality Tier:</span>
                    <span className="font-bold text-amber-600">{estimateSuccess.tier}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-slate-500">Processing Fee Paid:</span>
                    <span className="font-bold text-emerald-600">{estimateSuccess.amount} ✓</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Summary:</span>
                    <span className="font-medium text-slate-800 text-right">{estimateSuccess.method}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Our structural engineering team will review your house plan blueprint and contact you within 24 hours to deliver the official physical estimate & CAD drawings.
                </p>

                <button
                  onClick={() => setIsRequestEstimateOpen(false)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs cursor-pointer transition-all"
                >
                  Close Window
                </button>
              </div>
            ) : (
              /* Form View */
              <form onSubmit={handleEstimateRequestSubmit} className="space-y-4">
                {estimateError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-semibold">
                    {estimateError}
                  </div>
                )}

                {/* Step 1: House Specifications Summary */}
                <div className="bg-amber-50/70 border border-amber-200/80 p-3.5 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-black text-amber-900 uppercase tracking-wide">
                    <span>1. House Specs & Plan Attachment</span>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-200/60 px-2 py-0.5 rounded-full">
                      Tier: {modalQualityTier.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Land Size (Perches)</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={estimateForm.landSize}
                        onChange={(e) => setEstimateForm({ ...estimateForm, landSize: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">House Stories</label>
                      <select
                        value={estimateForm.houseStories}
                        onChange={(e) => setEstimateForm({ ...estimateForm, houseStories: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 cursor-pointer"
                      >
                        <option value="single">Single Story</option>
                        <option value="two">Two Stories</option>
                        <option value="three">Three Stories</option>
                      </select>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-700 bg-white/80 p-2.5 rounded-xl border border-amber-200/50 flex items-center justify-between">
                    <span className="font-semibold">Attached Blueprint:</span>
                    <span className="font-bold text-amber-700 truncate max-w-[200px]">
                      {uploadedPlanFile || 'Pending Upload (Can attach file)'}
                    </span>
                  </div>
                </div>

                {/* Step 2: Customer Contact Info */}
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-900 uppercase tracking-wide">
                    2. Your Contact Information
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={estimateForm.name}
                        onChange={(e) => setEstimateForm({ ...estimateForm, name: e.target.value })}
                        placeholder="e.g. Nimal Perera"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Phone / WhatsApp *</label>
                      <input
                        type="tel"
                        required
                        value={estimateForm.phone}
                        onChange={(e) => setEstimateForm({ ...estimateForm, phone: e.target.value })}
                        placeholder="077 123 4567"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Site Address / City</label>
                    <input
                      type="text"
                      value={estimateForm.location}
                      onChange={(e) => setEstimateForm({ ...estimateForm, location: e.target.value })}
                      placeholder="e.g. Piliyandala, Colombo"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Step 3: Payment Method Selection */}
                <div className="space-y-2.5 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-slate-900 uppercase tracking-wide">
                      3. Estimation Processing Fee Payment (LKR 1,500.00)
                    </label>
                    <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      LKR 1,500.00
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setEstimateForm({ ...estimateForm, paymentMethod: 'card' })}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        estimateForm.paymentMethod === 'card'
                          ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20 text-slate-950 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <CreditCard className="h-4 w-4 mx-auto mb-1 text-amber-600" />
                      <span className="block text-[11px]">Card Payment</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEstimateForm({ ...estimateForm, paymentMethod: 'bank_transfer' })}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        estimateForm.paymentMethod === 'bank_transfer'
                          ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20 text-slate-950 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Building className="h-4 w-4 mx-auto mb-1 text-amber-600" />
                      <span className="block text-[11px]">Bank Transfer</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEstimateForm({ ...estimateForm, paymentMethod: 'cash' })}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        estimateForm.paymentMethod === 'cash'
                          ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20 text-slate-950 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <DollarSign className="h-4 w-4 mx-auto mb-1 text-amber-600" />
                      <span className="block text-[11px]">Cash Deposit</span>
                    </button>
                  </div>

                  {/* Dynamic Payment Method Input Fields */}
                  {estimateForm.paymentMethod === 'card' && (
                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Cardholder Name *</label>
                        <input
                          type="text"
                          required
                          value={estimateForm.cardName}
                          onChange={(e) => setEstimateForm({ ...estimateForm, cardName: e.target.value })}
                          placeholder="e.g. NIMAL PERERA"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Card Number *</label>
                        <input
                          type="text"
                          required
                          maxLength={19}
                          value={estimateForm.cardNumber}
                          onChange={(e) => setEstimateForm({ ...estimateForm, cardNumber: e.target.value })}
                          placeholder="4532 8912 3456 7890"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Expiry Date *</label>
                          <input
                            type="text"
                            required
                            placeholder="MM/YY"
                            maxLength={5}
                            value={estimateForm.cardExpiry}
                            onChange={(e) => setEstimateForm({ ...estimateForm, cardExpiry: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">CVC Code *</label>
                          <input
                            type="password"
                            required
                            maxLength={4}
                            placeholder="•••"
                            value={estimateForm.cardCvc}
                            onChange={(e) => setEstimateForm({ ...estimateForm, cardCvc: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {estimateForm.paymentMethod === 'bank_transfer' && (
                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-3 text-xs">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1 text-[11px] text-slate-700">
                        <span className="font-bold block text-slate-900">Bank of Ceylon (BOC)</span>
                        <div>Account Name: <strong>T.R.D.Malinda</strong></div>
                        <div>Account No: <strong>0090863683</strong> (Kesbewa Branch)</div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Bank Slip Ref / Deposit ID</label>
                        <input
                          type="text"
                          value={estimateForm.bankRef}
                          onChange={(e) => setEstimateForm({ ...estimateForm, bankRef: e.target.value })}
                          placeholder="e.g. BOC-904128"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                          Upload Bank Transfer Slip / Deposit Receipt (PDF / Image) *
                        </label>
                        <label className="flex items-center justify-center space-x-2 bg-white border border-slate-300 border-dashed hover:border-amber-500 rounded-xl p-3 cursor-pointer transition-colors text-xs text-slate-600">
                          <UploadCloud className="h-4 w-4 text-amber-500 shrink-0" />
                          <span className="truncate">
                            {estimateForm.bankSlipName ? estimateForm.bankSlipName : 'Upload Slip PDF / Photo (.pdf, .jpg, .png)'}
                          </span>
                          <input
                            type="file"
                            accept=".pdf,image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                setEstimateForm({
                                  ...estimateForm,
                                  bankSlipName: file.name,
                                  bankSlipFile: file
                                });
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                        {estimateForm.bankSlipName && (
                          <p className="text-[10px] text-emerald-600 font-bold mt-1.5 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Attached: {estimateForm.bankSlipName}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {estimateForm.paymentMethod === 'cash' && (
                    <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl space-y-3 text-xs text-amber-950">
                      <p className="font-medium text-xs">
                        💵 You can pay the <strong>LKR 1,500.00</strong> fee in cash directly at our Maharagama office or hand it over to our structural engineer during the initial site visit.
                      </p>
                      <div>
                        <label className="block text-[10px] font-bold text-amber-900 uppercase mb-1">
                          Optional: Upload Cash Deposit Receipt / Voucher (PDF / Image)
                        </label>
                        <label className="flex items-center justify-center space-x-2 bg-white border border-amber-300 border-dashed hover:border-amber-500 rounded-xl p-2.5 cursor-pointer transition-colors text-xs text-slate-600">
                          <UploadCloud className="h-4 w-4 text-amber-500 shrink-0" />
                          <span className="truncate">
                            {estimateForm.bankSlipName ? estimateForm.bankSlipName : 'Attach Cash Voucher Receipt (Optional)'}
                          </span>
                          <input
                            type="file"
                            accept=".pdf,image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                setEstimateForm({
                                  ...estimateForm,
                                  bankSlipName: file.name,
                                  bankSlipFile: file
                                });
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                        {estimateForm.bankSlipName && (
                          <p className="text-[10px] text-emerald-700 font-bold mt-1 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Attached: {estimateForm.bankSlipName}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingEstimate}
                  className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black py-3.5 rounded-xl transition-all shadow-md shadow-amber-500/20 cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>{isSubmittingEstimate ? 'Processing Request & Payment...' : 'Submit Request & Pay Fee (LKR 1,500)'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Property Details Modal */}
      {selectedPropertyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center p-4 md:p-6 overflow-y-auto pt-24 pb-12">
          <div className="bg-white rounded-3xl overflow-hidden max-w-4xl w-full shadow-2xl relative border border-slate-100 flex flex-col md:flex-row max-h-[90vh] md:max-h-[85vh]">
            
            {/* Action Buttons */}
            <div className="absolute top-4 left-4 z-20">
              <BackButton onClick={() => setSelectedPropertyModal(null)} label="Back" variant="subtle" />
            </div>
            <button 
              onClick={() => setSelectedPropertyModal(null)}
              className="absolute top-4 right-4 z-20 bg-slate-900/60 backdrop-blur-sm hover:bg-slate-900 text-white rounded-full p-2.5 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Left Column: Photos Gallery */}
            <div className="w-full md:w-1/2 bg-slate-950 flex flex-col justify-between p-4 relative min-h-[300px] md:min-h-[450px]">
              <div className="flex-1 flex items-center justify-center overflow-hidden rounded-xl bg-slate-900 relative">
                <img 
                  src={selectedPropertyModal.gallery ? selectedPropertyModal.gallery[activePropertyPhotoIdx] || selectedPropertyModal.image_url : selectedPropertyModal.image_url} 
                  alt={selectedPropertyModal.title} 
                  className="max-h-[360px] w-full object-cover rounded-lg"
                />

                {selectedPropertyModal.gallery && selectedPropertyModal.gallery.length > 1 && (
                  <>
                    <button 
                      onClick={() => setActivePropertyPhotoIdx((prev) => (prev - 1 + selectedPropertyModal.gallery.length) % selectedPropertyModal.gallery.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-sm transition-all cursor-pointer"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => setActivePropertyPhotoIdx((prev) => (prev + 1) % selectedPropertyModal.gallery.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-sm transition-all cursor-pointer"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {selectedPropertyModal.gallery && selectedPropertyModal.gallery.length > 1 && (
                <div className="mt-4 flex gap-2 overflow-x-auto pb-1 justify-center">
                  {selectedPropertyModal.gallery.map((url, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActivePropertyPhotoIdx(idx)}
                      className={`h-12 w-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        activePropertyPhotoIdx === idx ? 'border-amber-500 scale-105 ring-2 ring-amber-500/30' : 'border-slate-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Property Info */}
            <div className="w-full md:w-1/2 p-6 md:p-8 overflow-y-auto flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                    selectedPropertyModal.status === 'sold'
                      ? 'bg-red-100 text-red-700'
                      : selectedPropertyModal.status === 'reserved'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {selectedPropertyModal.status === 'sold' ? 'Sold Out' : selectedPropertyModal.status === 'reserved' ? 'Reserved' : 'For Sale / Available'}
                  </span>
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
                    LKR {Number(selectedPropertyModal.price).toLocaleString()}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900 leading-tight">{selectedPropertyModal.title}</h3>
                  <p className="text-xs text-slate-500 font-semibold">{selectedPropertyModal.location}</p>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-normal">{selectedPropertyModal.description}</p>

                {/* Technical Specs Table */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-slate-500 font-medium">Land Extent:</span>
                    <span className="font-bold text-slate-900">{selectedPropertyModal.perches} Perches</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-slate-500 font-medium">Bedrooms:</span>
                    <span className="font-bold text-slate-900">{selectedPropertyModal.bedrooms} Bedrooms</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-slate-500 font-medium">Bathrooms:</span>
                    <span className="font-bold text-slate-900">{selectedPropertyModal.bathrooms} Bathrooms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Structure Stories:</span>
                    <span className="font-bold text-slate-900">{selectedPropertyModal.stories}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                <a
                  href={`tel:${selectedPropertyModal.contact_phone || '0769117398'}`}
                  className="flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-md cursor-pointer border border-slate-800"
                >
                  <Phone className="h-4 w-4 text-amber-400" />
                  <span>Call Agent</span>
                </a>
                <a
                  href={`https://wa.me/94769117398?text=${encodeURIComponent(`Hi Rohana Construction, I am interested in purchasing property "${selectedPropertyModal.title}" (Price: LKR ${Number(selectedPropertyModal.price).toLocaleString()}). Please arrange a site inspection.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 px-4 rounded-xl text-xs transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>WhatsApp Inquiry</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
