const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config({ path: '../config.env' });

const app = express();

// CORS básico
app.use(cors({
  origin: ['https://cupidomcz.vercel.app', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// Rota de teste básica
app.get('/api/test', (req, res) => {
  res.json({ message: 'API funcionando!', timestamp: new Date().toISOString() });
});

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Cupido Maceió API funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Testar carregamento das rotas uma por uma
console.log('🔧 Testando carregamento das rotas...');

try {
  console.log('1. Testando auth...');
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth carregado com sucesso');
} catch (error) {
  console.error('❌ Erro ao carregar auth:', error.message);
}

try {
  console.log('2. Testando users...');
  const userRoutes = require('./routes/users');
  app.use('/api/users', userRoutes);
  console.log('✅ Users carregado com sucesso');
} catch (error) {
  console.error('❌ Erro ao carregar users:', error.message);
}

try {
  console.log('3. Testando matches...');
  const matchRoutes = require('./routes/matches');
  app.use('/api/matches', matchRoutes);
  console.log('✅ Matches carregado com sucesso');
} catch (error) {
  console.error('❌ Erro ao carregar matches:', error.message);
}

try {
  console.log('4. Testando chat...');
  const chatRoutes = require('./routes/chat');
  app.use('/api/chat', chatRoutes);
  console.log('✅ Chat carregado com sucesso');
} catch (error) {
  console.error('❌ Erro ao carregar chat:', error.message);
}

try {
  console.log('5. Testando discovery...');
  const discoveryRoutes = require('./routes/discovery');
  app.use('/api/discovery', discoveryRoutes);
  console.log('✅ Discovery carregado com sucesso');
} catch (error) {
  console.error('❌ Erro ao carregar discovery:', error.message);
}

try {
  console.log('6. Testando upload...');
  const uploadRoutes = require('./routes/upload');
  app.use('/api/upload', uploadRoutes);
  console.log('✅ Upload carregado com sucesso');
} catch (error) {
  console.error('❌ Erro ao carregar upload:', error.message);
}

console.log('🎉 Teste de carregamento das rotas concluído!');

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor de teste rodando na porta ${PORT}`);
  console.log(`💕 Cupido Maceió - Teste de Rotas`);
  console.log(`🔒 Modo: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 MongoDB: ${process.env.MONGODB_URI ? 'Configurado' : 'NÃO CONFIGURADO'}`);
});
