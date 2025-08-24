const nodemailer = require('nodemailer');

// Configuração do transporter (Gmail) com configurações robustas
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true para 465, false para outras portas
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  // Configurações de timeout e retry
  connectionTimeout: 180000, // 3 minutos
  greetingTimeout: 90000,    // 1.5 minutos
  socketTimeout: 180000,     // 3 minutos
  // Configurações de TLS
  tls: {
    rejectUnauthorized: false,
    ciphers: 'SSLv3'
  },
  // Configurações de pool
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  // Configurações de retry
  maxConnections: 1,
  pool: false
});

// Verificar conexão
transporter.verify(function(error, success) {
  if (error) {
    console.log('❌ Erro na configuração do email:', error);
  } else {
    console.log('✅ Servidor de email pronto para enviar mensagens');
  }
});

// Função para enviar email de verificação
const sendVerificationEmail = async (email, name, verificationToken) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
  
  const mailOptions = {
    from: `"Cupido Maceió" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verifique sua conta - Cupido Maceió',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ec4899, #ef4444); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">💕 Cupido Maceió</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Conectando corações em Maceió</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #374151; margin-bottom: 20px;">Olá, ${name}! 👋</h2>
          
          <p style="color: #6b7280; line-height: 1.6; margin-bottom: 25px;">
            Bem-vindo ao Cupido Maceió! Para começar a encontrar o amor em nossa cidade maravilhosa, 
            precisamos verificar seu email.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background: linear-gradient(135deg, #ec4899, #ef4444); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 25px; 
                      font-weight: bold; 
                      display: inline-block;
                      box-shadow: 0 4px 15px rgba(236, 72, 153, 0.3);">
              ✅ Verificar Minha Conta
            </a>
          </div>
          
          <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">
            Se o botão não funcionar, copie e cole este link no seu navegador:
          </p>
          
          <p style="background: #f3f4f6; padding: 15px; border-radius: 8px; word-break: break-all; color: #374151; font-family: monospace;">
            ${verificationUrl}
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #9ca3af; font-size: 14px; text-align: center; margin: 0;">
            Este email foi enviado automaticamente. Não responda a este email.
            <br>
            Cupido Maceió - Conectando corações em Maceió, Alagoas
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Email de verificação enviado para:', email);
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar email de verificação:', error);
    return false;
  }
};

// Função para enviar email de redefinição de senha
const sendPasswordResetEmail = async (email, name, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: `"Cupido Maceió" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Redefinir sua senha - Cupido Maceió',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ec4899, #ef4444); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Cupido Maceió</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Redefinir senha</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #374151; margin-bottom: 20px;">Olá, ${name}! 👋</h2>
          
          <p style="color: #6b7280; line-height: 1.6; margin-bottom: 25px;">
            Você solicitou a redefinição da sua senha no Cupido Maceió. 
            Clique no botão abaixo para criar uma nova senha.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: linear-gradient(135deg, #ec4899, #ef4444); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 25px; 
                      font-weight: bold; 
                      display: inline-block;
                      box-shadow: 0 4px 15px rgba(236, 72, 153, 0.3);">
              🔑 Redefinir Senha
            </a>
          </div>
          
          <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">
            Se você não solicitou esta redefinição, ignore este email.
          </p>
          
          <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">
            Este link expira em 1 hora por segurança.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #9ca3af; font-size: 14px; text-align: center; margin: 0;">
            Este email foi enviado automaticamente. Não responda a este email.
            <br>
            Cupido Maceió - Conectando corações em Maceió, Alagoas
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Email de redefinição de senha enviado para:', email);
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar email de redefinição de senha:', error);
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail
};
