const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Configurar Cloudinary Storage para multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'cupidomcz/users',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 800, height: 800, crop: 'limit' }, // Redimensionar para máximo 800x800
      { quality: 'auto:good' } // Otimizar qualidade automaticamente
    ]
  }
});

// Filtro para tipos de arquivo
const fileFilter = (req, file, cb) => {
  // Verificar se é uma imagem
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Apenas imagens são permitidas!'), false);
  }
};

// Configurar multer com Cloudinary
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo (Cloudinary aceita arquivos maiores)
    files: 1 // Apenas 1 arquivo por vez
  }
});

// @route   POST /api/upload/photo
// @desc    Fazer upload de uma foto
// @access  Private
router.post('/photo', auth, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma foto foi enviada' });
    }

    const userId = req.user.id;
    const photoUrl = req.file.path; // Cloudinary retorna a URL da imagem
    const isMain = req.body.isMain === 'true';

    // Buscar usuário
    const user = await User.findById(userId);
    if (!user) {
      // Deletar arquivo se usuário não existir
      // Cloudinary não precisa de unlinkSync, pois o arquivo é temporário
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Se for foto principal, desmarcar outras como principais
    if (isMain) {
      user.photos.forEach(photo => {
        photo.isMain = false;
      });
    }

    // Adicionar nova foto
    const newPhoto = {
      url: photoUrl,
      isMain: isMain,
      uploadedAt: new Date()
    };

    user.photos.push(newPhoto);

    // Se for a primeira foto, marcar como principal
    if (user.photos.length === 1) {
      user.photos[0].isMain = true;
    }

    await user.save();

    res.json({
      message: 'Foto enviada com sucesso!',
      photo: newPhoto
    });

  } catch (error) {
    console.error('Erro no upload da foto:', error);
    
    // Deletar arquivo em caso de erro
    if (req.file) {
      // Cloudinary não precisa de unlinkSync, pois o arquivo é temporário
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   POST /api/upload/photos
// @desc    Fazer upload de múltiplas fotos
// @access  Private
router.post('/photos', auth, upload.array('photos', 6), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Nenhuma foto foi enviada' });
    }

    if (req.files.length > 6) {
      return res.status(400).json({ error: 'Máximo de 6 fotos permitido' });
    }

    const userId = req.user.id;
    const uploadedPhotos = [];

    // Buscar usuário
    const user = await User.findById(userId);
    if (!user) {
      // Deletar arquivos se usuário não existir
      req.files.forEach(file => {
        // Cloudinary não precisa de unlinkSync, pois o arquivo é temporário
      });
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Processar cada foto
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const photoUrl = file.path; // Cloudinary retorna a URL da imagem
      
      const newPhoto = {
        url: photoUrl,
        isMain: false,
        uploadedAt: new Date()
      };

      user.photos.push(newPhoto);
      uploadedPhotos.push(newPhoto);
    }

    // Se for a primeira foto, marcar como principal
    if (user.photos.length === uploadedPhotos.length) {
      user.photos[0].isMain = true;
    }

    await user.save();

    res.json({
      message: `${uploadedPhotos.length} foto(s) enviada(s) com sucesso!`,
      photos: uploadedPhotos
    });

  } catch (error) {
    console.error('Erro no upload das fotos:', error);
    
    // Deletar arquivos em caso de erro
    if (req.files) {
      req.files.forEach(file => {
        // Cloudinary não precisa de unlinkSync, pois o arquivo é temporário
      });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   PUT /api/upload/photo/:photoId/main
// @desc    Definir uma foto como principal
// @access  Private
router.put('/photo/:photoId/main', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const photoId = req.params.photoId;

    // Buscar usuário
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Encontrar a foto
    const photoIndex = user.photos.findIndex(photo => 
      photo._id.toString() === photoId
    );

    if (photoIndex === -1) {
      return res.status(404).json({ error: 'Foto não encontrada' });
    }

    // Desmarcar todas as fotos como principais
    user.photos.forEach(photo => {
      photo.isMain = false;
    });

    // Marcar a foto selecionada como principal
    user.photos[photoIndex].isMain = true;

    await user.save();

    res.json({
      message: 'Foto definida como principal com sucesso!',
      photo: user.photos[photoIndex]
    });

  } catch (error) {
    console.error('Erro ao definir foto principal:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   DELETE /api/upload/photo/:photoId
// @desc    Deletar uma foto
// @access  Private
router.delete('/photo/:photoId', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const photoId = req.params.photoId;

    // Buscar usuário
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Encontrar a foto
    const photoIndex = user.photos.findIndex(photo => 
      photo._id.toString() === photoId
    );

    if (photoIndex === -1) {
      return res.status(404).json({ error: 'Foto não encontrada' });
    }

    // Verificar se é a única foto
    if (user.photos.length === 1) {
      return res.status(400).json({ error: 'Não é possível deletar a única foto do perfil' });
    }

    const photoToDelete = user.photos[photoIndex];
    const wasMain = photoToDelete.isMain;

    // Deletar arquivo do sistema
    // Cloudinary não precisa de unlinkSync, pois o arquivo é temporário

    // Remover foto do array
    user.photos.splice(photoIndex, 1);

    // Se a foto deletada era principal, definir a primeira como principal
    if (wasMain && user.photos.length > 0) {
      user.photos[0].isMain = true;
    }

    await user.save();

    res.json({
      message: 'Foto deletada com sucesso!'
    });

  } catch (error) {
    console.error('Erro ao deletar foto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   GET /api/upload/photos
// @desc    Obter todas as fotos do usuário
// @access  Private
router.get('/photos', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Buscar usuário
    const user = await User.findById(userId).select('photos');
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({
      photos: user.photos
    });

  } catch (error) {
    console.error('Erro ao buscar fotos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Middleware de erro para multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Arquivo muito grande. Máximo 10MB permitido.' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Muitos arquivos. Máximo 6 fotos permitidas.' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Campo de arquivo inesperado.' });
    }
  }
  
  if (error.message === 'Apenas imagens são permitidas!') {
    return res.status(400).json({ error: error.message });
  }

  console.error('Erro no upload:', error);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

module.exports = router;
