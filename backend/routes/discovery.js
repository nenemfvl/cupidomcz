const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Match = require('../models/Match');

const router = express.Router();

// Algoritmo de compatibilidade
const calculateCompatibility = (user1, user2) => {
  let score = 0;
  
  // Idade (preferência por faixas etárias similares)
  const ageDiff = Math.abs(user1.age - user2.age);
  if (ageDiff <= 2) score += 30;
  else if (ageDiff <= 5) score += 20;
  else if (ageDiff <= 10) score += 10;
  
  // Localização (preferência por proximidade)
  if (user1.location?.address?.neighborhood === user2.location?.address?.neighborhood) {
    score += 25;
  } else if (user1.location?.address?.city === user2.location?.address?.city) {
    score += 15;
  }
  
  // Interesses (bio similar)
  if (user1.bio && user2.bio) {
    const bio1 = user1.bio.toLowerCase();
    const bio2 = user2.bio.toLowerCase();
    const commonWords = bio1.split(' ').filter(word => bio2.includes(word));
    score += Math.min(commonWords.length * 5, 20);
  }
  
  // Fotos (usuários com fotos têm prioridade)
  if (user1.photos && user1.photos.length > 0) score += 10;
  if (user2.photos && user2.photos.length > 0) score += 10;
  
  return Math.min(score, 100);
};

// GET /api/discovery - Buscar usuários para matching
router.get('/', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Buscar usuários compatíveis
    const query = {
      _id: { $ne: currentUser._id }, // Excluir o próprio usuário
      isVerified: true, // Apenas usuários verificados
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: currentUser.location.coordinates
          },
          $maxDistance: 50000 // 50km
        }
      }
    };

    // Filtrar por gênero (se especificado)
    if (currentUser.lookingFor !== 'todos') {
      query.gender = currentUser.lookingFor;
    }

    // Filtrar usuários que procuram pelo gênero atual
    const genderQuery = {
      $or: [
        { lookingFor: currentUser.gender },
        { lookingFor: 'todos' }
      ]
    };
    query.$and = [genderQuery];

    // Buscar usuários
    const users = await User.find(query)
      .select('name age gender bio location photos lookingFor')
      .limit(20);

    // Calcular compatibilidade e ordenar
    const usersWithScore = users.map(user => ({
      ...user.toObject(),
      compatibility: calculateCompatibility(currentUser, user)
    }));

    // Ordenar por compatibilidade (maior primeiro)
    usersWithScore.sort((a, b) => b.compatibility - a.compatibility);

    res.json({
      users: usersWithScore,
      total: usersWithScore.length
    });

  } catch (error) {
    console.error('Erro na busca de usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/discovery/like - Dar like em um usuário
router.post('/like/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    // Verificar se o usuário existe
    const likedUser = await User.findById(userId);
    if (!likedUser) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar se já deu like
    const existingLike = await Match.findOne({
      $or: [
        { user1: currentUserId, user2: userId },
        { user1: userId, user2: currentUserId }
      ]
    });

    if (existingLike) {
      return res.status(400).json({ error: 'Já existe uma interação com este usuário' });
    }

    // Criar like
    const like = new Match({
      user1: currentUserId,
      user2: userId,
      user1Liked: true,
      user2Liked: false,
      status: 'pending'
    });

    await like.save();

    // Verificar se é um match
    const mutualLike = await Match.findOne({
      user1: userId,
      user2: currentUserId,
      user1Liked: true,
      user2Liked: false
    });

    if (mutualLike) {
      // É um match! Atualizar ambos os registros
      like.status = 'matched';
      like.user2Liked = true;
      await like.save();

      mutualLike.status = 'matched';
      mutualLike.user2Liked = true;
      await mutualLike.save();

      res.json({
        message: 'Match! 🎉',
        isMatch: true,
        matchedUser: {
          id: likedUser._id,
          name: likedUser.name,
          photos: likedUser.photos
        }
      });
    } else {
      res.json({
        message: 'Like enviado! ❤️',
        isMatch: false
      });
    }

  } catch (error) {
    console.error('Erro ao dar like:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/discovery/pass - Passar de um usuário
router.post('/pass/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    // Verificar se o usuário existe
    const passedUser = await User.findById(userId);
    if (!passedUser) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Criar registro de pass
    const pass = new Match({
      user1: currentUserId,
      user2: userId,
      user1Liked: false,
      user2Liked: false,
      status: 'passed'
    });

    await pass.save();

    res.json({ message: 'Usuário passado' });

  } catch (error) {
    console.error('Erro ao passar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/discovery/matches - Obter matches do usuário
router.get('/matches', auth, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const matches = await Match.find({
      $or: [
        { user1: currentUserId, status: 'matched' },
        { user2: currentUserId, status: 'matched' }
      ]
    }).populate('user1', 'name age gender photos')
      .populate('user2', 'name age gender photos');

    const formattedMatches = matches.map(match => {
      const otherUser = match.user1._id.toString() === currentUserId ? match.user2 : match.user1;
      return {
        id: match._id,
        user: {
          id: otherUser._id,
          name: otherUser.name,
          age: otherUser.age,
          gender: otherUser.gender,
          photos: otherUser.photos
        },
        matchedAt: match.updatedAt
      };
    });

    res.json({ matches: formattedMatches });

  } catch (error) {
    console.error('Erro ao buscar matches:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
