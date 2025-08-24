const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  isRead: {
    type: Boolean,
    default: false
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'sticker'],
    default: 'text'
  },
  metadata: {
    // Para mensagens de imagem
    imageUrl: String,
    imageCaption: String,
    // Para stickers
    stickerId: String,
    // Para mensagens editadas
    editedAt: Date,
    originalContent: String
  }
}, {
  timestamps: true
});

// Índices para melhor performance
messageSchema.index({ matchId: 1, createdAt: 1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ isRead: 1 });

// Middleware para validar conteúdo
messageSchema.pre('save', function(next) {
  if (this.content && this.content.trim().length === 0) {
    return next(new Error('Mensagem não pode estar vazia'));
  }
  
  if (this.content && this.content.length > 1000) {
    return next(new Error('Mensagem muito longa (máximo 1000 caracteres)'));
  }
  
  next();
});

// Método para marcar como lida
messageSchema.methods.markAsRead = function() {
  this.isRead = true;
  return this.save();
};

// Método para editar mensagem
messageSchema.methods.edit = function(newContent) {
  if (newContent.trim().length === 0) {
    throw new Error('Nova mensagem não pode estar vazia');
  }
  
  if (newContent.length > 1000) {
    throw new Error('Nova mensagem muito longa (máximo 1000 caracteres)');
  }
  
  // Salvar conteúdo original se for a primeira edição
  if (!this.metadata.originalContent) {
    this.metadata.originalContent = this.content;
  }
  
  this.content = newContent.trim();
  this.metadata.editedAt = new Date();
  
  return this.save();
};

// Método para verificar se pode ser editada (dentro de 5 minutos)
messageSchema.methods.canEdit = function() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return this.createdAt > fiveMinutesAgo;
};

// Método estático para buscar mensagens de um match
messageSchema.statics.findByMatch = function(matchId, options = {}) {
  const { limit = 50, before, after } = options;
  
  let query = { matchId };
  
  if (before) {
    query.createdAt = { ...query.createdAt, $lt: new Date(before) };
  }
  
  if (after) {
    query.createdAt = { ...query.createdAt, $gt: new Date(after) };
  }
  
  return this.find(query)
    .populate('sender', 'name photos')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Método estático para contar mensagens não lidas
messageSchema.statics.countUnread = function(matchId, userId) {
  return this.countDocuments({
    matchId,
    sender: { $ne: userId },
    isRead: false
  });
};

// Método estático para marcar mensagens como lidas
messageSchema.statics.markAsRead = function(matchId, userId) {
  return this.updateMany(
    {
      matchId,
      sender: { $ne: userId },
      isRead: false
    },
    { isRead: true }
  );
};

module.exports = mongoose.model('Message', messageSchema);
