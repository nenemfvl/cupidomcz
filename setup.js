#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Cupido Maceió - Setup Inicial');
console.log('================================\n');

// Verificar se Node.js está instalado
try {
  const nodeVersion = process.version;
  console.log(`✅ Node.js ${nodeVersion} detectado`);
} catch (error) {
  console.error('❌ Node.js não está instalado. Por favor, instale o Node.js 18+ primeiro.');
  process.exit(1);
}

// Verificar se MongoDB está rodando
console.log('\n🔍 Verificando MongoDB...');
try {
  execSync('mongod --version', { stdio: 'ignore' });
  console.log('✅ MongoDB detectado');
} catch (error) {
  console.log('⚠️  MongoDB não detectado. Certifique-se de que está instalado e rodando.');
  console.log('   Para instalar: https://docs.mongodb.com/manual/installation/');
}

// Criar diretório de uploads
const uploadsDir = path.join(__dirname, 'uploads', 'photos');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Diretório de uploads criado');
}

// Criar arquivo .env se não existir
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  const envContent = `MONGODB_URI=mongodb://localhost:27017/cupido-maceio
JWT_SECRET=cupido-maceio-super-secret-key-2024
PORT=5000
NODE_ENV=development`;
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Arquivo .env criado com configurações padrão');
}

// Instalar dependências
console.log('\n📦 Instalando dependências...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependências instaladas com sucesso!');
} catch (error) {
  console.error('❌ Erro ao instalar dependências:', error.message);
  process.exit(1);
}

// Verificar se o MongoDB está rodando
console.log('\n🔍 Verificando conexão com MongoDB...');
setTimeout(() => {
  try {
    const { MongoClient } = require('mongodb');
    const client = new MongoClient('mongodb://localhost:27017');
    
    client.connect()
      .then(() => {
        console.log('✅ Conexão com MongoDB estabelecida');
        client.close();
        console.log('\n🎉 Setup concluído com sucesso!');
        console.log('\n📋 Próximos passos:');
        console.log('1. Certifique-se de que o MongoDB está rodando');
        console.log('2. Execute: npm run dev');
        console.log('3. Acesse: http://localhost:3000');
        console.log('\n💕 Cupido Maceió está pronto para conectar corações!');
      })
      .catch(() => {
        console.log('⚠️  MongoDB não está rodando. Inicie o MongoDB antes de executar a aplicação.');
        console.log('\n🎉 Setup concluído!');
        console.log('\n📋 Próximos passos:');
        console.log('1. Inicie o MongoDB');
        console.log('2. Execute: npm run dev');
        console.log('3. Acesse: http://localhost:3000');
      });
  } catch (error) {
    console.log('⚠️  Erro ao verificar MongoDB. Certifique-se de que está rodando.');
    console.log('\n🎉 Setup concluído!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Inicie o MongoDB');
    console.log('2. Execute: npm run dev');
    console.log('3. Acesse: http://localhost:3000');
  }
}, 2000);
