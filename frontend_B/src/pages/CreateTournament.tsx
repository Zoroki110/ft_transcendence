// frontend_B/src/pages/CreateTournament.tsx - FORMULAIRE COMPLET

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTournaments, CreateTournamentData } from '../contexts/TournamentContext';

const CreateTournament: React.FC = () => {
  const navigate = useNavigate();
  const { createTournament } = useTournaments();

  // State du formulaire
  const [formData, setFormData] = useState<CreateTournamentData>({
    name: '',
    description: '',
    type: 'single_elimination',
    maxParticipants: 8,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Options pour les selects
  const tournamentTypes = [
    { value: 'single_elimination', label: '🏆 Élimination simple', description: 'Un seul match perdu = éliminé' },
    { value: 'double_elimination', label: '🏆🏆 Élimination double', description: 'Deux chances, plus équitable' },
    { value: 'round_robin', label: '🔄 Round Robin', description: 'Tout le monde joue contre tout le monde' },
  ];

  const participantOptions = [4, 8, 16, 32, 64];

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom du tournoi est requis';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Le nom doit faire au moins 3 caractères';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Le nom ne peut pas dépasser 50 caractères';
    }

    if (formData.description && formData.description.length > 200) {
      newErrors.description = 'La description ne peut pas dépasser 200 caractères';
    }

    if (formData.maxParticipants < 2) {
      newErrors.maxParticipants = 'Il faut au moins 2 participants';
    } else if (formData.maxParticipants > 64) {
      newErrors.maxParticipants = 'Maximum 64 participants';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gestion des changements
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'maxParticipants' ? parseInt(value) : value
    }));

    // Effacer l'erreur si l'utilisateur corrige
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Soumission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simuler un délai d'API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Créer le tournoi
      const newTournament = createTournament(formData);
      
      console.log('🎉 Tournoi créé avec succès:', newTournament);
      
      // Rediriger vers la liste des tournois
      navigate('/tournaments');
      
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      setErrors({ general: 'Erreur lors de la création du tournoi' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <section className="page-header">
        <div className="container">
          <h1 className="page-title">⚔️ Créer un Tournoi</h1>
          <p className="page-subtitle">Organisez votre tournoi et invitez vos adversaires</p>
        </div>
      </section>

      <div className="container">
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          
          {/* Formulaire principal */}
          <form onSubmit={handleSubmit} className="card">
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>
              📋 Informations du Tournoi
            </h2>

            {/* Erreur générale */}
            {errors.general && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--danger)',
                borderRadius: '6px',
                padding: '1rem',
                marginBottom: '1rem',
                color: 'var(--danger)'
              }}>
                ❌ {errors.general}
              </div>
            )}

            {/* Nom du tournoi */}
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                🏆 Nom du tournoi *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`input ${errors.name ? 'error' : ''}`}
                placeholder="Ex: Championship Pong 2024"
                maxLength={50}
                style={{
                  borderColor: errors.name ? 'var(--danger)' : undefined
                }}
              />
              {errors.name && (
                <div style={{ color: 'var(--danger)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  {errors.name}
                </div>
              )}
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                {formData.name.length}/50 caractères
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label htmlFor="description" className="form-label">
                📝 Description (optionnel)
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className={`input ${errors.description ? 'error' : ''}`}
                placeholder="Décrivez votre tournoi, les règles particulières..."
                rows={3}
                maxLength={200}
                style={{
                  borderColor: errors.description ? 'var(--danger)' : undefined,
                  resize: 'vertical',
                  minHeight: '80px'
                }}
              />
              {errors.description && (
                <div style={{ color: 'var(--danger)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  {errors.description}
                </div>
              )}
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                {(formData.description || '').length}/200 caractères
              </div>
            </div>

            {/* Type de tournoi */}
            <div className="form-group">
              <label htmlFor="type" className="form-label">
                🎯 Type de tournoi
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="input"
              >
                {tournamentTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              
              {/* Description du type sélectionné */}
              <div style={{
                marginTop: '0.5rem',
                padding: '0.75rem',
                background: 'rgba(102, 126, 234, 0.05)',
                borderRadius: '6px',
                fontSize: '0.9rem',
                color: 'var(--gray-700)'
              }}>
                💡 {tournamentTypes.find(t => t.value === formData.type)?.description}
              </div>
            </div>

            {/* Nombre de participants */}
            <div className="form-group">
              <label htmlFor="maxParticipants" className="form-label">
                👥 Nombre maximum de participants
              </label>
              <select
                id="maxParticipants"
                name="maxParticipants"
                value={formData.maxParticipants}
                onChange={handleChange}
                className={`input ${errors.maxParticipants ? 'error' : ''}`}
                style={{
                  borderColor: errors.maxParticipants ? 'var(--danger)' : undefined
                }}
              >
                {participantOptions.map(num => (
                  <option key={num} value={num}>
                    {num} joueurs
                  </option>
                ))}
              </select>
              {errors.maxParticipants && (
                <div style={{ color: 'var(--danger)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  {errors.maxParticipants}
                </div>
              )}
            </div>

            {/* Aperçu */}
            <div style={{
              marginTop: '2rem',
              padding: '1.5rem',
              background: 'var(--gray-100)',
              borderRadius: '8px',
              border: '2px dashed var(--gray-300)'
            }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>
                👀 Aperçu du tournoi
              </h3>
              
              <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.9rem' }}>
                <div><strong>Nom:</strong> {formData.name || 'Sans nom'}</div>
                <div><strong>Type:</strong> {tournamentTypes.find(t => t.value === formData.type)?.label}</div>
                <div><strong>Participants:</strong> {formData.maxParticipants} maximum</div>
                {formData.description && (
                  <div><strong>Description:</strong> {formData.description}</div>
                )}
                <div><strong>Statut initial:</strong> 📝 Brouillon</div>
              </div>
            </div>

            {/* Boutons */}
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              justifyContent: 'flex-end',
              marginTop: '2rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--gray-200)'
            }}>
              <button
                type="button"
                onClick={() => navigate('/tournaments')}
                className="btn btn-secondary"
                disabled={isSubmitting}
              >
                ❌ Annuler
              </button>
              
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting || !formData.name.trim()}
                style={{
                  opacity: isSubmitting || !formData.name.trim() ? 0.6 : 1,
                  cursor: isSubmitting || !formData.name.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? '⏳ Création...' : '🚀 Créer le tournoi'}
              </button>
            </div>
          </form>

          {/* Aide */}
          <div className="card" style={{ marginTop: '1rem', background: 'rgba(16, 185, 129, 0.05)' }}>
            <h4 style={{ color: 'var(--success)', marginBottom: '1rem' }}>
              💡 Conseils pour créer un bon tournoi
            </h4>
            <ul style={{ color: 'var(--gray-700)', paddingLeft: '1.5rem', lineHeight: '1.6' }}>
              <li><strong>Nom accrocheur:</strong> Choisissez un nom qui donne envie de participer</li>
              <li><strong>Description claire:</strong> Expliquez les règles et l'ambiance du tournoi</li>
              <li><strong>Taille adaptée:</strong> 8-16 participants pour un bon équilibre</li>
              <li><strong>Élimination simple:</strong> Plus rapide, idéal pour débuter</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTournament;