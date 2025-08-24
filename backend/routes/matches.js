const express = require('express');
const Match = require('../models/Match');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/matches
// @desc    Obter todos os matches do usuário
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    // Construir query
    const query = { users: req.user.id };
    if (status && status !== 'todos') {
      query.status = status;
    }

    // Buscar matches
    const matches = await Match.find(query)
      .populate('users', 'name age photos location interests occupation isVerified lastActive')
      .populate('messages.sender', 'name')
      .sort({ lastInteraction: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Contar total
    const total = await Match.countDocuments(query);

    // Formatar resposta
    const formattedMatches = matches.map(match => {
      const otherUser = match.users.find(user => user._id.toString() !== req.user.id);
      const lastMessage = match.messages.length > 0 
        ? match.messages[match.messages.length - 1] 
        : null;

      return {
        id: match._id,
        status: match.status,
        matchedAt: match.matchedAt,
        lastInteraction: match.lastInteraction,
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
        unreadCount: match.messages.filter(msg => 
          !msg.isRead && msg.sender.toString() !== req.user.id
        ).length,
        compatibility: match.compatibility
      };
    });

    res.json({
      matches: formattedMatches,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasMore: parseInt(page) * parseInt(limit) < total
      }
    });

  } catch (error) {
    console.error('Erro ao buscar matches:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   GET /api/matches/:id
// @desc    Obter detalhes de um match específico
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('users', 'name age photos location interests occupation education height bodyType smoking drinking hasChildren wantsChildren religion politicalViews isVerified isPremium lastActive')
      .populate('messages.sender', 'name photos');

    if (!match) {
      return res.status(404).json({ error: 'Match não encontrado' });
    }

    // Verificar se o usuário faz parte do match
    if (!match.users.some(user => user._id.toString() === req.user.id)) {
      return res.status(403).json({ error: 'Não autorizado a acessar este match' });
    }

    // Marcar mensagens como lidas
    await match.markMessagesAsRead(req.user.id);

    // Formatar resposta
    const otherUser = match.users.find(user => user._id.toString() !== req.user.id);
    
    const formattedMatch = {
      id: match._id,
      status: match.status,
      matchedAt: match.matchedAt,
      lastInteraction: match.lastInteraction,
      otherUser: {
        id: otherUser._id,
        name: otherUser.name,
        age: otherUser.age,
        photos: otherUser.photos,
        location: otherUser.location,
        interests: otherUser.interests,
        occupation: otherUser.occupation,
        education: otherUser.education,
        height: otherUser.height,
        bodyType: otherUser.bodyType,
        smoking: otherUser.smoking,
        drinking: otherUser.drinking,
        hasChildren: otherUser.hasChildren,
        wantsChildren: otherUser.wantsChildren,
        religion: otherUser.religion,
        politicalViews: otherUser.politicalViews,
        isVerified: otherUser.isVerified,
        isPremium: otherUser.isPremium,
        lastActive: otherUser.lastActive
      },
      messages: match.messages.map(msg => ({
        id: msg._id,
        content: msg.content,
        sender: {
          id: msg.sender._id,
          name: msg.sender.name,
          photos: msg.sender.photos
        },
        timestamp: msg.timestamp,
        isRead: msg.isRead
      })),
      compatibility: match.compatibility
    };

    res.json({ match: formattedMatch });

  } catch (error) {
    console.error('Erro ao buscar match:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   POST /api/matches/:id/message
// @desc    Enviar mensagem em um match
// @access  Private
router.post('/:id/message', auth, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Mensagem não pode estar vazia' });
    }

    if (content.length > 1000) {
      return res.status(400).json({ error: 'Mensagem muito longa (máximo 1000 caracteres)' });
    }

    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ error: 'Match não encontrado' });
    }

    // Verificar se o usuário faz parte do match
    if (!match.users.some(user => user.toString() === req.user.id)) {
      return res.status(403).json({ error: 'Não autorizado a enviar mensagem neste match' });
    }

    // Verificar se o match está ativo
    if (match.status !== 'matched') {
      return res.status(400).json({ error: 'Não é possível enviar mensagem neste match' });
    }

    // Adicionar mensagem
    await match.addMessage(req.user.id, content.trim());

    // Buscar match atualizado
    const updatedMatch = await Match.findById(req.params.id)
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

// @route   PUT /api/matches/:id/status
// @desc    Atualizar status de um match
// @access  Private
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'matched', 'rejected', 'blocked'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ error: 'Match não encontrado' });
    }

    // Verificar se o usuário é o destinatário
    if (match.recipient.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Não autorizado a alterar este match' });
    }

    // Atualizar status
    match.status = status;
    if (status === 'matched') {
      match.matchedAt = new Date();
    }
    await match.save();

    res.json({
      message: 'Status do match atualizado com sucesso!',
      match: {
        id: match._id,
        status: match.status,
        matchedAt: match.matchedAt
      }
    });

  } catch (error) {
    console.error('Erro ao atualizar status do match:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   DELETE /api/matches/:id
// @desc    Deletar um match
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ error: 'Match não encontrado' });
    }

    // Verificar se o usuário faz parte do match
    if (!match.users.some(user => user.toString() === req.user.id)) {
      return res.status(403).json({ error: 'Não autorizado a deletar este match' });
    }

    // Deletar match
    await Match.findByIdAndDelete(req.params.id);

    res.json({ message: 'Match deletado com sucesso!' });

  } catch (error) {
    console.error('Erro ao deletar match:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   GET /api/matches/stats/overview
// @desc    Obter estatísticas gerais dos matches
// @access  Private
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Contar matches por status
    const stats = await Match.aggregate([
      { $match: { users: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Contar mensagens não lidas
    const unreadCount = await Match.aggregate([
      { $match: { users: userId } },
      { $unwind: '$messages' },
      {
        $match: {
          'messages.sender': { $ne: userId },
          'messages.isRead': false
        }
      },
      { $count: 'total' }
    ]);

    // Contar matches da última semana
    const lastWeekMatches = await Match.countDocuments({
      users: userId,
      matchedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    // Formatar estatísticas
    const formattedStats = {
      total: 0,
      pending: 0,
      matched: 0,
      rejected: 0,
      blocked: 0,
      unreadMessages: unreadCount[0]?.total || 0,
      lastWeekMatches
    };

    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
      formattedStats.total += stat.count;
    });

    res.json({ stats: formattedStats });

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   GET /api/matches/suggestions
// @desc    Obter sugestões de usuários para match
// @access  Private
router.get('/suggestions', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    
    // Buscar usuários compatíveis que ainda não foram interagidos
    const existingMatches = await Match.find({ users: req.user.id })
      .select('users')
      .lean();

    const interactedUserIds = existingMatches.map(match => 
      match.users.find(id => id.toString() !== req.user.id)
    );

    // Buscar usuários compatíveis
    const suggestions = await User.find({
      _id: { $nin: [req.user.id, ...interactedUserIds] },
      isVerified: true,
      lastActive: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })
    .select('name age photos location interests occupation education isVerified lastActive')
    .limit(10)
    .sort({ lastActive: -1 });

    // Calcular compatibilidade e distância
    const suggestionsWithDetails = await Promise.all(
      suggestions.map(async (user) => {
        const distance = currentUser.calculateDistance(user);
        const compatibility = await calculateCompatibility(currentUser, user);
        
        return {
          ...user.toObject(),
          distance: distance ? Math.round(distance * 10) / 10 : null,
          compatibility
        };
      })
    );

    // Ordenar por compatibilidade
    suggestionsWithDetails.sort((a, b) => b.compatibility.score - a.compatibility.score);

    res.json({ suggestions: suggestionsWithDetails });

  } catch (error) {
    console.error('Erro ao buscar sugestões:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Função auxiliar para calcular compatibilidade
async function calculateCompatibility(user1, user2) {
  let totalScore = 0;
  const factors = [];
  
  // Idade
  const ageDiff = Math.abs(user1.age - user2.age);
  const ageScore = Math.max(0, 100 - ageDiff * 2);
  factors.push({ factor: 'idade', weight: 20, score: ageScore });
  totalScore += ageScore * 0.2;
  
  // Interesses em comum
  const commonInterests = user1.interests.filter(interest => 
    user2.interests.includes(interest)
  );
  const interestScore = user1.interests.length > 0 && user2.interests.length > 0
    ? (commonInterests.length / Math.max(user1.interests.length, user2.interests.length)) * 100
    : 50;
  factors.push({ factor: 'interesses', weight: 25, score: interestScore });
  totalScore += interestScore * 0.25;
  
  // Localização
  const distance = user1.calculateDistance(user2);
  let locationScore = 100;
  if (distance !== null) {
    if (distance <= 5) locationScore = 100;
    else if (distance <= 15) locationScore = 80;
    else if (distance <= 30) locationScore = 60;
    else if (distance <= 50) locationScore = 40;
    else locationScore = 20;
  }
  factors.push({ factor: 'localização', weight: 30, score: locationScore });
  totalScore += locationScore * 0.3;
  
  // Valores e estilo de vida
  let lifestyleScore = 0;
  if (user1.smoking === user2.smoking) lifestyleScore += 25;
  if (user1.drinking === user2.drinking) lifestyleScore += 25;
  if (user1.hasChildren === user2.hasChildren) lifestyleScore += 25;
  if (user1.wantsChildren === user2.wantsChildren) lifestyleScore += 25;
  
  factors.push({ factor: 'estilo de vida', weight: 15, score: lifestyleScore });
  totalScore += lifestyleScore * 0.15;
  
  // Educação
  let educationScore = 0;
  if (user1.education === user2.education) educationScore = 100;
  else if (user1.education && user2.education) {
    const levels = {
      'ensino médio': 1, 'técnico': 2, 'superior incompleto': 3,
      'superior completo': 4, 'pós-graduação': 5, 'mestrado': 6, 'doutorado': 7
    };
    const diff = Math.abs((levels[user1.education] || 1) - (levels[user2.education] || 1));
    if (diff <= 1) educationScore = 70;
    else educationScore = 40;
  }
  
  factors.push({ factor: 'educação', weight: 10, score: educationScore });
  totalScore += educationScore * 0.1;
  
  return {
    score: Math.round(totalScore),
    factors: factors
  };
}

module.exports = router;
