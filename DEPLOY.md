# 🚀 Guia de Deploy - Cupido Maceió

Este guia te ajudará a colocar sua rede social de namoro online usando diferentes plataformas.

## 📋 Pré-requisitos

1. **Conta no GitHub** com o projeto sincronizado
2. **MongoDB Atlas** (banco de dados na nuvem)
3. **Conta em uma plataforma de deploy** (Render, Railway, ou Heroku)

## 🗄️ Configurar MongoDB Atlas

### 1. Criar conta no MongoDB Atlas
- Acesse [mongodb.com/atlas](https://mongodb.com/atlas)
- Crie uma conta gratuita
- Crie um novo cluster (gratuito)

### 2. Configurar banco de dados
- Crie um usuário de banco com senha forte
- Configure IP whitelist (0.0.0.0/0 para permitir todas as conexões)
- Obtenha a string de conexão

### 3. String de conexão
```
mongodb+srv://seu_usuario:sua_senha@cluster0.xxxxx.mongodb.net/cupido-maceio?retryWrites=true&w=majority
```

## 🌐 Deploy no Render.com (RECOMENDADO)

### 1. Criar conta no Render
- Acesse [render.com](https://render.com)
- Faça login com sua conta GitHub

### 2. Deploy do Backend
- Clique em "New +" → "Web Service"
- Conecte seu repositório GitHub
- Configure:
  - **Name**: `cupidomcz-backend`
  - **Environment**: `Node`
  - **Build Command**: `npm install`
  - **Start Command**: `npm start`
  - **Plan**: `Free`

### 3. Configurar variáveis de ambiente
Adicione estas variáveis no Render:
```
NODE_ENV=production
MONGODB_URI=sua_string_mongodb_atlas
JWT_SECRET=sua_chave_secreta_muito_longa
PORT=10000
FRONTEND_URL=https://cupidomcz.onrender.com
```

### 4. Deploy do Frontend
- Clique em "New +" → "Static Site"
- Conecte seu repositório GitHub
- Configure:
  - **Name**: `cupidomcz-frontend`
  - **Build Command**: `npm run build`
  - **Publish Directory**: `dist`
  - **Plan**: `Free`

### 5. Configurar variáveis de ambiente do frontend
```
VITE_API_URL=https://cupidomcz-backend.onrender.com
```

## 🚂 Deploy no Railway.app

### 1. Criar conta no Railway
- Acesse [railway.app](https://railway.app)
- Faça login com GitHub

### 2. Deploy automático
- Clique em "New Project" → "Deploy from GitHub repo"
- Selecione seu repositório
- O Railway detectará automaticamente que é um projeto Node.js

### 3. Configurar variáveis de ambiente
```
NODE_ENV=production
MONGODB_URI=sua_string_mongodb_atlas
JWT_SECRET=sua_chave_secreta_muito_longa
PORT=10000
```

## 🎯 Deploy no Heroku

### 1. Criar conta no Heroku
- Acesse [heroku.com](https://heroku.com)
- Crie uma conta (pode ser gratuita)

### 2. Instalar Heroku CLI
```bash
npm install -g heroku
```

### 3. Login e deploy
```bash
heroku login
heroku create cupidomcz-backend
git push heroku main
```

### 4. Configurar variáveis de ambiente
```bash
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=sua_string_mongodb_atlas
heroku config:set JWT_SECRET=sua_chave_secreta_muito_longa
```

## 🔧 Configurações finais

### 1. Atualizar URLs no código
Se necessário, atualize as URLs nos arquivos de configuração:
- `src/config/api.ts`
- `backend/server.js`

### 2. Testar a aplicação
- Acesse o frontend deployado
- Teste registro e login
- Verifique se o chat funciona
- Teste upload de fotos

### 3. Configurar domínio personalizado (opcional)
- No Render: Settings → Custom Domains
- No Railway: Settings → Domains
- No Heroku: Settings → Domains

## 🚨 Solução de problemas

### Erro de CORS
- Verifique se `FRONTEND_URL` está configurado corretamente
- Confirme se o frontend está acessando a URL correta da API

### Erro de conexão com MongoDB
- Verifique a string de conexão
- Confirme se o IP está liberado no MongoDB Atlas
- Verifique se o usuário tem permissões corretas

### Erro de build
- Verifique se todas as dependências estão no `package.json`
- Confirme se o Node.js está na versão correta (>=18.0.0)

### Chat não funciona
- Verifique se o Socket.IO está configurado corretamente
- Confirme se as URLs do frontend e backend estão sincronizadas

## 📱 Testando em produção

### 1. Funcionalidades básicas
- ✅ Registro de usuário
- ✅ Login/logout
- ✅ Perfil do usuário
- ✅ Upload de fotos

### 2. Funcionalidades de match
- ✅ Descoberta de usuários
- ✅ Like/pass
- ✅ Sistema de matches
- ✅ Chat em tempo real

### 3. Funcionalidades específicas de Maceió
- ✅ Validação de localização
- ✅ Filtros por distância
- ✅ Coordenadas geográficas

## 🎉 Próximos passos

1. **Monitoramento**: Configure logs e alertas
2. **Backup**: Configure backup automático do MongoDB
3. **Escalabilidade**: Considere upgrade para planos pagos
4. **Marketing**: Divulgue sua rede social em Maceió!

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs da aplicação
2. Confirme as variáveis de ambiente
3. Teste localmente primeiro
4. Consulte a documentação da plataforma escolhida

---

**🎯 Dica**: Comece com o Render.com - é gratuito, fácil de usar e muito confiável para projetos como o seu!
