const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const server = http.createServer(app);

// Configurar CORS
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL || 'https://cupidomcz.vercel.app']
    : "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
};

const io = socketIo(server, {
  cors: corsOptions
});

// Middleware básico
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000
})
  .then(() => console.log('✅ Conectado ao MongoDB'))
  .catch(err => console.error('❌ Erro ao conectar ao MongoDB:', err));

// Carregar rotas com try-catch para debug
try {
  console.log('🔧 Carregando rotas...');
  
  app.use('/api/auth', require('./routes/auth'));
  console.log('✅ Auth carregado');
  
  app.use('/api/users', require('./routes/users'));
  console.log('✅ Users carregado');
  
  app.use('/api/matches', require('./routes/matches'));
  console.log('✅ Matches carregado');
  
  app.use('/api/chat', require('./routes/chat'));
  console.log('✅ Chat carregado');
  
  app.use('/api/discovery', require('./routes/discovery'));
  console.log('✅ Discovery carregado');
  
  app.use('/api/upload', require('./routes/upload'));
  console.log('✅ Upload carregado');
  
  console.log('🎉 Todas as rotas carregadas com sucesso!');
} catch (error) {
  console.error('❌ Erro ao carregar rotas:', error);
  process.exit(1);
}

// Socket.IO básico
io.on('connection', (socket) => {
  console.log('👤 Usuário conectado:', socket.id);
  socket.on('disconnect', () => console.log('👤 Usuário desconectado:', socket.id));
});

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Cupido Maceió API funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Middleware de erro
app.use((err, req, res, next) => {
  console.error('❌ Erro:', err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`💕 Cupido Maceió - Rede Social de Namoro`);
  console.log(`🔒 Modo: ${process.env.NODE_ENV || 'development'}`);
});
