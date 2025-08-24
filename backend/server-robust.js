const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config({ path: '../config.env' });

const app = express();

// CORS
app.use(cors({
  origin: ['https://cupidomcz.vercel.app', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// Middleware de log para debug
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API funcionando!', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    mongo: process.env.MONGODB_URI ? 'Configurado' : 'NÃO CONFIGURADO'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Cupido Maceió API funcionando!',
    timestamp: new Date().toISOString(),
    mongo: mongoose.connection.readyState === 1 ? 'Conectado' : 'Desconectado'
  });
});

// Conectar ao MongoDB com retry
async function connectDB() {
  try {
    console.log('🔧 Conectando ao MongoDB...');
    console.log('🌐 URI:', process.env.MONGODB_URI ? 'CONFIGURADO' : 'NÃO CONFIGURADO');
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI não configurada!');
    }
    
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000
    });
    
    console.log('✅ MongoDB conectado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao conectar MongoDB:', error.message);
    // Não falhar o servidor, apenas logar o erro
  }
}

// Carregar rotas com try-catch robusto
async function loadRoutes() {
  try {
    console.log('🔧 Carregando rotas...');
    
    // Auth
    try {
      const authRoutes = require('./routes/auth');
      app.use('/api/auth', authRoutes);
      console.log('✅ Auth carregado');
    } catch (error) {
      console.error('❌ Erro ao carregar auth:', error.message);
    }
    
    // Users
    try {
      const userRoutes = require('./routes/users');
      app.use('/api/users', userRoutes);
      console.log('✅ Users carregado');
    } catch (error) {
      console.error('❌ Erro ao carregar users:', error.message);
    }
    
    // Matches
    try {
      const matchRoutes = require('./routes/matches');
      app.use('/api/matches', matchRoutes);
      console.log('✅ Matches carregado');
    } catch (error) {
      console.error('❌ Erro ao carregar matches:', error.message);
    }
    
    // Chat
    try {
      const chatRoutes = require('./routes/chat');
      app.use('/api/chat', chatRoutes);
      console.log('✅ Chat carregado');
    } catch (error) {
      console.error('❌ Erro ao carregar chat:', error.message);
    }
    
    // Discovery
    try {
      const discoveryRoutes = require('./routes/discovery');
      app.use('/api/discovery', discoveryRoutes);
      console.log('✅ Discovery carregado');
    } catch (error) {
      console.error('❌ Erro ao carregar discovery:', error.message);
    }
    
    // Upload
    try {
      const uploadRoutes = require('./routes/upload');
      app.use('/api/upload', uploadRoutes);
      console.log('✅ Upload carregado');
    } catch (error) {
      console.error('❌ Erro ao carregar upload:', error.message);
    }
    
    console.log('🎉 Carregamento de rotas concluído!');
  } catch (error) {
    console.error('❌ Erro geral ao carregar rotas:', error.message);
  }
}

// Middleware de erro robusto
app.use((err, req, res, next) => {
  console.error('❌ Erro na rota:', err.stack);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

const PORT = process.env.PORT || 5000;

// Inicializar servidor
async function startServer() {
  try {
    // Conectar ao MongoDB
    await connectDB();
    
    // Carregar rotas
    await loadRoutes();
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`💕 Cupido Maceió - Servidor Robusto`);
      console.log(`🔒 Modo: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 MongoDB: ${mongoose.connection.readyState === 1 ? 'Conectado' : 'Desconectado'}`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();
