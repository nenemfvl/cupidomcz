const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Obter token do header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar usuário
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Token inválido. Usuário não encontrado.' });
    }

    // Verificar se usuário está ativo
    if (!user.isVerified) {
      return res.status(403).json({ error: 'Conta não verificada. Verifique seu email.' });
    }

    // Adicionar usuário ao request
    req.user = {
      id: user._id,
      email: user.email,
      name: user.name
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido.' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado. Faça login novamente.' });
    }
    
    console.error('Erro na autenticação:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

module.exports = auth;
