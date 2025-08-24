const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

console.log('🔧 Configurando rotas de upload...');

// Rota de teste para verificar se as rotas estão funcionando
router.get('/test', (req, res) => {
  console.log('✅ Rota de teste /upload/test funcionando!');
  res.json({ message: 'Rota de upload funcionando!', timestamp: new Date().toISOString() });
});

try {
  console.log('🔧 Configurando Cloudinary Storage...');
  
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

  console.log('✅ Cloudinary Storage configurado com sucesso!');

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

  console.log('✅ Multer configurado com sucesso!');

  // @route   POST /api/upload/photo
  // @desc    Fazer upload de uma foto
  // @access  Private
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

      const photoUrl = req.file.path; // URL do Cloudinary
      console.log('✅ URL da foto:', photoUrl);

      // Se for a primeira foto, definir como principal
      const isMain = user.photos.length === 0;

      user.photos.push({ url: photoUrl, isMain });
      await user.save();

      console.log('✅ Foto salva no banco de dados');

      // Retornar o usuário atualizado (excluindo campos sensíveis)
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

  console.log('✅ Rota POST /photos configurada com sucesso!');

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

      // Remover do Cloudinary
      const publicId = photoToDelete.url.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`cupidomcz/users/${publicId}`);

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

  console.log('✅ Rota GET /photos configurada com sucesso!');

} catch (error) {
  console.error('❌ Erro ao configurar Cloudinary:', error);
  
  // Fallback: usar storage local temporário
  console.log('🔄 Usando storage local como fallback...');
  
  const upload = multer({
    dest: 'uploads/',
    limits: {
      fileSize: 10 * 1024 * 1024,
      files: 1
    }
  });

  router.post('/photo', auth, upload.single('photo'), async (req, res) => {
    res.status(500).json({ 
      error: 'Sistema de upload temporariamente indisponível. Erro na configuração do Cloudinary.',
      details: error.message
    });
  });
}

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
