# 💕 Cupido Maceió - Rede Social de Namoro

Uma rede social de namoro completa e real para pessoas de Maceió, Alagoas. Conecte-se com pessoas reais, descubra lugares incríveis e viva histórias de amor inesquecíveis.

## 🚀 Funcionalidades

### ✨ Funcionalidades Principais
- **Perfis Completos**: Sistema de perfis detalhados com fotos, interesses, localização e preferências
- **Sistema de Matches**: Algoritmo inteligente de compatibilidade baseado em múltiplos fatores
- **Chat em Tempo Real**: Sistema de mensagens com Socket.IO para comunicação instantânea
- **Geolocalização**: Busca por usuários próximos em Maceió com cálculo de distância real
- **Upload de Fotos**: Sistema completo de gerenciamento de fotos de perfil
- **Sistema de Denúncias**: Moderação de conteúdo e usuários inadequados
- **Verificação de Perfis**: Sistema de verificação para aumentar a confiabilidade

### 🔐 Autenticação e Segurança
- **JWT Tokens**: Autenticação segura com tokens JWT
- **Hash de Senhas**: Senhas criptografadas com bcrypt
- **Middleware de Autenticação**: Proteção de rotas privadas
- **Validação de Dados**: Validação completa de entrada de dados

### 📱 Interface e UX
- **Design Responsivo**: Interface adaptável para todos os dispositivos
- **Tailwind CSS**: Estilização moderna e consistente
- **Animações**: Transições suaves e feedback visual
- **Tema Personalizado**: Cores e estilos específicos para Maceió

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** com TypeScript
- **React Router** para navegação
- **Tailwind CSS** para estilização
- **Lucide React** para ícones
- **Axios** para requisições HTTP

### Backend
- **Node.js** com Express
- **MongoDB** com Mongoose
- **Socket.IO** para comunicação em tempo real
- **JWT** para autenticação
- **Multer** para upload de arquivos
- **bcryptjs** para criptografia

## 📋 Pré-requisitos

- **Node.js** 18+ 
- **MongoDB** 6+
- **npm** ou **yarn**

## 🚀 Instalação e Configuração

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/cupido-maceio.git
cd cupido-maceio
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto:
```env
MONGODB_URI=mongodb://localhost:27017/cupido-maceio
JWT_SECRET=sua-chave-secreta-super-segura
PORT=5000
NODE_ENV=development
```

### 4. Inicie o MongoDB
Certifique-se de que o MongoDB está rodando:
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

### 5. Execute o projeto
```bash
# Desenvolvimento (frontend + backend)
npm run dev

# Apenas frontend
npm run dev:frontend

# Apenas backend
npm run dev:backend

# Produção
npm start
```

## 🌐 Acessos

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

## 📚 Estrutura do Projeto

```
cupido-maceio/
├── backend/                 # Servidor Node.js
│   ├── models/             # Modelos do MongoDB
│   ├── routes/             # Rotas da API
│   ├── middleware/         # Middlewares
│   └── server.js           # Servidor principal
├── src/                    # Frontend React
│   ├── components/         # Componentes reutilizáveis
│   ├── contexts/           # Contextos React
│   ├── pages/              # Páginas da aplicação
│   └── main.tsx            # Ponto de entrada
├── uploads/                # Arquivos enviados
├── package.json            # Dependências e scripts
└── README.md               # Este arquivo
```

## 🔌 Endpoints da API

### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Fazer login
- `GET /api/auth/me` - Obter usuário logado
- `PUT /api/auth/me` - Atualizar perfil
- `POST /api/auth/change-password` - Alterar senha

### Usuários
- `GET /api/users/discover` - Descobrir usuários compatíveis
- `GET /api/users/:id` - Obter perfil de usuário
- `POST /api/users/:id/like` - Curtir usuário
- `POST /api/users/:id/pass` - Passar de usuário
- `POST /api/users/:id/block` - Bloquear usuário

### Matches
- `GET /api/matches` - Obter matches do usuário
- `GET /api/matches/:id` - Obter detalhes do match
- `POST /api/matches/:id/message` - Enviar mensagem
- `PUT /api/matches/:id/status` - Atualizar status

### Chat
- `GET /api/chat/conversations` - Obter conversas
- `GET /api/chat/conversation/:id` - Obter mensagens
- `POST /api/chat/conversation/:id/message` - Enviar mensagem

### Upload
- `POST /api/upload/photo` - Upload de foto
- `POST /api/upload/photos` - Upload múltiplo
- `PUT /api/upload/photo/:id/main` - Definir foto principal
- `DELETE /api/upload/photo/:id` - Deletar foto

## 🎯 Funcionalidades Específicas de Maceió

### Localização
- **Coordenadas Geográficas**: Sistema de coordenadas para localização precisa
- **Bairros de Maceió**: Integração com bairros conhecidos da capital
- **Distância Real**: Cálculo de distância entre usuários em km
- **Filtros por Região**: Busca por usuários em bairros específicos

### Cultura Local
- **Interesses Regionais**: Praia, música alagoana, culinária local
- **Lugares de Encontro**: Sugestões de locais populares em Maceió
- **Eventos Locais**: Integração com eventos da região

## 🔒 Segurança e Moderação

### Sistema de Denúncias
- **Tipos de Denúncia**: Perfil falso, assédio, conteúdo inadequado
- **Moderação Automática**: Sistema de detecção de comportamento suspeito
- **Banimento de Usuários**: Sistema de banimento temporário e permanente

### Verificação de Perfis
- **Verificação por Email**: Confirmação de email obrigatória
- **Verificação de Fotos**: Sistema de verificação de fotos reais
- **Badges de Verificação**: Indicadores visuais de perfis verificados

## 📊 Estatísticas e Analytics

### Métricas de Usuários
- **Usuários Ativos**: Contagem de usuários ativos na plataforma
- **Matches Realizados**: Estatísticas de conexões bem-sucedidas
- **Taxa de Conversão**: Métricas de engajamento e conversão

### Relatórios de Moderação
- **Denúncias Processadas**: Estatísticas de denúncias e resoluções
- **Usuários Banidos**: Relatórios de usuários removidos da plataforma

## 🚀 Deploy e Produção

### Variáveis de Ambiente de Produção
```env
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/cupido-maceio
JWT_SECRET=chave-super-secreta-de-producao
NODE_ENV=production
PORT=5000
```

### Build de Produção
```bash
# Build do frontend
npm run build

# Iniciar servidor de produção
npm start
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

- **Email**: suporte@cupidomaceio.com
- **Telefone**: (82) 99999-9999
- **WhatsApp**: (82) 99999-9999

## 🙏 Agradecimentos

- Comunidade de Maceió
- Contribuidores do projeto
- Usuários beta testers
- Equipe de desenvolvimento

---

**💕 Cupido Maceió - Conectando corações em Maceió desde 2024**
