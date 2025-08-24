const express = require('express');
const User = require('../models/User');
const Match = require('../models/Match');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/discover
// @desc    Descobrir usuários compatíveis
// @access  Private
router.get('/discover', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, gender, ageMin, ageMax, maxDistance } = req.query;
    const currentUser = await User.findById(req.user.id);

    // Construir filtros
    const filters = {
      _id: { $ne: currentUser._id },
      isVerified: true,
      lastActive: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Ativo na última semana
    };

    // Filtro por gênero
    if (gender && gender !== 'todos') {
      filters.gender = gender;
    }

    // Filtro por idade
    if (ageMin || ageMax) {
      filters.age = {};
      if (ageMin) filters.age.$gte = parseInt(ageMin);
      if (ageMax) filters.age.$lte = parseInt(ageMax);
    }

    // Filtro por distância
    let locationFilter = {};
    if (maxDistance && currentUser.location.coordinates) {
      const maxDistanceKm = parseInt(maxDistance);
      locationFilter = {
        'location.coordinates': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: currentUser.location.coordinates
            },
            $maxDistance: maxDistanceKm * 1000 // Converter km para metros
          }
        }
      };
    }

    // Buscar usuários
    const users = await User.find({ ...filters, ...locationFilter })
      .select('name age photos location interests occupation education height bodyType smoking drinking hasChildren wantsChildren religion politicalViews isVerified isPremium lastActive')
      .sort({ lastActive: -1, 'location.coordinates': 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Calcular distâncias e compatibilidade
    const usersWithDetails = await Promise.all(
      users.map(async (user) => {
        const distance = currentUser.calculateDistance(user);
        const compatibility = await calculateCompatibility(currentUser, user);
        
        return {
          ...user.toObject(),
          distance: distance ? Math.round(distance * 10) / 10 : null,
          compatibility
        };
      })
    );

    // Contar total de usuários
    const total = await User.countDocuments({ ...filters, ...locationFilter });

    res.json({
      users: usersWithDetails,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasMore: parseInt(page) * parseInt(limit) < total
      }
    });

  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   GET /api/users/:id
// @desc    Obter perfil de um usuário
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name age photos location interests occupation education height bodyType smoking drinking hasChildren wantsChildren religion politicalViews isVerified isPremium lastActive');

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar se é o próprio usuário
    if (req.params.id === req.user.id) {
      return res.json({ user, isOwnProfile: true });
    }

    // Verificar se há match existente
    const existingMatch = await Match.checkExistingMatch(req.user.id, req.params.id);
    
    // Calcular distância e compatibilidade
    const currentUser = await User.findById(req.user.id);
    const distance = currentUser.calculateDistance(user);
    const compatibility = await calculateCompatibility(currentUser, user);

    res.json({
      user: {
        ...user.toObject(),
        distance: distance ? Math.round(distance * 10) / 10 : null,
        compatibility
      },
      existingMatch: existingMatch ? {
        id: existingMatch._id,
        status: existingMatch.status
      } : null
    });

  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   PUT /api/users/:id
// @desc    Atualizar perfil de usuário
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    // Verificar se é o próprio usuário
    if (req.params.id !== req.user.id) {
      return res.status(403).json({ error: 'Não autorizado a editar este perfil' });
    }

    const updates = req.body;
    
    // Campos que não podem ser alterados
    delete updates.email;
    delete updates.password;
    delete updates.isVerified;
    delete updates.isPremium;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({
      message: 'Perfil atualizado com sucesso!',
      user
    });

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: 'Dados inválidos', details: errors });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   POST /api/users/:id/like
// @desc    Curtir um usuário
// @access  Private
router.post('/:id/like', auth, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    
    if (targetUserId === req.user.id) {
      return res.status(400).json({ error: 'Não é possível curtir a si mesmo' });
    }

    // Verificar se já existe um match
    const existingMatch = await Match.checkExistingMatch(req.user.id, targetUserId);
    
    if (existingMatch) {
      return res.status(400).json({ error: 'Já existe uma interação com este usuário' });
    }

    // Verificar se o usuário alvo também curtiu o usuário atual
    const mutualLike = await Match.findOne({
      initiator: targetUserId,
      recipient: req.user.id,
      status: 'pending'
    });

    if (mutualLike) {
      // É um match!
      mutualLike.status = 'matched';
      mutualLike.matchedAt = new Date();
      await mutualLike.save();

      // Criar match recíproco
      const newMatch = new Match({
        users: [req.user.id, targetUserId],
        status: 'matched',
        initiator: req.user.id,
        recipient: targetUserId,
        matchedAt: new Date()
      });
      await newMatch.save();

      // Calcular compatibilidade
      await newMatch.calculateCompatibility();

      return res.json({
        message: 'Match! 🎉',
        isMatch: true,
        match: newMatch
      });
    } else {
      // Criar like
      const like = new Match({
        users: [req.user.id, targetUserId],
        status: 'pending',
        initiator: req.user.id,
        recipient: targetUserId
      });
      await like.save();

      res.json({
        message: 'Usuário curtido!',
        isMatch: false
      });
    }

  } catch (error) {
    console.error('Erro ao curtir usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   POST /api/users/:id/pass
// @desc    Passar de um usuário
// @access  Private
router.post('/:id/pass', auth, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    
    if (targetUserId === req.user.id) {
      return res.status(400).json({ error: 'Não é possível passar de si mesmo' });
    }

    // Verificar se já existe um match
    const existingMatch = await Match.checkExistingMatch(req.user.id, targetUserId);
    
    if (existingMatch) {
      return res.status(400).json({ error: 'Já existe uma interação com este usuário' });
    }

    // Criar pass (rejeição)
    const pass = new Match({
      users: [req.user.id, targetUserId],
      status: 'rejected',
      initiator: req.user.id,
      recipient: targetUserId
    });
    await pass.save();

    res.json({
      message: 'Usuário passado',
      isPass: true
    });

  } catch (error) {
    console.error('Erro ao passar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   POST /api/users/:id/block
// @desc    Bloquear um usuário
// @access  Private
router.post('/:id/block', auth, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    
    if (targetUserId === req.user.id) {
      return res.status(400).json({ error: 'Não é possível bloquear a si mesmo' });
    }

    // Adicionar usuário à lista de bloqueados
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { blockedUsers: targetUserId }
    });

    // Atualizar matches existentes para bloqueado
    await Match.updateMany(
      { users: { $all: [req.user.id, targetUserId] } },
      { status: 'blocked' }
    );

    res.json({
      message: 'Usuário bloqueado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao bloquear usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   POST /api/users/:id/report
// @desc    Reportar um usuário
// @access  Private
router.post('/:id/report', auth, async (req, res) => {
  try {
    const { reason, description } = req.body;
    const targetUserId = req.params.id;
    
    if (targetUserId === req.user.id) {
      return res.status(400).json({ error: 'Não é possível reportar a si mesmo' });
    }

    if (!reason) {
      return res.status(400).json({ error: 'Motivo do report é obrigatório' });
    }

    // Adicionar report
    await User.findByIdAndUpdate(targetUserId, {
      $push: {
        reportedBy: {
          user: req.user.id,
          reason,
          description: description || '',
          reportedAt: new Date()
        }
      }
    });

    res.json({
      message: 'Usuário reportado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao reportar usuário:', error);
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
