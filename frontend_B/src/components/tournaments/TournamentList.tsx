// frontend_B/src/components/tournaments/TournamentList.tsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

// Types (simplifiés pour commencer)
interface Tournament {
  id: number;
  name: string;
  description?: string;
  type: string;
  status: string;
  maxParticipants: number;
  currentParticipants: number;
  createdAt: string;
}

const TournamentList: React.FC = () => {
  const { t } = useTranslation();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  // Mock data pour les tests
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setTournaments([
        {
          id: 1,
          name: "Championnat d'Automne 2024",
          description: "Un tournoi épique pour célébrer l'automne avec les meilleurs joueurs de Pong !",
          type: "SINGLE_ELIMINATION",
          status: "OPEN",
          maxParticipants: 16,
          currentParticipants: 8,
          createdAt: "2024-09-01"
        },
        {
          id: 2,
          name: "Tournoi des Champions",
          description: "Seuls les plus forts survivront dans cette bataille légendaire.",
          type: "DOUBLE_ELIMINATION",
          status: "IN_PROGRESS",
          maxParticipants: 8,
          currentParticipants: 8,
          createdAt: "2024-08-15"
        },
        {
          id: 3,
          name: "Coupe Débutants",
          description: "Un tournoi parfait pour les nouveaux joueurs qui veulent apprendre.",
          type: "ROUND_ROBIN",
          status: "COMPLETED",
          maxParticipants: 12,
          currentParticipants: 12,
          createdAt: "2024-07-20"
        },
        {
          id: 4,
          name: "Battle Royale Pong",
          description: "Le dernier tournoi debout gagne tout !",
          type: "SINGLE_ELIMINATION",
          status: "FULL",
          maxParticipants: 32,
          currentParticipants: 32,
          createdAt: "2024-09-05"
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredTournaments = tournaments.filter(tournament => {
    if (filter === 'open') return tournament.status === 'OPEN';
    if (filter === 'in_progress') return tournament.status === 'IN_PROGRESS';
    if (filter === 'completed') return tournament.status === 'COMPLETED';
    return true;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { bg: 'bg-gray-800', text: 'text-gray-300', border: 'border-gray-600', label: 'Brouillon' },
      OPEN: { bg: 'bg-green-900/30', text: 'text-green-400', border: 'border-green-500', label: 'Ouvert' },
      FULL: { bg: 'bg-yellow-900/30', text: 'text-yellow-400', border: 'border-yellow-500', label: 'Complet' },
      IN_PROGRESS: { bg: 'bg-blue-900/30', text: 'text-blue-400', border: 'border-blue-500', label: 'En cours' },
      COMPLETED: { bg: 'bg-purple-900/30', text: 'text-purple-400', border: 'border-purple-500', label: 'Terminé' },
      CANCELLED: { bg: 'bg-red-900/30', text: 'text-red-400', border: 'border-red-500', label: 'Annulé' }
    };
    return statusConfig[status] || statusConfig.DRAFT;
  };

  const getTypeLabel = (type: string) => {
    const types = {
      SINGLE_ELIMINATION: '⚡ Élimination Simple',
      DOUBLE_ELIMINATION: '⚔️ Élimination Double',
      ROUND_ROBIN: '🔄 Round Robin'
    };
    return types[type] || type;
  };

  const getProgressPercentage = (current: number, max: number) => {
    return Math.round((current / max) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-r-2 border-cyan-400 mx-auto"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border border-cyan-400/20"></div>
          </div>
          <p className="mt-6 text-lg text-gray-300 animate-pulse">Chargement des tournois...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header avec effet néon */}
      <div className="relative bg-gradient-to-r from-gray-900 via-black to-gray-900 border-b border-gray-800">
        {/* Effet de grille en arrière-plan */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, rgba(255,255,255,0.05) 2px, transparent 0)`,
          backgroundSize: '50px 50px'
        }}></div>
        
        <div className="relative container mx-auto px-4 py-16">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                🏓 PONG ARENA
              </h1>
              <p className="text-gray-400 text-xl">Entrez dans l'arène et prouvez votre valeur</p>
              <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  Système en ligne
                </span>
                <span>•</span>
                <span>{tournaments.length} tournois actifs</span>
              </div>
            </div>
            <Link
              to="/tournaments/create"
              className="group relative bg-gradient-to-r from-cyan-500 to-purple-500 px-8 py-4 rounded-xl font-semibold shadow-2xl hover:shadow-cyan-500/25 transform hover:scale-105 transition-all duration-300 text-black overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center space-x-2">
                <span className="text-2xl">⚡</span>
                <span>CRÉER TOURNOI</span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Statistiques avec effet glassmorphism */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          {[
            { icon: '🎯', label: 'Total', value: tournaments.length, color: 'cyan' },
            { icon: '🟢', label: 'Ouverts', value: tournaments.filter(t => t.status === 'OPEN').length, color: 'green' },
            { icon: '⚡', label: 'En Cours', value: tournaments.filter(t => t.status === 'IN_PROGRESS').length, color: 'yellow' },
            { icon: '🏆', label: 'Terminés', value: tournaments.filter(t => t.status === 'COMPLETED').length, color: 'purple' }
          ].map((stat, index) => (
            <div
              key={index}
              className="relative bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-all duration-300 group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800/20 to-transparent rounded-2xl"></div>
              <div className="relative flex items-center">
                <div className={`p-4 rounded-xl bg-${stat.color}-500/10 border border-${stat.color}-500/30 text-3xl`}>
                  {stat.icon}
                </div>
                <div className="ml-4">
                  <p className="text-3xl font-bold text-white group-hover:scale-110 transition-transform">
                    {stat.value}
                  </p>
                  <p className="text-gray-400">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filtres avec style cyber */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 mb-10">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
            <span className="text-cyan-400 mr-3">⚡</span>
            FILTRES DE COMBAT
          </h3>
          <div className="flex flex-wrap gap-4">
            {[
              { key: 'all', label: 'TOUS', icon: '🎯', color: 'cyan' },
              { key: 'open', label: 'OUVERTS', icon: '🟢', color: 'green' },
              { key: 'in_progress', label: 'COMBAT', icon: '⚡', color: 'yellow' },
              { key: 'completed', label: 'VICTOIRE', icon: '🏆', color: 'purple' }
            ].map(filterOption => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key)}
                className={`group relative px-6 py-3 rounded-xl font-medium transition-all duration-300 border-2 ${
                  filter === filterOption.key
                    ? `bg-${filterOption.color}-500/20 border-${filterOption.color}-400 text-${filterOption.color}-300 shadow-lg shadow-${filterOption.color}-500/25`
                    : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{filterOption.icon}</span>
                  <span>{filterOption.label}</span>
                </div>
                {filter === filterOption.key && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse rounded-xl"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Grille des tournois */}
        {filteredTournaments.length === 0 ? (
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-16 text-center">
            <div className="text-8xl mb-6 opacity-50">💀</div>
            <h3 className="text-2xl font-bold text-white mb-3">AUCUN COMBAT TROUVÉ</h3>
            <p className="text-gray-400 mb-8 text-lg">L'arène est vide... pour l'instant.</p>
            <Link
              to="/tournaments/create"
              className="inline-block bg-gradient-to-r from-cyan-500 to-purple-500 text-black px-8 py-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transform hover:scale-105 transition-all duration-300"
            >
              ⚡ LANCER LE PREMIER COMBAT
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTournaments.map(tournament => {
              const statusBadge = getStatusBadge(tournament.status);
              const progressPercentage = getProgressPercentage(tournament.currentParticipants, tournament.maxParticipants);
              
              return (
                <div
                  key={tournament.id}
                  className="group relative bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-700 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/10 hover:-translate-y-2"
                >
                  {/* Effet de brillance au hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  
                  {/* Header avec gradient */}
                  <div className="relative bg-gradient-to-r from-gray-800 to-gray-900 p-6 border-b border-gray-800">
                    <div className="flex justify-between items-start">
                      <h2 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                        {tournament.name}
                      </h2>
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
                        {statusBadge.label}
                      </span>
                    </div>
                    <div className="absolute top-2 right-2 text-2xl opacity-20 group-hover:opacity-60 transition-opacity">
                      ⚔️
                    </div>
                  </div>

                  {/* Contenu */}
                  <div className="p-6">
                    <p className="text-gray-400 mb-6 leading-relaxed">{tournament.description}</p>
                    
                    {/* Type de tournoi avec style cyber */}
                    <div className="flex items-center mb-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                      <span className="text-2xl mr-3">{getTypeLabel(tournament.type).split(' ')[0]}</span>
                      <span className="font-medium text-gray-300">{getTypeLabel(tournament.type).substring(2)}</span>
                    </div>

                    {/* Participants avec barre néon */}
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-medium text-gray-300 flex items-center">
                          <span className="text-cyan-400 mr-2">👥</span>
                          COMBATTANTS
                        </span>
                        <span className="text-sm text-cyan-400 font-mono">
                          {tournament.currentParticipants}/{tournament.maxParticipants}
                        </span>
                      </div>
                      <div className="relative w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                        <div
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-1000 shadow-lg shadow-cyan-500/30"
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 font-mono">{progressPercentage}% DE CAPACITÉ</p>
                    </div>

                    {/* Date avec style Matrix */}
                    <div className="flex items-center text-sm text-gray-500 mb-6 font-mono">
                      <span className="text-green-400 mr-2">📅</span>
                      <span>INIT: {new Date(tournament.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>

                    {/* Actions avec effets néon */}
                    <div className="flex space-x-3">
                      <Link
                        to={`/tournaments/${tournament.id}`}
                        className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-cyan-500 text-cyan-300 text-center py-3 px-4 rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25"
                      >
                        👁️ SCANNER
                      </Link>
                      
                      {tournament.status === 'OPEN' && tournament.currentParticipants < tournament.maxParticipants && (
                        <button className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-black py-3 px-4 rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25 transform hover:scale-105">
                          ⚡ REJOINDRE
                        </button>
                      )}
                      
                      {tournament.status === 'FULL' && (
                        <button className="flex-1 bg-gray-700 border border-gray-600 text-gray-400 py-3 px-4 rounded-xl font-medium cursor-not-allowed">
                          🚫 SATURÉ
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Call-to-action cyber */}
        <div className="mt-16 relative bg-gradient-to-r from-gray-900 via-black to-gray-900 rounded-2xl p-10 text-center border border-gray-800 overflow-hidden">
          {/* Effet de particules */}
          <div className="absolute inset-0 opacity-30">
            {Array.from({ length: 20 }, (_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`
                }}
              ></div>
            ))}
          </div>
          
          <div className="relative">
            <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              🚀 PRÊT POUR LE COMBAT ?
            </h2>
            <p className="text-gray-400 mb-8 text-lg">
              Créez votre arène et défiez les legends du Pong dans des combats épiques !
            </p>
            <Link
              to="/tournaments/create"
              className="inline-block bg-gradient-to-r from-cyan-500 to-purple-500 text-black px-10 py-4 rounded-xl font-bold shadow-2xl hover:shadow-cyan-500/25 transform hover:scale-110 transition-all duration-300 text-lg"
            >
              ⚡ INITIALISER NOUVELLE ARÈNE
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentList;