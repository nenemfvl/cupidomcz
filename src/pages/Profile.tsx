import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Camera, Upload, Star, Trash2 } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Perfil não encontrado</h1>
        </div>
      </div>
    );
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas imagens.');
      return;
    }

    // Validar tamanho (10MB máximo)
    if (file.size > 10 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 10MB.');
      return;
    }

    await uploadPhoto(file);
  };

  const uploadPhoto = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('photo', file);

    try {
      const token = localStorage.getItem('cupido_token');
      const response = await axios.post(`${API_BASE_URL}/upload/photo`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        },
      });

      // Atualizar o usuário com a nova foto
      if (response.data.photoUrl) {
        const updatedUser = { ...user };
        if (!updatedUser.photos) {
          updatedUser.photos = [];
        }
        
        // Se for a primeira foto, definir como principal
        const isMain = updatedUser.photos.length === 0;
        
        updatedUser.photos.push({
          url: response.data.photoUrl,
          isMain,
          uploadedAt: new Date().toISOString(),
        });

        await updateUser(updatedUser);
      }

      // Limpar o input de arquivo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      alert('Foto enviada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao enviar foto:', error);
      alert(error.response?.data?.error || 'Erro ao enviar foto. Tente novamente.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const setMainPhoto = async (photoIndex: number) => {
    try {
      const updatedUser = { ...user };
      if (updatedUser.photos) {
        // Marcar todas as fotos como não principais
        updatedUser.photos.forEach(photo => photo.isMain = false);
        // Marcar a foto selecionada como principal
        updatedUser.photos[photoIndex].isMain = true;
        
        await updateUser(updatedUser);
      }
    } catch (error) {
      console.error('Erro ao definir foto principal:', error);
      alert('Erro ao definir foto principal. Tente novamente.');
    }
  };

  const deletePhoto = async (photoIndex: number) => {
    if (!confirm('Tem certeza que deseja excluir esta foto?')) return;

    try {
      const updatedUser = { ...user };
      if (updatedUser.photos) {
        const deletedPhoto = updatedUser.photos[photoIndex];
        
        // Se for a foto principal e houver outras fotos, definir a primeira como principal
        if (deletedPhoto.isMain && updatedUser.photos.length > 1) {
          const nextPhotoIndex = photoIndex === 0 ? 1 : 0;
          updatedUser.photos[nextPhotoIndex].isMain = true;
        }
        
        // Remover a foto
        updatedUser.photos.splice(photoIndex, 1);
        
        await updateUser(updatedUser);
        alert('Foto excluída com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao excluir foto:', error);
      alert('Erro ao excluir foto. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Meu Perfil</h1>
          
          {/* Seção de Fotos */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Camera className="w-5 h-5 mr-2 text-pink-500" />
              Minhas Fotos
            </h2>
            
            {/* Grid de Fotos */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
              {/* Fotos existentes */}
              {user.photos && user.photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <img
                    src={photo.url}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 hover:border-pink-300 transition-colors"
                  />
                  
                  {/* Indicador de foto principal */}
                  {photo.isMain && (
                    <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                      <Star className="w-3 h-3 mr-1" />
                      Principal
                    </div>
                  )}
                  
                  {/* Overlay com ações */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                      {!photo.isMain && (
                        <button
                          onClick={() => setMainPhoto(index)}
                          className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
                          title="Definir como principal"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deletePhoto(index)}
                        className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                        title="Excluir foto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Botão de adicionar foto */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center h-32 hover:border-pink-300 hover:bg-pink-50 transition-colors cursor-pointer">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isUploading}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-pink-500 transition-colors"
                >
                  {isUploading ? (
                    <div className="text-center">
                      <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto mb-2"></div>
                      <span className="text-sm">Enviando...</span>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-pink-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mb-2" />
                      <span className="text-sm font-medium">Adicionar Foto</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Dicas */}
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <p className="font-medium mb-1">💡 Dicas para suas fotos:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Use fotos claras e de boa qualidade</li>
                <li>Mostre seu rosto claramente na primeira foto</li>
                <li>Adicione fotos que mostrem seus hobbies e interesses</li>
                <li>Máximo de 10MB por foto</li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Informações Básicas</h2>
              <p><strong>Nome:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Idade:</strong> {user.age} anos</p>
              <p><strong>Gênero:</strong> {user.gender}</p>
              <p><strong>Procurando por:</strong> {user.lookingFor}</p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Localização</h2>
              <p><strong>Bairro:</strong> {user.location?.address?.neighborhood}</p>
              <p><strong>Cidade:</strong> {user.location?.address?.city}</p>
              <p><strong>Estado:</strong> {user.location?.address?.state}</p>
            </div>
          </div>
          
          {user.bio && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Sobre mim</h2>
              <p className="text-gray-700">{user.bio}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
