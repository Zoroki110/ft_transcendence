// frontend_B/src/components/DebugStorage.tsx
import React from 'react';
import { storageService } from '../utils/storage';
import { useUser } from '../contexts/UserContext';

const DebugStorage: React.FC = () => {
  const { user, loading, isLoggedIn } = useUser();
  
  const handleDebug = () => {
    const token = storageService.getToken();
    console.log('🔧 DEBUG STORAGE:', {
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 30)}...` : 'null',
      currentUser: user?.username || 'null',
      userId: user?.id || 'null',
      storage: 'sessionStorage' // Pour confirmer qu'on utilise sessionStorage
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: '#f0f0f0',
      padding: '10px',
      borderRadius: '5px',
      border: '1px solid #ccc',
      fontSize: '12px',
      zIndex: 1000
    }}>
      <div><strong>🔧 Debug Session</strong></div>
      <div>User: {loading ? '⏳' : (user?.username || 'Non connecté')}</div>
      <div>ID: {user?.id || 'N/A'}</div>
      <div>Token: {storageService.hasToken() ? '✅' : '❌'}</div>
      <div>Status: {loading ? '⏳ Loading' : (isLoggedIn ? '🟢 Logged' : '🔴 Offline')}</div>
      <button onClick={handleDebug} style={{ marginTop: '5px', fontSize: '11px' }}>
        🔍 Debug Console
      </button>
    </div>
  );
};

export default DebugStorage;