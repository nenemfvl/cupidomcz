import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Heart, X, Star, MapPin, Filter, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

interface User {
  _id: string;
  name: string;
  age: number;
  gender: string;
  bio?: string;
  location?: {
    address?: {
      neighborhood?: string;
      city?: string;
      state?: string;
    };
  };
  photos?: Array<{
    url: string;
    isMain: boolean;
  }>;
  lookingFor: string;
  compatibility: number;
}

const Discover: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    ageMin: 18,
    ageMax: 100,
    distance: 50,
    lookingFor: 'todos'
  });

  // Buscar usuários para matching
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const token = localStorage.getItem('cupido_token');
      const response = await axios.get(`${API_BASE_URL}/discovery`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUsers(response.data.users);
      setCurrentUserIndex(0);
    } catch (error: any) {
      console.error('Erro ao buscar usuários:', error);
      setError(error.response?.data?.error || 'Erro ao buscar usuários');
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar usuários ao montar o componente
  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user]);

  // Dar like em um usuário
  const handleLike = async (userId: string) => {
    try {
      const token = localStorage.getItem('cupido_token');
      const response = await axios.post(`${API_BASE_URL}/discovery/like/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.isMatch) {
        // É um match! 🎉
        alert(`🎉 MATCH! Você e ${response.data.matchedUser.name} gostaram um do outro!`);
        // Redirecionar para matches ou chat
      } else {
        // Like enviado
        console.log('Like enviado!');
      }

      // Passar para o próximo usuário
      nextUser();
    } catch (error: any) {
      console.error('Erro ao dar like:', error);
      alert(error.response?.data?.error || 'Erro ao dar like');
    }
  };

  // Passar de um usuário
  const handlePass = async (userId: string) => {
    try {
      const token = localStorage.getItem('cupido_token');
      await axios.post(`${API_BASE_URL}/discovery/pass/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Passar para o próximo usuário
      nextUser();
    } catch (error: any) {
      console.error('Erro ao passar usuário:', error);
      alert('Erro ao passar usuário');
    }
  };

  // Próximo usuário
  const nextUser = () => {
    setCurrentUserIndex(prev => prev + 1);
  };

  // Aplicar filtros
  const applyFilters = () => {
    setShowFilters(false);
    fetchUsers(); // Recarregar com novos filtros
  };

  // Resetar filtros
  const resetFilters = () => {
    setFilters({
      ageMin: 18,
      ageMax: 100,
      distance: 50,
      lookingFor: 'todos'
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Faça login para descobrir pessoas</h1>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-pink-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Buscando pessoas...</h2>
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
            onClick={fetchUsers}
            className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (currentUserIndex >= users.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="w-24 h-24 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-12 h-12 text-pink-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Nenhuma pessoa encontrada</h2>
            <p className="text-gray-600 mb-6">
              Por enquanto, não há mais pessoas para você conhecer na sua área. 
              Tente ajustar os filtros ou volte mais tarde!
            </p>
            <div className="space-y-3">
              <button
                onClick={resetFilters}
                className="w-full bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 transition-colors"
              >
                Resetar Filtros
              </button>
              <button
                onClick={fetchUsers}
                className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Buscar Novamente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentUser = users[currentUserIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Descobrir</h1>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
          >
            <Filter className="w-5 h-5 text-pink-500" />
          </button>
        </div>

        {/* Filtros */}
        {showFilters && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Filtros</h3>
            
            <div className="space-y-4">
              {/* Faixa etária */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Faixa etária: {filters.ageMin} - {filters.ageMax} anos
                </label>
                <div className="flex space-x-2">
                  <input
                    type="range"
                    min="18"
                    max="100"
                    value={filters.ageMin}
                    onChange={(e) => setFilters(prev => ({ ...prev, ageMin: parseInt(e.target.value) }))}
                    className="flex-1"
                  />
                  <input
                    type="range"
                    min="18"
                    max="100"
                    value={filters.ageMax}
                    onChange={(e) => setFilters(prev => ({ ...prev, ageMax: parseInt(e.target.value) }))}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Distância */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Distância máxima: {filters.distance}km
                </label>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={filters.distance}
                  onChange={(e) => setFilters(prev => ({ ...prev, distance: parseInt(e.target.value) }))}
                  className="w-full"
                />
              </div>

              {/* Procurando por */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Procurando por
                </label>
                <select
                  value={filters.lookingFor}
                  onChange={(e) => setFilters(prev => ({ ...prev, lookingFor: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="todos">Todos</option>
                  <option value="masculino">Homens</option>
                  <option value="feminino">Mulheres</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={applyFilters}
                className="flex-1 bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors"
              >
                Aplicar
              </button>
              <button
                onClick={resetFilters}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Resetar
              </button>
            </div>
          </div>
        )}

        {/* Card do usuário */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Foto principal */}
          <div className="relative h-96 bg-gray-200">
            {currentUser.photos && currentUser.photos.length > 0 ? (
              <img
                src={currentUser.photos.find(p => p.isMain)?.url || currentUser.photos[0].url}
                alt={currentUser.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4"></div>
                  <p>Sem foto</p>
                </div>
              </div>
            )}

            {/* Score de compatibilidade */}
            <div className="absolute top-4 right-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="text-sm font-semibold text-gray-800">
                {currentUser.compatibility}%
              </span>
            </div>

            {/* Localização */}
            {currentUser.location?.address && (
              <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1">
                <MapPin className="w-4 h-4 text-pink-500" />
                <span className="text-sm font-medium text-gray-800">
                  {currentUser.location.address.neighborhood || currentUser.location.address.city}
                </span>
              </div>
            )}
          </div>

          {/* Informações do usuário */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{currentUser.name}</h2>
                <p className="text-gray-600">{currentUser.age} anos</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Procurando por</p>
                <p className="text-sm font-medium text-gray-700 capitalize">
                  {currentUser.lookingFor === 'todos' ? 'Todos' : currentUser.lookingFor}
                </p>
              </div>
            </div>

            {/* Bio */}
            {currentUser.bio && (
              <p className="text-gray-700 mb-6 leading-relaxed">{currentUser.bio}</p>
            )}

            {/* Botões de ação */}
            <div className="flex space-x-4">
              <button
                onClick={() => handlePass(currentUser._id)}
                className="flex-1 bg-gray-200 text-gray-700 p-4 rounded-full hover:bg-gray-300 transition-colors flex items-center justify-center"
              >
                <X className="w-8 h-8" />
              </button>
              
              <button
                onClick={() => handleLike(currentUser._id)}
                className="flex-1 bg-pink-500 text-white p-4 rounded-full hover:bg-pink-600 transition-colors flex items-center justify-center"
              >
                <Heart className="w-8 h-8 fill-current" />
              </button>
            </div>
          </div>
        </div>

        {/* Indicador de progresso */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {currentUserIndex + 1} de {users.length} pessoas
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-pink-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentUserIndex + 1) / users.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Discover;
