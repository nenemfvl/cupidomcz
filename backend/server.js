const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

// Carregar variáveis de ambiente
dotenv.config({ path: process.env.NODE_ENV === 'production' ? '.env' : './config.env' });

const app = express();
const server = http.createServer(app);

// Configurar CORS para produção
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL || 'https://cupidomcz.onrender.com']
    : "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
};

const io = socketIo(server, {
  cors: corsOptions
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de segurança para produção
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });
}

// Conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000, // 30 segundos
  socketTimeoutMS: 45000, // 45 segundos
  connectTimeoutMS: 30000, // 30 segundos
  maxPoolSize: 10,
  retryWrites: true,
  w: 'majority'
})
  .then(() => console.log('✅ Conectado ao MongoDB'))
  .catch(err => console.error('❌ Erro ao conectar ao MongoDB:', err));

// Rotas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/matches', require('./routes/matches'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/discovery', require('./routes/discovery'));

console.log('🔧 Carregando rotas de upload...');
app.use('/api/upload', require('./routes/upload'));
console.log('✅ Rotas de upload carregadas com sucesso!');

// Socket.IO para chat em tempo real
io.on('connection', (socket) => {
  console.log('👤 Usuário conectado:', socket.id);

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`👥 Usuário ${socket.id} entrou na sala ${roomId}`);
  });

  socket.on('send_message', (data) => {
    socket.to(data.roomId).emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log('👤 Usuário desconectado:', socket.id);
  });
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
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Algo deu errado!',
    message: err.message 
  });
});

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌐 API disponível em: ${process.env.NODE_ENV === 'production' ? 'https://cupidomcz-backend.onrender.com' : `http://localhost:${PORT}`}`);
  console.log(`💕 Cupido Maceió - Rede Social de Namoro`);
  console.log(`🔒 Modo: ${process.env.NODE_ENV || 'development'}`);
});
