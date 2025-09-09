import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useTranslations } from '../hooks/useTranslations';

const Home: React.FC = () => {
  const { t } = useTranslations();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="container mx-auto px-4 text-center">
        <div className="animate-float mb-8">
          <h1 className="text-6xl font-bold text-gradient mb-4">
            🏓 PONG ARENA
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            {t('common.welcome')} dans l'univers du combat ultime
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          <Card hover glow className="p-8 text-center">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-xl font-bold mb-2 text-cyan-300">Tournois Épiques</h3>
            <p className="text-gray-400 mb-4">Participez aux tournois les plus intenses</p>
            <Link to="/tournaments">
              <Button variant="primary" icon="⚡">
                Voir les Tournois
              </Button>
            </Link>
          </Card>

          <Card hover glow className="p-8 text-center">
            <div className="text-4xl mb-4">⚔️</div>
            <h3 className="text-xl font-bold mb-2 text-purple-300">Créer l'Arène</h3>
            <p className="text-gray-400 mb-4">Organisez votre propre tournoi</p>
            <Link to="/tournaments/create">
              <Button variant="secondary" icon="🚀">
                Créer un Tournoi
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Home;
