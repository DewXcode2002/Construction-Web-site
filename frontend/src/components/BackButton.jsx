import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function BackButton({ 
  onClick, 
  fallbackPath = '/', 
  className = '', 
  label, 
  showLabel = true,
  variant = 'default' // 'default', 'subtle', 'pill'
}) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleBack = () => {
    if (onClick) {
      onClick();
    } else {
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate(fallbackPath);
      }
    }
  };

  const textLabel = label || t.navBack || 'Back';

  const baseStyles = "inline-flex items-center space-x-2 font-medium transition-all duration-200 cursor-pointer group select-none";
  
  const variantStyles = {
    default: "bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-amber-400 px-3.5 py-1.5 rounded-lg border border-slate-800 hover:border-amber-500/30 text-xs shadow-sm",
    subtle: "text-slate-400 hover:text-amber-400 text-xs hover:bg-slate-800/50 px-2 py-1 rounded-md",
    pill: "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 px-4 py-2 rounded-full border border-amber-500/30 text-xs font-semibold"
  };

  return (
    <button
      onClick={handleBack}
      type="button"
      className={`${baseStyles} ${variantStyles[variant] || variantStyles.default} ${className}`}
      title={textLabel}
    >
      <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
      {showLabel && <span>{textLabel}</span>}
    </button>
  );
}
