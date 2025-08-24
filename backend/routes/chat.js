const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Match = require('../models/Match');
const Message = require('../models/Message');

const router = express.Router();

// GET /api/chat/conversations - Obter todas as conversas do usuário
router.get('/conversations', auth, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    // Buscar matches do usuário
    const matches = await Match.find({
      $or: [
        { user1: currentUserId, status: 'matched' },
        { user2: currentUserId, status: 'matched' }
      ]
    }).populate('user1', 'name age gender photos')
      .populate('user2', 'name age gender photos');

    // Buscar última mensagem de cada conversa
    const conversations = await Promise.all(
      matches.map(async (match) => {
        const otherUser = match.user1._id.toString() === currentUserId ? match.user2 : match.user1;
        
        const lastMessage = await Message.findOne({
          matchId: match._id
        }).sort({ createdAt: -1 });

        const unreadCount = await Message.countDocuments({
          matchId: match._id,
          sender: { $ne: currentUserId },
          isRead: false
        });

        return {
          matchId: match._id,
          user: {
            id: otherUser._id,
            name: otherUser.name,
            age: otherUser.age,
            gender: otherUser.gender,
            photos: otherUser.photos
          },
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            timestamp: lastMessage.createdAt,
            sender: lastMessage.sender
          } : null,
          unreadCount,
          matchedAt: match.matchedAt
        };
      })
    );

    // Ordenar por última mensagem (mais recente primeiro)
    conversations.sort((a, b) => {
      if (!a.lastMessage && !b.lastMessage) return 0;
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp);
    });

    res.json({ conversations });

  } catch (error) {
    console.error('Erro ao buscar conversas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/chat/messages/:matchId - Obter mensagens de uma conversa
router.get('/messages/:matchId', auth, async (req, res) => {
  try {
    const { matchId } = req.params;
    const currentUserId = req.user.id;

    // Verificar se o usuário tem acesso a este match
    const match = await Match.findOne({
      _id: matchId,
      $or: [
        { user1: currentUserId, status: 'matched' },
        { user2: currentUserId, status: 'matched' }
      ]
    });

    if (!match) {
      return res.status(403).json({ error: 'Acesso negado a esta conversa' });
    }

    // Buscar mensagens
    const messages = await Message.find({ matchId })
      .populate('sender', 'name')
      .sort({ createdAt: 1 });

    // Marcar mensagens como lidas
    await Message.updateMany(
      {
        matchId,
        sender: { $ne: currentUserId },
        isRead: false
      },
      { isRead: true }
    );

    res.json({ messages });

  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/chat/message - Enviar mensagem
router.post('/message', auth, async (req, res) => {
  try {
    const { matchId, content } = req.body;
    const currentUserId = req.user.id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Mensagem não pode estar vazia' });
    }

    if (content.length > 1000) {
      return res.status(400).json({ error: 'Mensagem muito longa (máximo 1000 caracteres)' });
    }

    // Verificar se o usuário tem acesso a este match
    const match = await Match.findOne({
      _id: matchId,
      $or: [
        { user1: currentUserId, status: 'matched' },
        { user2: currentUserId, status: 'matched' }
      ]
    });

    if (!match) {
      return res.status(403).json({ error: 'Acesso negado a esta conversa' });
    }

    // Criar mensagem
    const message = new Message({
      matchId,
      sender: currentUserId,
      content: content.trim(),
      isRead: false
    });

    await message.save();

    // Atualizar último acesso do match
    match.lastInteraction = new Date();
    await match.save();

    // Retornar mensagem com dados do remetente
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name');

    res.status(201).json({
      message: 'Mensagem enviada com sucesso',
      data: populatedMessage
    });

  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/chat/message/:messageId/read - Marcar mensagem como lida
router.put('/message/:messageId/read', auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Mensagem não encontrada' });
    }

    // Verificar se o usuário tem acesso a esta mensagem
    const match = await Match.findOne({
      _id: message.matchId,
      $or: [
        { user1: currentUserId, status: 'matched' },
        { user2: currentUserId, status: 'matched' }
      ]
    });

    if (!match) {
      return res.status(403).json({ error: 'Acesso negado a esta mensagem' });
    }

    // Marcar como lida
    message.isRead = true;
    await message.save();

    res.json({ message: 'Mensagem marcada como lida' });

  } catch (error) {
    console.error('Erro ao marcar mensagem como lida:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/chat/message/:messageId - Excluir mensagem
router.delete('/message/:messageId', auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Mensagem não encontrada' });
    }

    // Verificar se o usuário é o remetente da mensagem
    if (message.sender.toString() !== currentUserId) {
      return res.status(403).json({ error: 'Só pode excluir suas próprias mensagens' });
    }

    await Message.findByIdAndDelete(messageId);

    res.json({ message: 'Mensagem excluída com sucesso' });

  } catch (error) {
    console.error('Erro ao excluir mensagem:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/chat/unread-count - Contar mensagens não lidas
router.get('/unread-count', auth, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const unreadCount = await Message.countDocuments({
      sender: { $ne: currentUserId },
      isRead: false,
      matchId: {
        $in: await Match.find({
          $or: [
            { user1: currentUserId, status: 'matched' },
            { user2: currentUserId, status: 'matched' }
          ]
        }).distinct('_id')
      }
    });

    res.json({ unreadCount });

  } catch (error) {
    console.error('Erro ao contar mensagens não lidas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
