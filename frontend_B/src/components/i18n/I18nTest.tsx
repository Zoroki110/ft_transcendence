import React from 'react';
import { useTranslations } from '../../hooks/useTranslations';
import LanguageSelector from './LanguageSelector';

const I18nTest: React.FC = () => {
  const { t, formatDate, formatNumber } = useTranslations();

  const currentDate = new Date();
  const sampleNumber = 1234.56;

  return (
    <div className="i18n-test">
      <div className="test-header">
        <h1>{t('test.title')}</h1>
        <LanguageSelector />
      </div>
      
      <div className="test-content">
        <p>{t('test.description')}</p>
        <p>{t('test.switchLanguage')}</p>
        
        <div className="format-examples">
          <h3>{t('test.formatExamples')}</h3>
          <p><strong>{t('test.date')} :</strong> {formatDate(currentDate)}</p>
          <p><strong>{t('test.number')} :</strong> {formatNumber(sampleNumber)}</p>
        </div>
        
        <div className="navigation-test">
          <h3>{t('test.navigation')} :</h3>
          <ul>
            <li>{t('navigation.home')}</li>
            <li>{t('navigation.tournaments')}</li>
            <li>{t('navigation.profile')}</li>
            <li>{t('navigation.game')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default I18nTest;
