const express = require('express');
const multer = require('multer');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

console.log('🔧 Configurando rotas de upload...');

// Rota de teste para verificar se as rotas estão funcionando
router.get('/test', (req, res) => {
  console.log('✅ Rota de teste /upload/test funcionando!');
  res.json({ message: 'Rota de upload funcionando!', timestamp: new Date().toISOString() });
});

// Rota de upload simples para teste (sem Cloudinary)
router.post('/photo-simple', auth, async (req, res) => {
  console.log('📸 Teste de rota POST /photo-simple funcionando!');
  res.json({ 
    message: 'Rota POST funcionando!', 
    timestamp: new Date().toISOString(),
    note: 'Esta é uma rota de teste sem upload real'
  });
});

// Configurar storage local temporário (sem Cloudinary)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.jpg');
  }
});

// Filtro para tipos de arquivo
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Apenas imagens são permitidas!'), false);
  }
};

// Configurar multer com storage local
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
    files: 1
  }
});

console.log('✅ Multer configurado com storage local!');

// Rota para upload de foto
router.post('/photo', auth, upload.single('photo'), async (req, res) => {
  console.log('📸 Recebendo upload de foto...');
  try {
    if (!req.file) {
      console.log('❌ Nenhuma foto enviada');
      return res.status(400).json({ error: 'Nenhuma foto enviada.' });
    }

    console.log('✅ Arquivo recebido:', req.file.originalname);

    const user = await User.findById(req.user.id);
    if (!user) {
      console.log('❌ Usuário não encontrado');
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // URL temporária (local)
    const photoUrl = `/uploads/${req.file.filename}`;
    console.log('✅ URL da foto:', photoUrl);

    // Se for a primeira foto, definir como principal
    const isMain = user.photos.length === 0;

    user.photos.push({ 
      url: photoUrl, 
      isMain,
      uploadedAt: new Date().toISOString()
    });
    await user.save();

    console.log('✅ Foto salva no banco de dados');

    // Retornar o usuário atualizado
    const updatedUser = await User.findById(req.user.id).select('-password -verificationToken -verificationTokenExpires');

    res.status(200).json({ 
      message: 'Foto enviada com sucesso!', 
      user: updatedUser,
      photoUrl: photoUrl 
    });
  } catch (error) {
    console.error('❌ Erro ao fazer upload da foto:', error);
    res.status(500).json({ error: 'Erro interno do servidor ao fazer upload da foto.' });
  }
});

console.log('✅ Rota POST /photo configurada com sucesso!');

// Rota para definir foto principal
router.put('/photo/main/:photoId', auth, async (req, res) => {
  try {
    const { photoId } = req.params;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // Resetar todas as fotos para isMain: false
    user.photos.forEach(photo => {
      photo.isMain = false;
    });

    // Encontrar e definir a nova foto principal
    const targetPhoto = user.photos.id(photoId);
    if (!targetPhoto) {
      return res.status(404).json({ error: 'Foto não encontrada.' });
    }
    targetPhoto.isMain = true;

    await user.save();

    // Retornar o usuário atualizado
    const updatedUser = await User.findById(req.user.id).select('-password -verificationToken -verificationTokenExpires');
    res.status(200).json({ message: 'Foto principal atualizada com sucesso!', user: updatedUser });
  } catch (error) {
    console.error('Erro ao definir foto principal:', error);
    res.status(500).json({ error: 'Erro interno do servidor ao definir foto principal.' });
  }
});

console.log('✅ Rota PUT /photo/main/:photoId configurada com sucesso!');

// Rota para excluir foto
router.delete('/photo/:photoId', auth, async (req, res) => {
  try {
    const { photoId } = req.params;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const photoIndex = user.photos.findIndex(photo => photo._id.toString() === photoId);

    if (photoIndex === -1) {
      return res.status(404).json({ error: 'Foto não encontrada.' });
    }

    const photoToDelete = user.photos[photoIndex];

    // Remover foto do array
    user.photos.splice(photoIndex, 1);

    // Se a foto excluída era a principal e ainda há fotos, definir a primeira como principal
    if (photoToDelete.isMain && user.photos.length > 0) {
      user.photos[0].isMain = true;
    }

    await user.save();

    // Retornar o usuário atualizado
    const updatedUser = await User.findById(req.user.id).select('-password -verificationToken -verificationTokenExpires');
    res.status(200).json({ message: 'Foto excluída com sucesso!', user: updatedUser });
  } catch (error) {
    console.error('Erro ao excluir foto:', error);
    res.status(500).json({ error: 'Erro interno do servidor ao excluir foto.' });
  }
});

console.log('✅ Rota DELETE /photo/:photoId configurada com sucesso!');

console.log('🎉 Todas as rotas de upload configuradas com sucesso!');

module.exports = router;
