import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Calendar, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

interface Match {
  id: string;
  user: {
    id: string;
    name: string;
    age: number;
    gender: string;
    photos?: Array<{
      url: string;
      isMain: boolean;
    }>;
  };
  lastMessage?: {
    content: string;
    timestamp: string;
    sender: string;
  };
  unreadCount: number;
  matchedAt: string;
}

const Matches: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Buscar matches do usuário
  const fetchMatches = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const token = localStorage.getItem('cupido_token');
      const response = await axios.get(`${API_BASE_URL}/discovery/matches`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMatches(response.data.matches);
    } catch (error: any) {
      console.error('Erro ao buscar matches:', error);
      setError(error.response?.data?.error || 'Erro ao buscar matches');
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar matches ao montar o componente
  useEffect(() => {
    if (user) {
      fetchMatches();
    }
  }, [user]);

  // Abrir chat com um match
  const openChat = (matchId: string) => {
    navigate(`/chat/${matchId}`);
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Hoje';
    if (diffDays === 2) return 'Ontem';
    if (diffDays <= 7) return `${diffDays - 1} dias atrás`;
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  // Formatar hora da última mensagem
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Faça login para ver seus matches</h1>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-pink-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Carregando matches...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Erro: {error}</h2>
          <button
            onClick={fetchMatches}
            className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="w-24 h-24 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-12 h-12 text-pink-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Nenhum match ainda</h2>
            <p className="text-gray-600 mb-6">
              Continue descobrindo pessoas! Quando houver um match mútuo, 
              vocês aparecerão aqui e poderão conversar.
            </p>
            <button
              onClick={() => navigate('/discover')}
              className="w-full bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 transition-colors"
            >
              Descobrir Pessoas
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">💕 Seus Matches</h1>
          <p className="text-gray-600">
            {matches.length} {matches.length === 1 ? 'pessoa' : 'pessoas'} que gostaram de você também!
          </p>
        </div>

        {/* Lista de matches */}
        <div className="space-y-4">
          {matches.map((match) => (
            <div
              key={match.id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => openChat(match.id)}
            >
              <div className="p-6">
                <div className="flex items-center space-x-4">
                  {/* Foto do match */}
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200">
                      {match.user.photos && match.user.photos.length > 0 ? (
                        <img
                          src={match.user.photos.find(p => p.isMain)?.url || match.user.photos[0].url}
                          alt={match.user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                        </div>
                      )}
                    </div>
                    
                    {/* Indicador de mensagens não lidas */}
                    {match.unreadCount > 0 && (
                      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                        {match.unreadCount > 9 ? '9+' : match.unreadCount}
                      </div>
                    )}
                  </div>

                  {/* Informações do match */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{match.user.name}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(match.matchedAt)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 mb-3">
                      <span className="text-gray-600">{match.user.age} anos</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600 capitalize">{match.user.gender}</span>
                    </div>

                    {/* Última mensagem */}
                    {match.lastMessage ? (
                      <div className="mb-3">
                        <p className="text-sm text-gray-500 mb-1">
                          {match.lastMessage.sender === user.name ? 'Você' : match.user.name}:
                        </p>
                        <p className="text-gray-700 line-clamp-2">
                          {match.lastMessage.content}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTime(match.lastMessage.timestamp)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm mb-3">
                        Comece uma conversa com {match.user.name}!
                      </p>
                    )}
                  </div>

                  {/* Botão de chat */}
                  <div className="flex flex-col items-center space-y-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openChat(match.id);
                      }}
                      className="bg-pink-500 text-white p-3 rounded-full hover:bg-pink-600 transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </button>
                    
                    {match.unreadCount > 0 && (
                      <span className="text-xs text-pink-600 font-medium">
                        {match.unreadCount} nova{match.unreadCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Estatísticas */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">📊 Estatísticas</h3>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-pink-500">{matches.length}</div>
              <div className="text-sm text-gray-600">Total de matches</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-500">
                {matches.filter(m => m.unreadCount > 0).length}
              </div>
              <div className="text-sm text-gray-600">Conversas ativas</div>
            </div>
          </div>
        </div>

        {/* Dicas */}
        <div className="mt-6 bg-pink-50 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-pink-800 mb-3">💡 Dicas para seus matches</h3>
          <ul className="text-sm text-pink-700 space-y-2">
            <li>• Seja você mesmo e seja respeitoso</li>
            <li>• Inicie conversas interessantes sobre interesses em comum</li>
            <li>• Responda às mensagens para manter a conversa ativa</li>
            <li>• Combine encontros em lugares públicos e seguros</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Matches;
