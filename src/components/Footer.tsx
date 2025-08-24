import React from 'react'
import { Link } from 'react-router-dom'
import { Heart, Instagram, Facebook, Mail, MapPin } from 'lucide-react'

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo e Descrição */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-pink-500 to-red-500 rounded-full">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold">Cupido Maceió</span>
            </div>
            <p className="text-gray-300 mb-4 max-w-md">
              Conectando corações em Maceió! Encontre o amor verdadeiro em nossa cidade maravilhosa.
            </p>
            <div className="flex items-center space-x-2 text-gray-400">
              <MapPin className="w-4 h-4" />
              <span>Maceió, Alagoas - Brasil</span>
            </div>
          </div>

          {/* Links Úteis */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-pink-400">Links Úteis</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-gray-300 hover:text-pink-400 transition-colors">
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-300 hover:text-pink-400 transition-colors">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-300 hover:text-pink-400 transition-colors">
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link to="/safety" className="text-gray-300 hover:text-pink-400 transition-colors">
                  Dicas de Segurança
                </Link>
              </li>
            </ul>
          </div>

          {/* Redes Sociais e Contato */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-pink-400">Conecte-se</h3>
            <div className="space-y-3">
              <a 
                href="https://instagram.com/cupidomcz" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-300 hover:text-pink-400 transition-colors"
              >
                <Instagram className="w-5 h-5" />
                <span>@cupidomcz</span>
              </a>
              <a 
                href="https://facebook.com/cupidomcz" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-300 hover:text-pink-400 transition-colors"
              >
                <Facebook className="w-5 h-5" />
                <span>Cupido Maceió</span>
              </a>
              <a 
                href="mailto:contato@cupidomcz.com" 
                className="flex items-center space-x-2 text-gray-300 hover:text-pink-400 transition-colors"
              >
                <Mail className="w-5 h-5" />
                <span>contato@cupidomcz.com</span>
              </a>
            </div>
          </div>
        </div>

        {/* Linha de Separação */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 Cupido Maceió. Todos os direitos reservados.
            </p>
            <p className="text-gray-400 text-sm mt-2 md:mt-0">
              Feito com ❤️ para Maceió
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
