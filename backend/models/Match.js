const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  user1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  user2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  user1Liked: {
    type: Boolean,
    default: false
  },
  user2Liked: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'matched', 'passed', 'blocked'],
    default: 'pending'
  },
  user1Passed: {
    type: Boolean,
    default: false
  },
  user2Passed: {
    type: Boolean,
    default: false
  },
  matchedAt: {
    type: Date,
    default: null
  },
  lastInteraction: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices para melhor performance
matchSchema.index({ user1: 1, user2: 1 }, { unique: true });
matchSchema.index({ status: 1 });
matchSchema.index({ matchedAt: 1 });

// Middleware para atualizar matchedAt quando status muda para 'matched'
matchSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'matched' && !this.matchedAt) {
    this.matchedAt = new Date();
  }
  this.lastInteraction = new Date();
  next();
});

// Método para verificar se é um match
matchSchema.methods.isMatch = function() {
  return this.status === 'matched';
};

// Método para obter o outro usuário
matchSchema.methods.getOtherUser = function(currentUserId) {
  return this.user1.toString() === currentUserId.toString() ? this.user2 : this.user1;
};

module.exports = mongoose.model('Match', matchSchema);
