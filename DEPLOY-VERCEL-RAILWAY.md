# 🚀 Deploy Cupido Maceió - Vercel + Railway

## 📋 Pré-requisitos
- ✅ Conta no GitHub (já temos!)
- ✅ Conta no Vercel (gratuita)
- ✅ Conta no Railway (gratuita)
- ✅ Conta no MongoDB Atlas (gratuita)

---

## 🌐 PASSO 1: MongoDB Atlas (Banco de Dados)

### 1.1 Criar conta
1. Acesse: https://mongodb.com/atlas
2. Clique em "Try Free"
3. Crie uma conta gratuita

### 1.2 Criar cluster
1. Escolha "FREE" tier
2. Selecione região (São Paulo)
3. Clique em "Create"

### 1.3 Configurar acesso
1. **Database Access** → "Add New Database User"
   - Username: `cupidomcz_user`
   - Password: `[senha forte]`
   - Role: "Read and write to any database"

2. **Network Access** → "Add IP Address"
   - Clique em "Allow Access from Anywhere" (0.0.0.0/0)

### 1.4 Obter string de conexão
1. **Database** → "Connect"
2. Escolha "Connect your application"
3. Copie a string de conexão
4. Substitua `<password>` pela senha do usuário

---

## 🚂 PASSO 2: Railway (Backend)

### 2.1 Criar conta
1. Acesse: https://railway.app
2. Faça login com GitHub

### 2.2 Deploy do backend
1. Clique em "New Project"
2. Escolha "Deploy from GitHub repo"
3. Selecione: `nenemfvl/cupidomcz`
4. Escolha a pasta: `backend/`

### 2.3 Configurar variáveis
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://cupidomcz_user:[senha]@cluster0.xxxxx.mongodb.net/cupidomcz?retryWrites=true&w=majority
JWT_SECRET=[senha super secreta de 32+ caracteres]
PORT=10000
FRONTEND_URL=https://cupidomcz.vercel.app
```

### 2.4 Deploy
1. Clique em "Deploy"
2. Aguarde o build
3. Copie a URL gerada (ex: `https://cupidomcz-backend-production.up.railway.app`)

---

## ⚡ PASSO 3: Vercel (Frontend)

### 3.1 Criar conta
1. Acesse: https://vercel.com
2. Faça login com GitHub

### 3.2 Deploy do frontend
1. Clique em "New Project"
2. Importe: `nenemfvl/cupidomcz`
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `.` (raiz)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 3.3 Configurar variáveis
```env
VITE_API_URL=https://cupidomcz-backend-production.up.railway.app
```

### 3.4 Deploy
1. Clique em "Deploy"
2. Aguarde o build
3. URL será: `https://cupidomcz.vercel.app`

---

## 🔧 PASSO 4: Configuração Final

### 4.1 Atualizar Railway
1. Volte ao Railway
2. Adicione variável: `FRONTEND_URL=https://cupidomcz.vercel.app`
3. Redeploy

### 4.2 Testar
1. Acesse: `https://cupidomcz.vercel.app`
2. Teste cadastro e login
3. Verifique se está funcionando

---

## 🚨 Troubleshooting

### Backend não conecta ao MongoDB
- Verifique se a string de conexão está correta
- Confirme se o IP está liberado no MongoDB Atlas

### Frontend não conecta ao backend
- Verifique se `VITE_API_URL` está correto
- Confirme se o backend está rodando no Railway

### Erro de CORS
- Verifique se `FRONTEND_URL` está configurado no backend
- Confirme se as URLs estão corretas

---

## 💰 Custos
- **MongoDB Atlas**: Gratuito (512MB)
- **Railway**: Gratuito (500 horas/mês)
- **Vercel**: Gratuito (100GB bandwidth/mês)

---

## 🎯 URLs Finais
- **Frontend**: `https://cupidomcz.vercel.app`
- **Backend**: `https://cupidomcz-backend-production.up.railway.app`
- **GitHub**: `https://github.com/nenemfvl/cupidomcz`

---

## 🚀 Próximos passos
1. Criar conta no MongoDB Atlas
2. Deploy no Railway
3. Deploy no Vercel
4. Testar aplicação

**Boa sorte! 🎉**
