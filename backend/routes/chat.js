const express = require('express');
const Match = require('../models/Match');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/chat/conversations
// @desc    Obter todas as conversas do usuário
// @access  Private
router.get('/conversations', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    // Buscar matches com mensagens
    const matches = await Match.find({
      users: req.user.id,
      status: 'matched',
      'messages.0': { $exists: true } // Pelo menos uma mensagem
    })
    .populate('users', 'name age photos location interests occupation isVerified lastActive')
    .populate('messages.sender', 'name photos')
    .sort({ lastInteraction: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

    // Contar total
    const total = await Match.countDocuments({
      users: req.user.id,
      status: 'matched',
      'messages.0': { $exists: true }
    });

    // Formatar conversas
    const conversations = matches.map(match => {
      const otherUser = match.users.find(user => user._id.toString() !== req.user.id);
      const lastMessage = match.messages[match.messages.length - 1];
      const unreadCount = match.messages.filter(msg => 
        !msg.isRead && msg.sender._id.toString() !== req.user.id
      ).length;

      return {
        id: match._id,
        otherUser: {
          id: otherUser._id,
          name: otherUser.name,
          age: otherUser.age,
          photos: otherUser.photos,
          location: otherUser.location,
          interests: otherUser.interests,
          occupation: otherUser.occupation,
          isVerified: otherUser.isVerified,
          lastActive: otherUser.lastActive
        },
        lastMessage: lastMessage ? {
          content: lastMessage.content,
          sender: lastMessage.sender.name,
          timestamp: lastMessage.timestamp,
          isRead: lastMessage.isRead
        } : null,
        unreadCount,
        lastInteraction: match.lastInteraction,
        matchedAt: match.matchedAt
      };
    });

    res.json({
      conversations,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasMore: parseInt(page) * parseInt(limit) < total
      }
    });

  } catch (error) {
    console.error('Erro ao buscar conversas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   GET /api/chat/conversation/:matchId
// @desc    Obter mensagens de uma conversa específica
// @access  Private
router.get('/conversation/:matchId', auth, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    const match = await Match.findById(req.params.matchId)
      .populate('users', 'name age photos location interests occupation isVerified lastActive')
      .populate('messages.sender', 'name photos');

    if (!match) {
      return res.status(404).json({ error: 'Conversa não encontrada' });
    }

    // Verificar se o usuário faz parte do match
    if (!match.users.some(user => user._id.toString() === req.user.id)) {
      return res.status(403).json({ error: 'Não autorizado a acessar esta conversa' });
    }

    // Verificar se o match está ativo
    if (match.status !== 'matched') {
      return res.status(400).json({ error: 'Esta conversa não está mais ativa' });
    }

    // Marcar mensagens como lidas
    await match.markMessagesAsRead(req.user.id);

    // Formatar usuário da conversa
    const otherUser = match.users.find(user => user._id.toString() !== req.user.id);
    
    // Paginar mensagens (mais recentes primeiro)
    const totalMessages = match.messages.length;
    const startIndex = totalMessages - (parseInt(page) * parseInt(limit));
    const endIndex = totalMessages - ((parseInt(page) - 1) * parseInt(limit));
    
    const messages = match.messages
      .slice(Math.max(0, startIndex), endIndex)
      .reverse()
      .map(msg => ({
        id: msg._id,
        content: msg.content,
        sender: {
          id: msg.sender._id,
          name: msg.sender.name,
          photos: msg.sender.photos
        },
        timestamp: msg.timestamp,
        isRead: msg.isRead
      }));

    res.json({
      conversation: {
        id: match._id,
        otherUser: {
          id: otherUser._id,
          name: otherUser.name,
          age: otherUser.age,
          photos: otherUser.photos,
          location: otherUser.location,
          interests: otherUser.interests,
          occupation: otherUser.occupation,
          isVerified: otherUser.isVerified,
          lastActive: otherUser.lastActive
        },
        matchedAt: match.matchedAt,
        lastInteraction: match.lastInteraction
      },
      messages,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(totalMessages / parseInt(limit)),
        hasMore: startIndex > 0
      }
    });

  } catch (error) {
    console.error('Erro ao buscar conversa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   POST /api/chat/conversation/:matchId/message
// @desc    Enviar mensagem em uma conversa
// @access  Private
router.post('/conversation/:matchId/message', auth, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Mensagem não pode estar vazia' });
    }

    if (content.length > 1000) {
      return res.status(400).json({ error: 'Mensagem muito longa (máximo 1000 caracteres)' });
    }

    const match = await Match.findById(req.params.matchId);
    if (!match) {
      return res.status(404).json({ error: 'Conversa não encontrada' });
    }

    // Verificar se o usuário faz parte do match
    if (!match.users.some(user => user.toString() === req.user.id)) {
      return res.status(403).json({ error: 'Não autorizado a enviar mensagem nesta conversa' });
    }

    // Verificar se o match está ativo
    if (match.status !== 'matched') {
      return res.status(400).json({ error: 'Não é possível enviar mensagem nesta conversa' });
    }

    // Adicionar mensagem
    await match.addMessage(req.user.id, content.trim());

    // Buscar match atualizado
    const updatedMatch = await Match.findById(req.params.matchId)
      .populate('messages.sender', 'name photos');

    const newMessage = updatedMatch.messages[updatedMatch.messages.length - 1];

    res.json({
      message: 'Mensagem enviada com sucesso!',
      newMessage: {
        id: newMessage._id,
        content: newMessage.content,
        sender: {
          id: newMessage.sender._id,
          name: newMessage.sender.name,
          photos: newMessage.sender.photos
        },
        timestamp: newMessage.timestamp,
        isRead: newMessage.isRead
      }
    });

  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   PUT /api/chat/conversation/:matchId/read
// @desc    Marcar mensagens como lidas
// @access  Private
router.put('/conversation/:matchId/read', auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId);
    if (!match) {
      return res.status(404).json({ error: 'Conversa não encontrada' });
    }

    // Verificar se o usuário faz parte do match
    if (!match.users.some(user => user.toString() === req.user.id)) {
      return res.status(403).json({ error: 'Não autorizado a acessar esta conversa' });
    }

    // Marcar mensagens como lidas
    await match.markMessagesAsRead(req.user.id);

    res.json({
      message: 'Mensagens marcadas como lidas',
      unreadCount: 0
    });

  } catch (error) {
    console.error('Erro ao marcar mensagens como lidas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   GET /api/chat/unread-count
// @desc    Obter contagem de mensagens não lidas
// @access  Private
router.get('/unread-count', auth, async (req, res) => {
  try {
    // Contar mensagens não lidas em todos os matches
    const unreadCount = await Match.aggregate([
      { $match: { users: req.user.id } },
      { $unwind: '$messages' },
      {
        $match: {
          'messages.sender': { $ne: req.user.id },
          'messages.isRead': false
        }
      },
      { $count: 'total' }
    ]);

    res.json({
      unreadCount: unreadCount[0]?.total || 0
    });

  } catch (error) {
    console.error('Erro ao contar mensagens não lidas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   GET /api/chat/search
// @desc    Pesquisar mensagens
// @access  Private
router.get('/search', auth, async (req, res) => {
  try {
    const { query, page = 1, limit = 20 } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: 'Termo de pesquisa deve ter pelo menos 2 caracteres' });
    }

    // Buscar matches com mensagens que contenham o termo
    const matches = await Match.find({
      users: req.user.id,
      status: 'matched',
      'messages.content': { $regex: query, $options: 'i' }
    })
    .populate('users', 'name age photos')
    .populate('messages.sender', 'name');

    // Filtrar e formatar resultados
    const searchResults = [];
    
    matches.forEach(match => {
      const otherUser = match.users.find(user => user._id.toString() !== req.user.id);
      
      match.messages.forEach(message => {
        if (message.content.toLowerCase().includes(query.toLowerCase())) {
          searchResults.push({
            matchId: match._id,
            otherUser: {
              id: otherUser._id,
              name: otherUser.name,
              photos: otherUser.photos
            },
            message: {
              id: message._id,
              content: message.content,
              sender: message.sender.name,
              timestamp: message.timestamp
            }
          });
        }
      });
    });

    // Ordenar por timestamp (mais recente primeiro)
    searchResults.sort((a, b) => new Date(b.message.timestamp) - new Date(a.message.timestamp));

    // Paginar resultados
    const total = searchResults.length;
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedResults = searchResults.slice(startIndex, endIndex);

    res.json({
      results: paginatedResults,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasMore: endIndex < total
      }
    });

  } catch (error) {
    console.error('Erro ao pesquisar mensagens:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   DELETE /api/chat/conversation/:matchId/message/:messageId
// @desc    Deletar uma mensagem específica
// @access  Private
router.delete('/conversation/:matchId/message/:messageId', auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId);
    if (!match) {
      return res.status(404).json({ error: 'Conversa não encontrada' });
    }

    // Verificar se o usuário faz parte do match
    if (!match.users.some(user => user.toString() === req.user.id)) {
      return res.status(403).json({ error: 'Não autorizado a deletar mensagem nesta conversa' });
    }

    // Encontrar a mensagem
    const messageIndex = match.messages.findIndex(msg => 
      msg._id.toString() === req.params.messageId
    );

    if (messageIndex === -1) {
      return res.status(404).json({ error: 'Mensagem não encontrada' });
    }

    // Verificar se o usuário é o autor da mensagem
    if (match.messages[messageIndex].sender.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Não autorizado a deletar mensagem de outro usuário' });
    }

    // Deletar mensagem
    match.messages.splice(messageIndex, 1);
    await match.save();

    res.json({
      message: 'Mensagem deletada com sucesso!'
    });

  } catch (error) {
    console.error('Erro ao deletar mensagem:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
