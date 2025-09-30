// frontend_B/src/pages/ManageTournament/ManageTournament.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tournamentAPI } from '../../services/api';
import { useUser } from '../../contexts/UserContext';
import { Tournament, UpdateTournamentDto } from '../../types';
import './ManageTournament.css';

const ManageTournament: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxParticipants: 8,
    type: 'single_elimination',
    isPublic: true
  });

  useEffect(() => {
    loadTournament();
  }, [id]);

  const loadTournament = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await tournamentAPI.getTournament(parseInt(id));
      const tournamentData = response.data;
      
      // Vérifier que l'utilisateur est le créateur
      if (tournamentData.creator?.id !== user?.id) {
        setError('Vous n\'êtes pas autorisé à gérer ce tournoi');
        return;
      }
      
      setTournament(tournamentData);
      setFormData({
        name: tournamentData.name || '',
        description: tournamentData.description || '',
        maxParticipants: tournamentData.maxParticipants || 8,
        type: tournamentData.type || 'single_elimination',
        isPublic: tournamentData.isPublic ?? true
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !tournament) return;

    try {
      setSaving(true);
      setError(null);

      const updateData: UpdateTournamentDto = {
        name: formData.name,
        description: formData.description,
        maxParticipants: formData.maxParticipants,
        type: formData.type as any,
        isPublic: formData.isPublic
      };

      await tournamentAPI.updateTournament(parseInt(id), updateData);
      navigate(`/tournaments/${id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur de mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !tournament) return;
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce tournoi ?')) return;

    try {
      await tournamentAPI.deleteTournament(parseInt(id));
      navigate('/tournaments');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur de suppression');
    }
  };

  if (loading) {
    return (
      <div className="manage-tournament-page">
        <div className="container">
          <div className="loading">⏳ Chargement...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="manage-tournament-page">
        <div className="container">
          <div className="error-message">⚠️ {error}</div>
          <button onClick={() => navigate('/tournaments')} className="btn btn-primary">
            Retour aux tournois
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-tournament-page">
      <div className="container">
        <div className="page-header">
          <h1>⚙️ Gérer le tournoi</h1>
          <button 
            onClick={() => navigate(`/tournaments/${id}`)} 
            className="btn btn-secondary"
          >
            ← Retour au tournoi
          </button>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="tournament-form">
            <div className="form-group">
              <label className="form-label">Nom du tournoi</label>
              <input
                type="text"
                className="input"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="input"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nombre maximum de participants</label>
                <select
                  className="input"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData(prev => ({...prev, maxParticipants: parseInt(e.target.value)}))}
                >
                  <option value={4}>4 participants</option>
                  <option value={8}>8 participants</option>
                  <option value={16}>16 participants</option>
                  <option value={32}>32 participants</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Type de tournoi</label>
                <select
                  className="input"
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({...prev, type: e.target.value}))}
                >
                  <option value="single_elimination">🏆 Élimination simple</option>
                  <option value="double_elimination">🏆🏆 Élimination double</option>
                  <option value="round_robin">🔄 Round Robin</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData(prev => ({...prev, isPublic: e.target.checked}))}
                />
                Tournoi public
              </label>
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? '⏳ Sauvegarde...' : '💾 Sauvegarder'}
              </button>
              
              <button 
                type="button"
                onClick={handleDelete}
                className="btn btn-danger"
                disabled={saving}
              >
                🗑️ Supprimer le tournoi
              </button>
            </div>
          </form>
        </div>

        {tournament && (
          <div className="card tournament-info">
            <h3>📊 Informations du tournoi</h3>
            <div className="info-grid">
              <div className="info-item">
                <strong>Statut:</strong> {tournament.status}
              </div>
              <div className="info-item">
                <strong>Participants:</strong> {tournament.currentParticipants}/{tournament.maxParticipants}
              </div>
              <div className="info-item">
                <strong>Créé le:</strong> {new Date(tournament.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageTournament;