import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Heart, Users, MessageCircle, MapPin, Star, ArrowRight } from 'lucide-react'

const Home: React.FC = () => {
  const { user } = useAuth()

  const features = [
    {
      icon: Heart,
      title: 'Encontros Reais',
      description: 'Conecte-se com pessoas reais de Maceió que compartilham seus interesses.'
    },
    {
      icon: MapPin,
      title: 'Localização',
      description: 'Encontre pessoas próximas e descubra lugares incríveis para encontros.'
    },
    {
      icon: MessageCircle,
      title: 'Chat Seguro',
      description: 'Converse de forma segura e conheça melhor seus matches antes de se encontrar.'
    },
    {
      icon: Users,
      title: 'Comunidade',
      description: 'Faça parte de uma comunidade vibrante de pessoas solteiras em Maceió.'
    }
  ]

  const testimonials = [
    {
      name: 'Ana Clara',
      age: 28,
      location: 'Ponta Verde',
      text: 'Conheci meu namorado aqui há 6 meses! A plataforma é incrível para encontrar pessoas reais.',
      rating: 5
    },
    {
      name: 'Carlos Eduardo',
      age: 31,
      location: 'Jatiúca',
      text: 'Finalmente encontrei alguém que compartilha minha paixão pela praia e música alagoana!',
      rating: 5
    },
    {
      name: 'Mariana Santos',
      age: 25,
      location: 'Cruz das Almas',
      text: 'O Cupido Maceió me ajudou a sair da zona de conforto e conhecer pessoas incríveis.',
      rating: 5
    }
  ]

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Encontre seu{' '}
            <span className="bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">
              amor
            </span>{' '}
            em Maceió
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            A melhor rede social de namoro da capital alagoana. Conecte-se com pessoas reais, 
            descubra lugares incríveis e viva histórias de amor inesquecíveis.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link to="/discover" className="btn-primary text-lg px-8 py-4">
                Começar a Descobrir
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn-primary text-lg px-8 py-4">
                  Criar Conta Grátis
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
                <Link to="/login" className="btn-outline text-lg px-8 py-4">
                  Já tenho conta
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white rounded-2xl shadow-lg">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Por que escolher o Cupido Maceió?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Nossa plataforma foi criada especialmente para conectar pessoas de Maceió, 
              com foco na autenticidade e segurança.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="text-center group">
                  <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-pink-500 to-red-500 rounded-2xl text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">
            Números que falam por si
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">5,000+</div>
              <div className="text-pink-100">Usuários ativos</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">1,200+</div>
              <div className="text-pink-100">Casais formados</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">98%</div>
              <div className="text-pink-100">Satisfação</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-white rounded-2xl shadow-lg">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Histórias de sucesso
            </h2>
            <p className="text-lg text-gray-600">
              Veja o que nossos usuários têm a dizer sobre suas experiências
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gradient-to-br from-pink-50 to-red-50 p-6 rounded-xl border border-pink-100">
                <div className="flex items-center mb-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.age} anos • {testimonial.location}</p>
                  </div>
                  <div className="flex items-center">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-700 italic">"{testimonial.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-maceio-500 to-maceio-600 rounded-2xl text-white text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto para encontrar seu amor?
          </h2>
          <p className="text-xl mb-8 text-maceio-100">
            Junte-se a milhares de pessoas que já encontraram seu par ideal em Maceió
          </p>
          {user ? (
            <Link to="/discover" className="bg-white text-maceio-600 hover:bg-maceio-50 font-semibold py-3 px-8 rounded-lg transition-colors duration-200 inline-flex items-center">
              Explorar Perfis
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          ) : (
            <Link to="/register" className="bg-white text-maceio-600 hover:bg-maceio-50 font-semibold py-3 px-8 rounded-lg transition-colors duration-200 inline-flex items-center">
              Começar Agora
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}

export default Home
