import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axios from 'axios'
import { API_BASE_URL } from '../config/api'

// Configurar base URL da API
const API_URL = `${API_BASE_URL}/api`

interface User {
  _id: string
  name: string
  email: string
  age: number
  bio: string
  photos: Array<{
    _id: string
    url: string
    isMain: boolean
    uploadedAt: string
  }>
  location: {
    coordinates: [number, number]
    address: {
      neighborhood: string
      city: string
      state: string
    }
  }
  interests: string[]
  lookingFor: 'masculino' | 'feminino' | 'todos'
  gender: 'masculino' | 'feminino' | 'não-binário' | 'prefiro não informar'
  occupation?: string
  education?: string
  height?: number
  bodyType?: string
  smoking?: string
  drinking?: string
  hasChildren?: boolean
  wantsChildren?: string
  religion?: string
  politicalViews?: string
  isVerified: boolean
  isPremium: boolean
  lastActive: string
  preferences: {
    ageRange: {
      min: number
      max: number
    }
    maxDistance: number
    showVerifiedOnly: boolean
  }
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (userData: Partial<User> & { password: string }) => Promise<void>
  logout: () => void
  isLoading: boolean
  updateUser: (updates: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Configurar axios para incluir token em todas as requisições
  useEffect(() => {
    const token = localStorage.getItem('cupido_token')
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
  }, [])

  useEffect(() => {
    // Verificar se há usuário logado
    const checkAuth = async () => {
      const token = localStorage.getItem('cupido_token')
      console.log('🔍 Verificando autenticação...', { token: token ? 'EXISTE' : 'NÃO EXISTE' })
      
      if (token) {
        try {
          console.log('🔐 Fazendo requisição para /auth/me...')
          const response = await axios.get(`${API_URL}/auth/me`)
          console.log('✅ Usuário autenticado:', response.data.user)
          setUser(response.data.user)
        } catch (error: any) {
          console.error('❌ Erro ao verificar autenticação:', error.response?.status, error.response?.data)
          localStorage.removeItem('cupido_token')
          delete axios.defaults.headers.common['Authorization']
        }
      } else {
        console.log('❌ Nenhum token encontrado no localStorage')
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      console.log('🔐 Fazendo login...')
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      })

      const { user, token } = response.data
      console.log('✅ Login bem-sucedido:', { user: user.name, token: token ? 'EXISTE' : 'NÃO EXISTE' })
      
      // Salvar token
      localStorage.setItem('cupido_token', token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      console.log('💾 Token salvo no localStorage')
      
      setUser(user)
    } catch (error: any) {
      console.error('❌ Erro no login:', error.response?.status, error.response?.data)
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error)
      }
      throw new Error('Erro no login')
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (userData: Partial<User> & { password: string }) => {
    setIsLoading(true)
    try {
      console.log('🔐 Registrando usuário...')
      
      const response = await axios.post(`${API_URL}/auth/register`, userData, {
        timeout: 30000 // 30 segundos de timeout
      })

      console.log('✅ Resposta do registro:', response.data)
      
      const { user, token, requiresVerification } = response.data
      
      if (requiresVerification) {
        console.log('📧 Verificação de email necessária')
        // Não salvar token se precisar verificar email
        setUser(null)
        throw new Error('Verifique seu email para ativar sua conta')
      }
      
      // Salvar token apenas se não precisar verificar
      if (token) {
        localStorage.setItem('cupido_token', token)
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        setUser(user)
      }
      
    } catch (error: any) {
      console.error('❌ Erro no registro:', error)
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('Timeout: Servidor demorou para responder')
      }
      
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error)
      }
      
      throw new Error('Erro no registro')
    } finally {
      setIsLoading(false)
    }
  }

  const updateUser = async (updates: Partial<User>) => {
    try {
      const response = await axios.put(`${API_URL}/auth/me`, updates)
      setUser(response.data.user)
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error)
      }
      throw new Error('Erro ao atualizar perfil')
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('cupido_token')
    delete axios.defaults.headers.common['Authorization']
  }

  const value = {
    user,
    login,
    register,
    logout,
    isLoading,
    updateUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
