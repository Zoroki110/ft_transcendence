import React from 'react';
import { useTranslations } from '../../hooks/useTranslations';

const LanguageSelector: React.FC = () => {
  const { currentLanguage, changeLanguage } = useTranslations();

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' }
  ];

  return (
    <div className="language-selector">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => changeLanguage(lang.code)}
          className={`language-btn ${currentLanguage === lang.code ? 'active' : ''}`}
          title={lang.name}
        >
          {lang.flag} {lang.code.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

export default LanguageSelector;
