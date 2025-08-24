const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true,
    minlength: [2, 'Nome deve ter pelo menos 2 caracteres'],
    maxlength: [50, 'Nome não pode ter mais de 50 caracteres']
  },
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  password: {
    type: String,
    required: [true, 'Senha é obrigatória'],
    minlength: [6, 'Senha deve ter pelo menos 6 caracteres'],
    select: false
  },
  age: {
    type: Number,
    required: [true, 'Idade é obrigatória'],
    min: [18, 'Idade mínima é 18 anos'],
    max: [100, 'Idade máxima é 100 anos']
  },
  gender: {
    type: String,
    required: [true, 'Gênero é obrigatório'],
    enum: ['masculino', 'feminino', 'não-binário', 'prefiro não informar']
  },
  lookingFor: {
    type: String,
    required: [true, 'Preferência é obrigatória'],
    enum: ['masculino', 'feminino', 'todos']
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio não pode ter mais de 500 caracteres'],
    default: ''
  },
  photos: [{
    url: {
      type: String,
      required: true
    },
    isMain: {
      type: Boolean,
      default: false
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    },
    address: {
      neighborhood: String,
      city: String,
      state: String
    }
  },
  interests: [{
    type: String,
    maxlength: 30
  }],
  occupation: {
    type: String,
    maxlength: 100
  },
  education: {
    type: String,
    enum: ['ensino médio', 'técnico', 'superior incompleto', 'superior completo', 'pós-graduação', 'mestrado', 'doutorado']
  },
  height: {
    type: Number,
    min: 100,
    max: 250
  },
  bodyType: {
    type: String,
    enum: ['magro', 'atlético', 'normal', 'acima do peso', 'robusto']
  },
  smoking: {
    type: String,
    enum: ['não fumo', 'fumo ocasionalmente', 'fumo regularmente', 'ex-fumante']
  },
  drinking: {
    type: String,
    enum: ['não bebo', 'bebo ocasionalmente', 'bebo regularmente', 'ex-bebedor']
  },
  hasChildren: {
    type: Boolean,
    default: false
  },
  wantsChildren: {
    type: String,
    enum: ['sim', 'não', 'talvez', 'já tenho']
  },
  religion: {
    type: String,
    maxlength: 50
  },
  politicalViews: {
    type: String,
    enum: ['conservador', 'moderado', 'liberal', 'apolítico', 'prefiro não informar']
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    select: false
  },
  verificationTokenExpires: {
    type: Date,
    select: false
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  preferences: {
    ageRange: {
      min: { type: Number, default: 18 },
      max: { type: Number, default: 100 }
    },
    maxDistance: { type: Number, default: 50 }, // em km
    showVerifiedOnly: { type: Boolean, default: false }
  },
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  reportedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Índices para melhor performance
userSchema.index({ 'location.coordinates': '2dsphere' });
userSchema.index({ age: 1, gender: 1, lookingFor: 1 });
userSchema.index({ lastActive: -1 });

// Middleware para hash da senha
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para verificar senha
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Método para atualizar última atividade
userSchema.methods.updateLastActive = function() {
  this.lastActive = new Date();
  return this.save();
};

// Método para calcular distância
userSchema.methods.calculateDistance = function(otherUser) {
  if (!this.location.coordinates || !otherUser.location.coordinates) {
    return null;
  }
  
  const [lon1, lat1] = this.location.coordinates;
  const [lon2, lat2] = otherUser.location.coordinates;
  
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Método para obter usuários compatíveis
userSchema.statics.findCompatibleUsers = function(userId, limit = 20) {
  return this.aggregate([
    {
      $match: {
        _id: { $ne: mongoose.Types.ObjectId(userId) },
        isVerified: true,
        lastActive: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Ativo na última semana
      }
    },
    {
      $addFields: {
        distance: {
          $cond: {
            if: { $and: [
              { $ne: ['$location.coordinates', null] },
              { $ne: ['$location.coordinates', []] }
            ]},
            then: {
              $geoNear: {
                near: { type: "Point", coordinates: "$location.coordinates" },
                distanceField: "distance",
                spherical: true
              }
            },
            else: null
          }
        }
      }
    },
    { $sort: { lastActive: -1 } },
    { $limit: limit }
  ]);
};

module.exports = mongoose.model('User', userSchema);
