import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, MoreVertical, Phone, Video, Image, Smile, MessageCircle } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

interface Conversation {
  matchId: string;
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

interface Message {
  _id: string;
  content: string;
  sender: {
    _id: string;
    name: string;
  };
  isRead: boolean;
  createdAt: string;
}

const Chat: React.FC = () => {
  const { user } = useAuth();
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Buscar conversas do usuário
  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('cupido_token');
      const response = await axios.get(`${API_BASE_URL}/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setConversations(response.data.conversations);
      
      // Se há um matchId na URL, definir como conversa atual
      if (matchId) {
        const conversation = response.data.conversations.find((c: Conversation) => c.matchId === matchId);
        if (conversation) {
          setCurrentConversation(conversation);
          fetchMessages(matchId);
        }
      }
    } catch (error: any) {
      console.error('Erro ao buscar conversas:', error);
      setError(error.response?.data?.error || 'Erro ao buscar conversas');
    } finally {
      setIsLoading(false);
    }
  };

  // Buscar mensagens de uma conversa
  const fetchMessages = async (conversationId: string) => {
    try {
      const token = localStorage.getItem('cupido_token');
      const response = await axios.get(`${API_BASE_URL}/chat/messages/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessages(response.data.messages);
      scrollToBottom();
    } catch (error: any) {
      console.error('Erro ao buscar mensagens:', error);
      alert('Erro ao carregar mensagens');
    }
  };

  // Enviar mensagem
  const sendMessage = async () => {
    if (!newMessage.trim() || !currentConversation) return;

    try {
      setIsSending(true);
      const token = localStorage.getItem('cupido_token');
      const response = await axios.post(`${API_BASE_URL}/chat/message`, {
        matchId: currentConversation.matchId,
        content: newMessage.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Adicionar mensagem à lista
      setMessages(prev => [...prev, response.data.data]);
      setNewMessage('');
      scrollToBottom();

      // Atualizar conversas
      fetchConversations();
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      alert(error.response?.data?.error || 'Erro ao enviar mensagem');
    } finally {
      setIsSending(false);
    }
  };

  // Selecionar conversa
  const selectConversation = (conversation: Conversation) => {
    setCurrentConversation(conversation);
    fetchMessages(conversation.matchId);
    navigate(`/chat/${conversation.matchId}`);
  };

  // Scroll para o final das mensagens
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Formatar data (removido pois não está sendo usado)

  // Formatar hora
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Carregar dados ao montar o componente
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  // Scroll automático para novas mensagens
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Faça login para acessar o chat</h1>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Carregando conversas...</h2>
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
            onClick={fetchConversations}
            className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="w-24 h-24 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-12 h-12 text-pink-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Nenhuma conversa ainda</h2>
            <p className="text-gray-600 mb-6">
              Você precisa ter matches para poder conversar. 
              Continue descobrindo pessoas para fazer novas conexões!
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="flex h-screen">
        {/* Lista de conversas */}
        <div className="w-full md:w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">💬 Conversas</h1>
            <p className="text-sm text-gray-600">{conversations.length} conversa{conversations.length !== 1 ? 's' : ''}</p>
          </div>

          {/* Lista de conversas */}
          <div className="flex-1 overflow-y-auto">
            {conversations.map((conversation) => (
              <div
                key={conversation.matchId}
                onClick={() => selectConversation(conversation)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  currentConversation?.matchId === conversation.matchId ? 'bg-pink-50 border-pink-200' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  {/* Foto do usuário */}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                      {conversation.user.photos && conversation.user.photos.length > 0 ? (
                        <img
                          src={conversation.user.photos.find(p => p.isMain)?.url || conversation.user.photos[0].url}
                          alt={conversation.user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                        </div>
                      )}
                    </div>
                    
                    {/* Indicador de mensagens não lidas */}
                    {conversation.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                      </div>
                    )}
                  </div>

                  {/* Informações da conversa */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{conversation.user.name}</h3>
                      {conversation.lastMessage && (
                        <span className="text-xs text-gray-500">
                          {formatTime(conversation.lastMessage.timestamp)}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm text-gray-600">{conversation.user.age} anos</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-gray-600 capitalize">{conversation.user.gender}</span>
                    </div>

                    {/* Última mensagem */}
                    {conversation.lastMessage ? (
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.lastMessage.sender === user.name ? 'Você' : conversation.user.name}: {conversation.lastMessage.content}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 italic">Nova conversa</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Área de chat */}
        <div className="flex-1 flex flex-col bg-white">
          {currentConversation ? (
            <>
              {/* Header do chat */}
              <div className="p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        setCurrentConversation(null);
                        navigate('/chat');
                      }}
                      className="md:hidden p-2 hover:bg-gray-100 rounded-full"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    
                    {/* Foto do usuário */}
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                      {currentConversation.user.photos && currentConversation.user.photos.length > 0 ? (
                        <img
                          src={currentConversation.user.photos.find(p => p.isMain)?.url || currentConversation.user.photos[0].url}
                          alt={currentConversation.user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h2 className="font-semibold text-gray-900">{currentConversation.user.name}</h2>
                      <p className="text-sm text-gray-600">
                        {currentConversation.user.age} anos • {currentConversation.user.gender}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="p-2 hover:bg-gray-100 rounded-full">
                      <Phone className="w-5 h-5 text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-full">
                      <Video className="w-5 h-5 text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-full">
                      <MoreVertical className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message._id}
                    className={`flex ${message.sender._id === user._id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                        message.sender._id === user._id
                          ? 'bg-pink-500 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender._id === user._id ? 'text-pink-100' : 'text-gray-500'
                      }`}>
                        {formatTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input de mensagem */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex items-center space-x-3">
                  <button className="p-2 hover:bg-gray-100 rounded-full">
                    <Image className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-full">
                    <Smile className="w-5 h-5 text-gray-600" />
                  </button>
                  
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    disabled={isSending}
                  />
                  
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || isSending}
                    className="p-3 bg-pink-500 text-white rounded-full hover:bg-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Tela inicial do chat */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageCircle className="w-12 h-12 text-pink-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Selecione uma conversa</h2>
                <p className="text-gray-600">
                  Escolha uma conversa na lista ao lado para começar a conversar
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
