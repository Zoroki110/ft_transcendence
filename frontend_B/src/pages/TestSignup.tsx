// frontend_B/src/pages/TestSignup.tsx - Page de test d'inscription isolée
import React, { useState } from 'react';
import { authAPI } from '../services/api';

const TestSignup: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    console.log('🔄 Début test inscription:', formData);

    try {
      const response = await authAPI.register(formData.username, formData.email, formData.password);
      console.log('✅ Réponse réussie:', response);

      setResult({
        success: true,
        data: response.data,
        message: 'Inscription réussie!'
      });
    } catch (error: any) {
      console.error('❌ Erreur inscription:', error);

      setResult({
        success: false,
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'monospace' }}>
      <h1>🧪 Test d'inscription isolé</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Nom d'utilisateur:</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            required
            style={{ padding: '8px', width: '100%', maxWidth: '300px' }}
            placeholder="testuser"
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            style={{ padding: '8px', width: '100%', maxWidth: '300px' }}
            placeholder="test@example.com"
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Mot de passe:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            required
            style={{ padding: '8px', width: '100%', maxWidth: '300px' }}
            placeholder="password123"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: loading ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Test en cours...' : 'Tester inscription'}
        </button>
      </form>

      {result && (
        <div
          style={{
            padding: '15px',
            borderRadius: '8px',
            border: `2px solid ${result.success ? '#4CAF50' : '#f44336'}`,
            backgroundColor: result.success ? '#e8f5e8' : '#ffe8e8'
          }}
        >
          <h3 style={{ margin: '0 0 10px 0' }}>
            {result.success ? '✅ Succès' : '❌ Erreur'}
          </h3>

          {result.success ? (
            <div>
              <p><strong>Message:</strong> {result.message}</p>
              <details>
                <summary>Voir les données retournées</summary>
                <pre style={{ background: '#f5f5f5', padding: '10px', marginTop: '10px', overflow: 'auto' }}>
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <div>
              <p><strong>Erreur:</strong> {result.error}</p>
              <p><strong>Status HTTP:</strong> {result.status}</p>
              {result.response && (
                <details>
                  <summary>Voir la réponse d'erreur</summary>
                  <pre style={{ background: '#f5f5f5', padding: '10px', marginTop: '10px', overflow: 'auto' }}>
                    {JSON.stringify(result.response, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        <h3>💡 Instructions</h3>
        <ol>
          <li>Assurez-vous que le backend est démarré sur http://localhost:3000</li>
          <li>Remplissez les champs du formulaire</li>
          <li>Cliquez sur "Tester inscription"</li>
          <li>Vérifiez les logs dans la console du navigateur (F12)</li>
          <li>Regardez le résultat affiché ci-dessus</li>
        </ol>
      </div>
    </div>
  );
};

export default TestSignup;