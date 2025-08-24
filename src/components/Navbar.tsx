import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Heart, Menu, X, User, MessageCircle, Search, LogOut } from 'lucide-react'

const Navbar: React.FC = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'Descobrir', href: '/discover', icon: Search },
    { name: 'Matches', href: '/matches', icon: Heart },
    { name: 'Chat', href: '/chat', icon: MessageCircle },
    { name: 'Perfil', href: '/profile', icon: User },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-pink-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-pink-500 to-red-500 rounded-full">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">
              Cupido Maceió
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {user ? (
              <>
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors duration-200 ${
                        isActive(item.href)
                          ? 'bg-pink-100 text-pink-700'
                          : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sair</span>
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-pink-600 px-4 py-2 rounded-lg hover:bg-pink-50 transition-colors duration-200"
                >
                  Entrar
                </Link>
                <Link
                  to="/register"
                  className="btn-primary"
                >
                  Cadastrar
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-pink-600 p-2 rounded-lg hover:bg-pink-50 transition-colors duration-200"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-pink-100">
              {user ? (
                <>
                  {navigation.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200 ${
                          isActive(item.href)
                            ? 'bg-pink-100 text-pink-700'
                            : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.name}</span>
                      </Link>
                    )
                  })}
                  <button
                    onClick={() => {
                      logout()
                      setIsMobileMenuOpen(false)
                    }}
                    className="flex items-center space-x-3 w-full px-3 py-2 text-left text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Sair</span>
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  <Link
                    to="/login"
                    className="block px-3 py-2 text-gray-600 hover:text-pink-600 rounded-lg hover:bg-pink-50 transition-colors duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Entrar
                  </Link>
                  <Link
                    to="/register"
                    className="block px-3 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Cadastrar
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
