import React from 'react';
import type { SupportedLanguage } from '../types/report';

interface LanguageSelectorProps {
  currentLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
}

const languages: { code: SupportedLanguage; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'am', label: 'Amharic', native: 'አማርኛ' },
  { code: 'om', label: 'Afaan Oromoo', native: 'Oromoo' },
  { code: 'ti', label: 'Tigrinya', native: 'ትግርኛ' },
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ currentLanguage, onLanguageChange }) => (
  <div className="lang-selector" role="radiogroup" aria-label="Select report explanation language">
    {languages.map((lang) => (
      <button key={lang.code} type="button" role="radio" title={lang.label}
        aria-checked={currentLanguage === lang.code}
        className={`lang-btn ${currentLanguage === lang.code ? 'active' : ''}`}
        onClick={() => onLanguageChange(lang.code)}>
        {lang.native}
      </button>
    ))}
  </div>
);
