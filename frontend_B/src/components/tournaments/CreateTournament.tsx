// frontend_B/src/components/tournaments/CreateTournament.tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { tournamentService } from '../../services/tournamentService';

const CreateTournament: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'SINGLE_ELIMINATION',
    maxParticipants: 8,
    registrationStart: '',
    registrationEnd: '',
    startDate: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tournament = await tournamentService.createTournament(formData);
      navigate(`/tournaments/${tournament.id}`);
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      // Gestion d'erreur à implémenter
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'maxParticipants' ? parseInt(value) : value
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">{t('tournaments.create')}</h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium mb-2">{t('tournaments.form.name')}</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder={t('tournaments.form.namePlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">{t('tournaments.form.description')}</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder={t('tournaments.form.descriptionPlaceholder')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">{t('tournaments.form.type')}</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="SINGLE_ELIMINATION">{t('tournaments.types.single_elimination')}</option>
              <option value="DOUBLE_ELIMINATION">{t('tournaments.types.double_elimination')}</option>
              <option value="ROUND_ROBIN">{t('tournaments.types.round_robin')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('tournaments.form.maxParticipants')}</label>
            <select
              name="maxParticipants"
              value={formData.maxParticipants}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value={4}>4 joueurs</option>
              <option value={8}>8 joueurs</option>
              <option value={16}>16 joueurs</option>
              <option value={32}>32 joueurs</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">{t('tournaments.form.registrationStart')}</label>
            <input
              type="datetime-local"
              name="registrationStart"
              value={formData.registrationStart}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('tournaments.form.registrationEnd')}</label>
            <input
              type="datetime-local"
              name="registrationEnd"
              value={formData.registrationEnd}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('tournaments.form.startDate')}</label>
            <input
              type="datetime-local"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => navigate('/tournaments')}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg disabled:opacity-50"
          >
            {loading ? t('common.loading') : t('tournaments.form.create')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTournament;