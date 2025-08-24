import React from 'react';

const Discover: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">💕</h1>
          <h2 className="text-3xl font-bold text-gray-900">Descobrir Pessoas</h2>
          <p className="text-gray-600 mt-2">Encontre pessoas incríveis em Maceió</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <p className="text-gray-600">Funcionalidade de descoberta em desenvolvimento...</p>
          <p className="text-sm text-gray-500 mt-2">Em breve você poderá descobrir e conectar com pessoas incríveis!</p>
        </div>
      </div>
    </div>
  );
};

export default Discover;
