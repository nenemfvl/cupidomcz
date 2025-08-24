#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Cupido Maceió - Script de Deploy');
console.log('=====================================\n');

// Verificar se estamos no diretório correto
if (!fs.existsSync('package.json')) {
  console.error('❌ Erro: Execute este script na raiz do projeto');
  process.exit(1);
}

// Verificar se o .env existe
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('📝 Criando arquivo .env...');
  
  const envContent = `# Configurações de Produção
NODE_ENV=production
MONGODB_URI=mongodb+srv://seu_usuario:sua_senha@cluster0.xxxxx.mongodb.net/cupido-maceio?retryWrites=true&w=majority
JWT_SECRET=sua_chave_secreta_muito_longa_e_complexa_aqui
PORT=10000
FRONTEND_URL=https://cupidomcz.onrender.com

# Configurações de Desenvolvimento (comentadas)
# NODE_ENV=development
# MONGODB_URI=mongodb://localhost:27017/cupido-maceio
# JWT_SECRET=chave_secreta_desenvolvimento
# PORT=5000
# FRONTEND_URL=http://localhost:3000
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ Arquivo .env criado!');
  console.log('⚠️  IMPORTANTE: Configure suas variáveis reais antes do deploy!\n');
}

// Verificar se o build está funcionando
console.log('🔨 Testando build do projeto...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build realizado com sucesso!\n');
} catch (error) {
  console.error('❌ Erro no build. Verifique se todas as dependências estão instaladas.');
  console.log('💡 Execute: npm install');
  process.exit(1);
}

// Verificar se o projeto está no GitHub
console.log('📋 Verificando configuração do Git...');
try {
  const gitRemote = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
  console.log('✅ Repositório Git configurado:', gitRemote);
  
  if (gitRemote.includes('github.com')) {
    console.log('✅ GitHub detectado - pronto para deploy!');
  } else {
    console.log('⚠️  Repositório não é do GitHub. Algumas plataformas podem não funcionar.');
  }
} catch (error) {
  console.log('⚠️  Repositório Git não configurado. Configure antes do deploy.');
}

console.log('\n🎯 Próximos passos para o deploy:');
console.log('=====================================');
console.log('1. 📝 Configure suas variáveis no arquivo .env');
console.log('2. 🗄️  Crie uma conta no MongoDB Atlas');
console.log('3. 🌐 Escolha uma plataforma de deploy:');
console.log('   • Render.com (RECOMENDADO)');
console.log('   • Railway.app');
console.log('   • Heroku');
console.log('4. 📚 Leia o arquivo DEPLOY.md para instruções detalhadas');
console.log('5. 🚀 Faça o deploy seguindo o guia escolhido');

console.log('\n💡 Dica: Comece com o Render.com - é gratuito e muito fácil!');
console.log('🔗 Acesse: https://render.com');

console.log('\n📖 Para instruções completas, leia: DEPLOY.md');
console.log('🎉 Boa sorte com sua rede social de namoro em Maceió!');
