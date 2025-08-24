# 🚂 Deploy no Railway - Cupido Maceió

## 📋 Pré-requisitos
- ✅ Conta no GitHub (já temos!)
- ✅ Conta no Railway (vamos criar)
- ✅ String de conexão do MongoDB Atlas

---

## 🚂 PASSO 1: Criar conta no Railway

### 1.1 Acessar Railway
1. **URL**: https://railway.app
2. **Clique**: "Login with GitHub"
3. **Autorize** o Railway a acessar seu GitHub

### 1.2 Primeiro projeto
1. **Clique**: "New Project"
2. **Escolha**: "Deploy from GitHub repo"
3. **Selecione**: `nenemfvl/cupidomcz`

---

## 🔧 PASSO 2: Configurar Deploy

### 2.1 Configurações básicas
- **Repository**: `nenemfvl/cupidomcz`
- **Branch**: `main`
- **Root Directory**: `backend/`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### 2.2 Variáveis de ambiente
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://cupidomcz_user:[SUA_SENHA]@cluster0.xxxxx.mongodb.net/cupidomcz?retryWrites=true&w=majority
JWT_SECRET=[SENHA_SUPER_SECRETA_32_CARACTERES]
PORT=10000
FRONTEND_URL=https://cupidomcz.vercel.app
```

---

## 🚀 PASSO 3: Deploy

### 3.1 Primeiro deploy
1. **Clique**: "Deploy"
2. **Aguarde**: Build e deploy
3. **Copie**: URL gerada

### 3.2 Verificar logs
1. **Clique**: no projeto
2. **Aba**: "Deployments"
3. **Verifique**: se não há erros

---

## 🔍 PASSO 4: Testar API

### 4.1 Health check
- **URL**: `https://[seu-projeto].up.railway.app/health`
- **Deve retornar**: `{"status":"ok"}`

### 4.2 Testar endpoints
- **GET**: `/api/users` (deve retornar lista vazia)
- **POST**: `/api/auth/register` (testar cadastro)

---

## 🚨 Troubleshooting

### Erro de build
- Verifique se `package.json` está na pasta `backend/`
- Confirme se todas as dependências estão instaladas

### Erro de conexão MongoDB
- Verifique se a string de conexão está correta
- Confirme se o IP está liberado no MongoDB Atlas

### Erro de porta
- Railway define a porta automaticamente
- Use `process.env.PORT` no código

---

## 🎯 Próximo passo
Após o Railway funcionando, vamos para o **Vercel**! 🚀
