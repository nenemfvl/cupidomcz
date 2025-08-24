const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  status: {
    type: String,
    enum: ['pending', 'matched', 'rejected', 'blocked'],
    default: 'pending'
  },
  initiator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  matchedAt: {
    type: Date,
    default: null
  },
  lastInteraction: {
    type: Date,
    default: Date.now
  },
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    isRead: {
      type: Boolean,
      default: false
    }
  }],
  compatibility: {
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    factors: [{
      factor: String,
      weight: Number,
      score: Number
    }]
  },
  report: {
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['inappropriate', 'fake_profile', 'harassment', 'spam', 'other']
    },
    description: String,
    reportedAt: Date,
    isResolved: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Índices para melhor performance
matchSchema.index({ users: 1 });
matchSchema.index({ status: 1 });
matchSchema.index({ matchedAt: -1 });
matchSchema.index({ lastInteraction: -1 });

// Middleware para atualizar lastInteraction
matchSchema.pre('save', function(next) {
  if (this.isModified('messages') || this.isModified('status')) {
    this.lastInteraction = new Date();
  }
  next();
});

// Método para calcular compatibilidade
matchSchema.methods.calculateCompatibility = async function() {
  const User = mongoose.model('User');
  const [user1, user2] = await User.find({ _id: { $in: this.users } });
  
  let totalScore = 0;
  const factors = [];
  
  // Idade
  const ageDiff = Math.abs(user1.age - user2.age);
  const ageScore = Math.max(0, 100 - ageDiff * 2);
  factors.push({ factor: 'idade', weight: 20, score: ageScore });
  totalScore += ageScore * 0.2;
  
  // Interesses em comum
  const commonInterests = user1.interests.filter(interest => 
    user2.interests.includes(interest)
  );
  const interestScore = (commonInterests.length / Math.max(user1.interests.length, user2.interests.length)) * 100;
  factors.push({ factor: 'interesses', weight: 25, score: interestScore });
  totalScore += interestScore * 0.25;
  
  // Localização
  const distance = user1.calculateDistance(user2);
  let locationScore = 100;
  if (distance !== null) {
    if (distance <= 5) locationScore = 100;
    else if (distance <= 15) locationScore = 80;
    else if (distance <= 30) locationScore = 60;
    else if (distance <= 50) locationScore = 40;
    else locationScore = 20;
  }
  factors.push({ factor: 'localização', weight: 30, score: locationScore });
  totalScore += locationScore * 0.3;
  
  // Valores e estilo de vida
  let lifestyleScore = 0;
  if (user1.smoking === user2.smoking) lifestyleScore += 25;
  if (user1.drinking === user2.drinking) lifestyleScore += 25;
  if (user1.hasChildren === user2.hasChildren) lifestyleScore += 25;
  if (user1.wantsChildren === user2.wantsChildren) lifestyleScore += 25;
  
  factors.push({ factor: 'estilo de vida', weight: 15, score: lifestyleScore });
  totalScore += lifestyleScore * 0.15;
  
  // Educação e ocupação
  let educationScore = 0;
  if (user1.education === user2.education) educationScore = 100;
  else if (Math.abs(this.getEducationLevel(user1.education) - this.getEducationLevel(user2.education)) <= 1) {
    educationScore = 70;
  } else {
    educationScore = 40;
  }
  
  factors.push({ factor: 'educação', weight: 10, score: educationScore });
  totalScore += educationScore * 0.1;
  
  this.compatibility = {
    score: Math.round(totalScore),
    factors: factors
  };
  
  return this.save();
};

// Método auxiliar para nível de educação
matchSchema.methods.getEducationLevel = function(education) {
  const levels = {
    'ensino médio': 1,
    'técnico': 2,
    'superior incompleto': 3,
    'superior completo': 4,
    'pós-graduação': 5,
    'mestrado': 6,
    'doutorado': 7
  };
  return levels[education] || 1;
};

// Método para verificar se é um match válido
matchSchema.methods.isValidMatch = function() {
  return this.status === 'matched' && 
         this.users.length === 2 && 
         this.matchedAt !== null;
};

// Método para obter o outro usuário do match
matchSchema.methods.getOtherUser = function(userId) {
  return this.users.find(user => user.toString() !== userId.toString());
};

// Método para adicionar mensagem
matchSchema.methods.addMessage = function(senderId, content) {
  this.messages.push({
    sender: senderId,
    content: content,
    timestamp: new Date(),
    isRead: false
  });
  return this.save();
};

// Método para marcar mensagens como lidas
matchSchema.methods.markMessagesAsRead = function(userId) {
  this.messages.forEach(message => {
    if (message.sender.toString() !== userId.toString()) {
      message.isRead = true;
    }
  });
  return this.save();
};

// Método estático para encontrar matches de um usuário
matchSchema.statics.findUserMatches = function(userId, status = null) {
  const query = { users: userId };
  if (status) query.status = status;
  
  return this.find(query)
    .populate('users', 'name age photos location interests occupation')
    .populate('messages.sender', 'name')
    .sort({ lastInteraction: -1 });
};

// Método estático para verificar se dois usuários já têm match
matchSchema.statics.checkExistingMatch = function(user1Id, user2Id) {
  return this.findOne({
    users: { $all: [user1Id, user2Id] }
  });
};

module.exports = mongoose.model('Match', matchSchema);
