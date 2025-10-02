// frontend_B/src/components/TabSyncDebugger.tsx
import React, { useState } from 'react';
import { useTabSync } from '../hooks/useTabSync';

const TabSyncDebugger: React.FC = () => {
  const { notifyTournamentStarted, notifyForceRefresh, notifyRefreshStats } = useTabSync();
  const [testTournamentId, setTestTournamentId] = useState(1);

  const handleTestTournament = () => {
    console.log(`🧪 TEST: Envoi notification tournoi ${testTournamentId}`);
    notifyTournamentStarted(testTournamentId);
  };

  const handleTestRefresh = () => {
    console.log('🧪 TEST: Envoi notification refresh');
    notifyForceRefresh('Test de refresh depuis debugger');
  };

  const handleTestStats = () => {
    console.log('🧪 TEST: Envoi notification stats');
    notifyRefreshStats();
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: '#333',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 1000,
      minWidth: '200px'
    }}>
      <div><strong>🧪 TabSync Debugger</strong></div>
      
      <div style={{ margin: '10px 0' }}>
        <label>
          Tournoi ID: 
          <input 
            type="number" 
            value={testTournamentId}
            onChange={(e) => setTestTournamentId(Number(e.target.value))}
            style={{ width: '60px', marginLeft: '5px' }}
          />
        </label>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <button 
          onClick={handleTestTournament}
          style={{ fontSize: '11px', padding: '5px' }}
        >
          🏆 Test Tournoi Started
        </button>
        
        <button 
          onClick={handleTestRefresh}
          style={{ fontSize: '11px', padding: '5px' }}
        >
          🔄 Test Force Refresh
        </button>
        
        <button 
          onClick={handleTestStats}
          style={{ fontSize: '11px', padding: '5px' }}
        >
          📊 Test Stats Refresh
        </button>
      </div>

      <div style={{ marginTop: '10px', fontSize: '10px', opacity: 0.7 }}>
        Ouvre plusieurs onglets pour tester la synchronisation
      </div>
    </div>
  );
};

export default TabSyncDebugger;