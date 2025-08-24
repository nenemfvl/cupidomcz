const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Gerar token JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @route   POST /api/auth/register
// @desc    Registrar novo usuário
// @access  Public
router.post('/register', async (req, res) => {
  try {
    // DEBUG: Log dos dados recebidos
    console.log('🔍 DADOS RECEBIDOS:', JSON.stringify(req.body, null, 2));
    
    const {
      name,
      email,
      password,
      age,
      gender,
      lookingFor,
      bio,
      interests,
      occupation,
      education,
      height,
      bodyType,
      smoking,
      drinking,
      hasChildren,
      wantsChildren,
      religion,
      politicalViews,
      location
    } = req.body;

    // Verificar se usuário já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('❌ Email já existe:', email);
      return res.status(400).json({ error: 'Email já está em uso' });
    }

    // Validar coordenadas de localização (Maceió)
    if (!location || !location.coordinates || location.coordinates.length !== 2) {
      console.log('❌ Localização inválida:', location);
      return res.status(400).json({ error: 'Localização é obrigatória' });
    }

    // Verificar se está dentro da área de Maceió (aproximadamente)
    const [longitude, latitude] = location.coordinates;
    console.log('📍 Coordenadas:', { longitude, latitude });
    
    if (latitude < -9.8 || latitude > -9.5 || longitude < -35.9 || longitude > -35.6) {
      console.log('❌ Coordenadas fora de Maceió:', { latitude, longitude });
      return res.status(400).json({ error: 'Localização deve ser em Maceió, AL' });
    }
    
    console.log('✅ Coordenadas válidas!');

    // Criar novo usuário
    const user = new User({
      name,
      email,
      password,
      age,
      gender,
      lookingFor,
      bio: bio || '',
      interests: interests || [],
      occupation: occupation || '',
      education: education || 'ensino médio',
      height: height || null,
      bodyType: bodyType || null,
      smoking: smoking || 'não fumo',
      drinking: drinking || 'não bebo',
      hasChildren: hasChildren || false,
      wantsChildren: wantsChildren || 'prefiro não informar',
      religion: religion || '',
      politicalViews: politicalViews || 'prefiro não informar',
      location: {
        type: 'Point',
        coordinates: location.coordinates,
        address: {
          neighborhood: location.address?.neighborhood || '',
          city: 'Maceió',
          state: 'AL'
        }
      }
    });

    await user.save();

    // Gerar token
    const token = generateToken(user._id);

    // Retornar usuário (sem senha) e token
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: 'Usuário registrado com sucesso!',
      user: userResponse,
      token
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: 'Dados inválidos', details: errors });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   POST /api/auth/login
// @desc    Fazer login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar dados de entrada
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Buscar usuário com senha
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Verificar senha
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Atualizar última atividade
    await user.updateLastActive();

    // Gerar token
    const token = generateToken(user._id);

    // Retornar usuário (sem senha) e token
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      message: 'Login realizado com sucesso!',
      user: userResponse,
      token
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   GET /api/auth/me
// @desc    Obter usuário logado
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Atualizar última atividade
    await user.updateLastActive();

    res.json({ user });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   PUT /api/auth/me
// @desc    Atualizar perfil do usuário
// @access  Private
router.put('/me', auth, async (req, res) => {
  try {
    const updates = req.body;
    
    // Campos que não podem ser alterados
    delete updates.email;
    delete updates.password;
    delete updates.isVerified;
    delete updates.isPremium;

    const user = await User.findByIdAndUpdate(
      req.user.id,
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

// @route   POST /api/auth/change-password
// @desc    Alterar senha
// @access  Private
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Nova senha deve ter pelo menos 6 caracteres' });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar senha atual
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }

    // Atualizar senha
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Senha alterada com sucesso!' });

  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Solicitar redefinição de senha
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Por segurança, não revelar se o email existe ou não
      return res.json({ message: 'Se o email existir, você receberá instruções para redefinir sua senha' });
    }

    // Gerar token de redefinição (válido por 1 hora)
    const resetToken = jwt.sign(
      { userId: user._id, type: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Em produção, enviar email com o token
    // Por enquanto, apenas retornar o token (não fazer isso em produção!)
    res.json({
      message: 'Token de redefinição gerado',
      resetToken,
      userId: user._id
    });

  } catch (error) {
    console.error('Erro ao solicitar redefinição de senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Redefinir senha com token
// @access  Public
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Nova senha deve ter pelo menos 6 caracteres' });
    }

    // Verificar token
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    
    if (decoded.type !== 'password-reset') {
      return res.status(400).json({ error: 'Token inválido' });
    }

    // Atualizar senha
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Senha redefinida com sucesso!' });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ error: 'Token inválido ou expirado' });
    }
    
    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
