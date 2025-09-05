import React from 'react';
import I18nTest from './components/i18n/I18nTest';
import { useTranslations } from './hooks/useTranslations';
import './styles/app.css';

function App() {
  const { t } = useTranslations();

  return (
    <div className="App">
      <header className="app-header">
        <h1>{t('common.welcome')}</h1>
      </header>
      <main>
        <I18nTest />
      </main>
    </div>
  );
}

export default App;
