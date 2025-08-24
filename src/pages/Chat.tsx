import React from 'react';

const Chat: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">💕</h1>
          <h2 className="text-3xl font-bold text-gray-900">Chat</h2>
          <p className="text-gray-600 mt-2">Converse com seus matches</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <p className="text-gray-600">Funcionalidade de chat em desenvolvimento...</p>
          <p className="text-sm text-gray-500 mt-2">Em breve você poderá conversar em tempo real com seus matches!</p>
        </div>
      </div>
    </div>
  );
};

export default Chat;
