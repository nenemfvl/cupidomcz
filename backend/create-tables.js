const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config({ path: '../config.env' });

// Importar modelos
const User = require('./models/User');
const Match = require('./models/Match');
const Message = require('./models/Message');

// Função para criar tabelas
async function createTables() {
  try {
    console.log('🔧 Conectando ao MongoDB...');
    
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000
    });
    
    console.log('✅ Conectado ao MongoDB com sucesso!');
    
    // Criar tabela users
    console.log('🔧 Criando tabela users...');
    await User.createCollection();
    console.log('✅ Tabela users criada!');
    
    // Criar tabela matches
    console.log('🔧 Criando tabela matches...');
    await Match.createCollection();
    console.log('✅ Tabela matches criada!');
    
    // Criar tabela messages
    console.log('🔧 Criando tabela messages...');
    await Message.createCollection();
    console.log('✅ Tabela messages criada!');
    
    // Criar índices para performance
    console.log('🔧 Criando índices...');
    
    // Índices para users
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ 'location.coordinates': '2dsphere' });
    await User.collection.createIndex({ isVerified: 1 });
    console.log('✅ Índices da tabela users criados!');
    
    // Índices para matches
    await Match.collection.createIndex({ user1: 1, user2: 1 }, { unique: true });
    await Match.collection.createIndex({ status: 1 });
    await Match.collection.createIndex({ matchedAt: 1 });
    console.log('✅ Índices da tabela matches criados!');
    
    // Índices para messages
    await Message.collection.createIndex({ matchId: 1, createdAt: 1 });
    await Message.collection.createIndex({ sender: 1 });
    await Message.collection.createIndex({ isRead: 1 });
    console.log('✅ Índices da tabela messages criados!');
    
    console.log('🎉 TODAS AS TABELAS E ÍNDICES FORAM CRIADOS COM SUCESSO!');
    console.log('🚀 O servidor agora deve funcionar perfeitamente!');
    
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
    process.exit(1);
  } finally {
    // Fechar conexão
    await mongoose.connection.close();
    console.log('🔌 Conexão com MongoDB fechada');
  }
}

// Executar script
createTables();
