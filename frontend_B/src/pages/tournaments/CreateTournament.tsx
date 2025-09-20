import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { tournamentService } from '../../services/tournamentService';

const CreateTournament: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'SINGLE_ELIMINATION',
    maxParticipants: 8
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await tournamentService.createTournament(formData);
      navigate('/tournaments');
    } catch (error) {
      console.error('Erreur:', error);
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
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gradient mb-4">
          ⚡ CRÉER NOUVELLE ARÈNE
        </h1>
        <p className="text-gray-400">Configurez votre terrain de combat ultime</p>
      </div>

      <Card className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              🏆 Nom de l'Arène
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full p-4 glass rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
              placeholder="Ex: Championnat Galactique 2024"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              📜 Description de la Mission
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full p-4 glass rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
              placeholder="Décrivez votre tournoi épique..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                ⚔️ Mode de Combat
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full p-4 glass rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
              >
                <option value="SINGLE_ELIMINATION">⚡ Élimination Simple</option>
                <option value="DOUBLE_ELIMINATION">⚔️ Élimination Double</option>
                <option value="ROUND_ROBIN">🔄 Round Robin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                👥 Combattants Max
              </label>
              <select
                name="maxParticipants"
                value={formData.maxParticipants}
                onChange={handleChange}
                className="w-full p-4 glass rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              >
                <option value={4}>4 Guerriers</option>
                <option value={8}>8 Guerriers</option>
                <option value={16}>16 Guerriers</option>
                <option value={32}>32 Guerriers</option>
              </select>
            </div>
          </div>

          <div className="flex space-x-4 pt-6">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={() => navigate('/tournaments')}
            >
              🚫 Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              loading={loading}
              icon="⚡"
            >
              LANCER L'ARÈNE
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreateTournament;
