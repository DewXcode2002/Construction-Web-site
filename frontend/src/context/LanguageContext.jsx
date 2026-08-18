import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

export const translations = {
  en: {
    navHome: 'Home',
    navServices: 'Services',
    navProjects: 'Projects',
    navHousePlans: 'House Plans',
    navHousesForSale: 'Houses For Sale',
    navJoinWorker: 'Join As Worker',
    navDashboard: 'Dashboard',
    navLogin: 'Portal Login',
    navLogout: 'Logout',
    navBack: 'Back',
    calcTitle: 'Interactive Live House Cost Calculator',
    calcSubtitle: 'Adjust sliders to estimate your construction budget in real-time',
    landSize: 'Land Size (Perches / Sqft)',
    houseStories: 'House Stories',
    qualityTier: 'Material Quality Tier',
    highQuality: 'High Quality (Teak, Rocell, Dulux)',
    mediumQuality: 'Medium Grade (Kempas, Standard Tiles)',
    estimatedTotal: 'Estimated Total Cost',
    structuralCost: 'Structural Masonry Cost',
    finishCost: 'Finishes & Fitting Cost',
    estimatedDuration: 'Estimated Completion',
    weeks: 'Weeks',
    requestEngineer: 'Request Official Engineer Estimate',
    directCall: 'Direct Call / Inquiry',
    calcDisclaimer: '📌 Disclaimer: This live cost estimator provides an approximate budget based on standard Sri Lankan market factors. Final actual quotation will be verified after physical site inspection & architectural plan drawing.',
    calcCompetitiveBadge: 'Rohana Construction Special Rate: ~10% Lower Than Market Average',
    calcInputModeLabel: 'Estimate By',
    modePerches: '📏 Land Size (Perches)',
    modeSqft: '📐 House Built Area (SqFt)',
    customSqftLabel: 'Exact House Built Area (Square Feet)'
  },
  si: {
    navHome: 'මුල් පිටුව',
    navServices: 'සේවාවන්',
    navProjects: 'ව්‍යාපෘති',
    navHousePlans: 'නිවාස සැලසුම්',
    navHousesForSale: 'විකිණීමට ඇති නිවාස',
    navJoinWorker: 'සේවක එකතුවට',
    navDashboard: 'පුවරුව',
    navLogin: 'පද්ධතියට ඇතුල් වන්න',
    navLogout: 'ඉවත් වන්න',
    navBack: 'ආපසු',
    calcTitle: 'ක්ෂණික නිවාස පිරිවැය ගණක යන්ත්‍රය',
    calcSubtitle: 'අනෙකුත් ඉදිකිරීම් සමාගම්වලට වඩා අඩුම තරඟකාරී මිල ගණන් යටතේ ඔබගේ නිවසේ දළ පිරිවැය ක්ෂණිකව බලාගන්න',
    landSize: 'ඉඩමේ ප්‍රමාණය (පර්චස්)',
    houseStories: 'නිවසේ තට්ටු ගණන',
    qualityTier: 'අමුද්‍රව්‍ය වල ගුණාත්මකභාවය',
    highQuality: 'උසස්ම තත්ත්වයේ (Teak, Rocell, Dulux) - LKR 7,500/sqft',
    mediumQuality: 'සාමාන්‍ය තත්ත්වයේ (Standard Tiles/Wood) - LKR 5,800/sqft',
    estimatedTotal: 'දළ අනුමාන පිරිවැය (Approximate Cost)',
    structuralCost: 'කොන්ක්‍රීට් සහ මේසන් පිරිවැය',
    finishCost: 'ටයිල්, පේන්ට් සහ නිමවුම් පිරිවැය',
    estimatedDuration: 'අනුමාන ගතවන කාලය (Approximate Duration)',
    weeks: 'සති',
    requestEngineer: 'නිල ඉංජිනේරු ගණන් හැදීමක් ලබාගන්න',
    directCall: 'සෘජු ඇමතුමක් ලබාගන්න',
    calcDisclaimer: '📌 විශේෂ දැනුම්දීමයි: මෙහි දැක්වෙන්නේ වෙළඳපල සාධක මත දළ වශයෙන් අනුමාන කළ පිරිවැය සටහනකි (Approximate Estimation). පරිශ්‍රය පරීක්ෂා කිරීමෙන් සහ අවසාන ප්ලෑන සකස් කිරීමෙන් පසු නිශ්චිත පිරිවැය ලබාදෙනු ලැබේ.',
    calcCompetitiveBadge: 'රොහානා කන්ස්ට්‍රක්ෂන් විශේෂ මිළ: වෙළඳපල සාමාන්‍යයට වඩා ~10% ක් අඩුයි',
    calcInputModeLabel: 'ගණනය කරන පදනම',
    modePerches: '📏 ඉඩමේ පර්චස් ගණන අනුව',
    modeSqft: '📐 නිවසේ වර්ග අඩි ගණන (SqFt) අනුව',
    customSqftLabel: 'නිවසේ මුළු වර්ග අඩි ගණන (Square Feet)'
  }
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState('en');

  const value = {
    lang,
    setLang,
    t: translations[lang] || translations.en
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
