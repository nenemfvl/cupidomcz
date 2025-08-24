import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Profile: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Perfil não encontrado</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Meu Perfil</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Informações Básicas</h2>
              <p><strong>Nome:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Idade:</strong> {user.age} anos</p>
              <p><strong>Gênero:</strong> {user.gender}</p>
              <p><strong>Procurando por:</strong> {user.lookingFor}</p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Localização</h2>
              <p><strong>Bairro:</strong> {user.location?.address?.neighborhood}</p>
              <p><strong>Cidade:</strong> {user.location?.address?.city}</p>
              <p><strong>Estado:</strong> {user.location?.address?.state}</p>
            </div>
          </div>
          {user.bio && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Sobre mim</h2>
              <p className="text-gray-700">{user.bio}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
