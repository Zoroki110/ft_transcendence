// frontend_B/src/components/Debug.tsx - Composant de débogage

import React, { useState } from 'react';
import { tournamentAPI, userAPI, healthAPI } from '../services/api';

const Debug: React.FC = () => {
  const [results, setResults] = useState<any[]>([]);

  const addResult = (test: string, success: boolean, data: any, error?: any) => {
    setResults(prev => [...prev, {
      test,
      success,
      data,
      error: error?.message || error,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const testAPI = async (name: string, apiCall: () => Promise<any>) => {
    try {
      console.log(`🧪 Testing ${name}...`);
      const result = await apiCall();
      addResult(name, true, result.data);
      console.log(`✅ ${name} succeeded`, result.data);
    } catch (error) {
      addResult(name, false, null, error);
      console.error(`❌ ${name} failed`, error);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>🔧 Debug API</h2>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => testAPI('Health', () => healthAPI.check())}>
          Test Health
        </button>
        <button onClick={() => testAPI('Tournaments', () => tournamentAPI.getTournaments())}>
          Test Tournaments
        </button>
        <button onClick={() => testAPI('Users', () => userAPI.getAllUsers())}>
          Test Users
        </button>
      </div>

      <div>
        {results.map((result, index) => (
          <div
            key={index}
            style={{
              margin: '10px 0',
              padding: '10px',
              background: result.success ? '#d4f4dd' : '#f4d4d4',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          >
            <strong>{result.success ? '✅' : '❌'} {result.test}</strong>
            <small style={{ float: 'right' }}>{result.timestamp}</small>
            {result.success ? (
              <pre style={{ marginTop: '10px', fontSize: '12px', overflow: 'auto' }}>
                {JSON.stringify(result.data, null, 2)}
              </pre>
            ) : (
              <div style={{ color: 'red', marginTop: '10px' }}>
                {result.error}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Debug;