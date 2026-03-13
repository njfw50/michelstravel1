import { useI18n } from "@/lib/i18n";
import { SEO } from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import {
  Shield,
  Lock,
  Eye,
  Database,
  Cookie,
  Share2,
  Baby,
  Globe,
  Mail,
  ArrowLeft,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type SectionProps = {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
};

function Section({ icon, title, children }: SectionProps) {
  return (
    <Card className="p-6 md:p-8">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-blue-50 rounded-md text-blue-600 mt-0.5 shrink-0">
          {icon}
        </div>
        <h2 className="text-lg font-bold text-gray-900">
          {title}
        </h2>
      </div>
      <div className="text-sm text-gray-600 leading-relaxed space-y-3 ml-0 md:ml-12">
        {children}
      </div>
    </Card>
  );
}

export default function PrivacyPolicy() {
  const { language } = useI18n();
  const c = getContent(language);

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO title={c.pageTitle} description={c.pageDesc} />

      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4 -ml-2" data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4 mr-1" />
              {c.back}
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-blue-600 rounded-lg text-white">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900" data-testid="text-privacy-title">
              {c.title}
            </h1>
          </div>
          <p className="text-gray-500 text-sm" data-testid="text-privacy-updated">{c.updated}</p>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-8 space-y-5">

        <Card className="p-6 md:p-8 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-sm text-blue-800 leading-relaxed" data-testid="text-privacy-intro">{c.intro}</p>
          </div>
        </Card>

        <Section icon={<Eye className="w-5 h-5" />} title={c.s1t}>
          <p>{c.s1p1}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{c.s1l1}</li>
            <li>{c.s1l2}</li>
            <li>{c.s1l3}</li>
            <li>{c.s1l4}</li>
            <li>{c.s1l5}</li>
          </ul>
          <p>{c.s1p2}</p>
        </Section>

        <Section icon={<Database className="w-5 h-5" />} title={c.s2t}>
          <p>{c.s2p1}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{c.s2l1}</li>
            <li>{c.s2l2}</li>
            <li>{c.s2l3}</li>
            <li>{c.s2l4}</li>
          </ul>
        </Section>

        <Section icon={<Lock className="w-5 h-5" />} title={c.s3t}>
          <p>{c.s3p1}</p>
          <p>{c.s3p2}</p>
          <p>{c.s3p3}</p>
          <p>{c.s3p4}</p>
        </Section>

        <Section icon={<Share2 className="w-5 h-5" />} title={c.s4t}>
          <p>{c.s4p1}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{c.s4l1}</li>
            <li>{c.s4l2}</li>
            <li>{c.s4l3}</li>
          </ul>
          <p>{c.s4p2}</p>
        </Section>

        <Section icon={<Cookie className="w-5 h-5" />} title={c.s5t}>
          <p>{c.s5p1}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{c.s5l1}</li>
            <li>{c.s5l2}</li>
            <li>{c.s5l3}</li>
          </ul>
          <p>{c.s5p2}</p>
        </Section>

        <Section icon={<FileText className="w-5 h-5" />} title={c.s6t}>
          <p>{c.s6p1}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{c.s6l1}</li>
            <li>{c.s6l2}</li>
            <li>{c.s6l3}</li>
            <li>{c.s6l4}</li>
            <li>{c.s6l5}</li>
          </ul>
          <p>{c.s6p2}</p>
        </Section>

        <Section icon={<Database className="w-5 h-5" />} title={c.s7t}>
          <p>{c.s7p1}</p>
          <p>{c.s7p2}</p>
          <p>{c.s7p3}</p>
        </Section>

        <Section icon={<Baby className="w-5 h-5" />} title={c.s8t}>
          <p>{c.s8p1}</p>
          <p>{c.s8p2}</p>
        </Section>

        <Section icon={<Globe className="w-5 h-5" />} title={c.s9t}>
          <p>{c.s9p1}</p>
          <p>{c.s9p2}</p>
        </Section>

        <Section icon={<Mail className="w-5 h-5" />} title={c.s10t}>
          <p>{c.s10p1}</p>
          <div className="mt-2 font-medium text-gray-700 space-y-1">
            <p>Michels Travel</p>
            <p>contact@michelstravel.agency</p>
            <p>+1 (862) 350-1161</p>
            <p>New Jersey, USA</p>
          </div>
        </Section>
      </div>
    </div>
  );
}

function getContent(lang: string) {
  if (lang === "es") return es;
  if (lang === "en") return en;
  return pt;
}

const pt = {
  pageTitle: "Política de Privacidade - Michels Travel",
  pageDesc: "Política de privacidade e proteção de dados da Michels Travel.",
  back: "Voltar",
  title: "Política de Privacidade",
  updated: "Atualizada em fevereiro de 2026",
  intro: "A Michels Travel valoriza a sua privacidade e está comprometida com a proteção dos seus dados pessoais. Esta política explica como coletamos, usamos, armazenamos e protegemos suas informações ao utilizar nossos serviços.",

  s1t: "1. Dados que Coletamos",
  s1p1: "Coletamos apenas os dados estritamente necessários para fornecer nossos serviços:",
  s1l1: "Dados de identificação: nome completo, data de nascimento e número de documento (passaporte ou identidade) — necessários para emissão de passagens aéreas",
  s1l2: "Dados de contato: endereço de e-mail e número de telefone — para comunicação sobre suas reservas",
  s1l3: "Dados de conta: email de acesso, senha criptografada e conexões de autenticação via GitHub — para acesso seguro à sua conta",
  s1l4: "Dados de reserva: histórico de buscas, reservas efetuadas, preferências de viagem",
  s1l5: "Dados de pagamento: processados exclusivamente pelo Stripe, sem armazenamento em nossos servidores",
  s1p2: "Não coletamos dados sensíveis como origem racial, opiniões políticas, crenças religiosas ou dados biométricos.",

  s2t: "2. Como Utilizamos Seus Dados",
  s2p1: "Seus dados são utilizados exclusivamente para:",
  s2l1: "Processar e gerenciar suas reservas de passagens aéreas",
  s2l2: "Enviar confirmações de reserva, atualizações de voo e informações relevantes sobre sua viagem",
  s2l3: "Prestar atendimento ao cliente e suporte técnico",
  s2l4: "Cumprir obrigações legais e regulatórias aplicáveis",

  s3t: "3. Segurança dos Dados",
  s3p1: "Implementamos medidas rigorosas de segurança para proteger seus dados pessoais contra acesso não autorizado, alteração, divulgação ou destruição.",
  s3p2: "Todas as comunicações entre seu navegador e nossos servidores são criptografadas com protocolo TLS/SSL.",
  s3p3: "Os dados de pagamento são processados diretamente pelo Stripe, que possui certificação PCI DSS Nível 1, o mais alto nível de segurança da indústria de pagamentos. Nunca temos acesso aos dados completos do seu cartão.",
  s3p4: "Nossas sessões de usuário são armazenadas de forma segura em banco de dados criptografado com expiração automática.",

  s4t: "4. Compartilhamento de Dados",
  s4p1: "Seus dados pessoais podem ser compartilhados apenas com:",
  s4l1: "Companhias aéreas parceiras — exclusivamente os dados necessários para emissão e gestão das passagens (nome, documento, data de nascimento)",
  s4l2: "Stripe — para processamento seguro de pagamentos",
  s4l3: "Autoridades competentes — quando exigido por lei ou ordem judicial",
  s4p2: "Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins de marketing, publicidade ou qualquer outro propósito comercial.",

  s5t: "5. Cookies e Tecnologias de Rastreamento",
  s5p1: "Utilizamos cookies essenciais para o funcionamento do site:",
  s5l1: "Cookies de sessão — para manter você conectado à sua conta durante a navegação",
  s5l2: "Cookies de preferência — para salvar seu idioma preferido e configurações do site",
  s5l3: "Cookies de segurança — para proteção contra fraudes e acessos não autorizados",
  s5p2: "Não utilizamos cookies de rastreamento de terceiros, nem ferramentas de publicidade direcionada. Você pode gerenciar suas preferências de cookies através das configurações do seu navegador.",

  s6t: "6. Seus Direitos",
  s6p1: "Você tem os seguintes direitos sobre seus dados pessoais:",
  s6l1: "Acesso — solicitar uma cópia dos dados pessoais que temos sobre você",
  s6l2: "Correção — solicitar a correção de dados incompletos ou incorretos",
  s6l3: "Exclusão — solicitar a exclusão dos seus dados pessoais de nossos sistemas",
  s6l4: "Portabilidade — solicitar seus dados em formato estruturado e legível por máquina",
  s6l5: "Revogação de consentimento — retirar seu consentimento para processamento de dados a qualquer momento",
  s6p2: "Para exercer qualquer um desses direitos, entre em contato conosco por e-mail. Responderemos sua solicitação em até 15 dias úteis.",

  s7t: "7. Retenção de Dados",
  s7p1: "Mantemos seus dados pessoais pelo tempo necessário para cumprir as finalidades para as quais foram coletados, incluindo obrigações legais e fiscais.",
  s7p2: "Dados de reservas são mantidos por 5 anos após a data da viagem, conforme exigências legais do setor de aviação.",
  s7p3: "Após solicitar a exclusão da sua conta, seus dados pessoais serão removidos em até 30 dias, exceto quando a retenção for exigida por lei.",

  s8t: "8. Menores de Idade",
  s8p1: "Nossos serviços não são direcionados a menores de 18 anos. Não coletamos intencionalmente dados pessoais de menores desacompanhados.",
  s8p2: "Reservas para passageiros menores de 18 anos devem ser realizadas por um responsável legal, que será o titular da conta e responsável pelas informações fornecidas.",

  s9t: "9. Alterações nesta Política",
  s9p1: "Podemos atualizar esta política periodicamente para refletir mudanças em nossas práticas ou por exigências legais. A data de atualização será sempre indicada no topo desta página.",
  s9p2: "Recomendamos que você revise esta política regularmente. O uso continuado dos nossos serviços após alterações constitui aceitação da política atualizada.",

  s10t: "10. Contato",
  s10p1: "Se tiver dúvidas, preocupações ou solicitações relacionadas à privacidade dos seus dados, entre em contato:",
};

const en = {
  pageTitle: "Privacy Policy - Michels Travel",
  pageDesc: "Privacy policy and data protection for Michels Travel.",
  back: "Back",
  title: "Privacy Policy",
  updated: "Updated February 2026",
  intro: "Michels Travel values your privacy and is committed to protecting your personal data. This policy explains how we collect, use, store, and protect your information when using our services.",

  s1t: "1. Data We Collect",
  s1p1: "We collect only the data strictly necessary to provide our services:",
  s1l1: "Identification data: full name, date of birth, and document number (passport or ID) — required for airline ticket issuance",
  s1l2: "Contact data: email address and phone number — for communication about your bookings",
  s1l3: "Account data: login email, encrypted password, and GitHub authentication links — for secure access to your account",
  s1l4: "Booking data: search history, completed bookings, travel preferences",
  s1l5: "Payment data: processed exclusively by Stripe, without storage on our servers",
  s1p2: "We do not collect sensitive data such as racial origin, political opinions, religious beliefs, or biometric data.",

  s2t: "2. How We Use Your Data",
  s2p1: "Your data is used exclusively to:",
  s2l1: "Process and manage your airline ticket bookings",
  s2l2: "Send booking confirmations, flight updates, and relevant travel information",
  s2l3: "Provide customer service and technical support",
  s2l4: "Comply with applicable legal and regulatory obligations",

  s3t: "3. Data Security",
  s3p1: "We implement rigorous security measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.",
  s3p2: "All communications between your browser and our servers are encrypted with TLS/SSL protocol.",
  s3p3: "Payment data is processed directly by Stripe, which holds PCI DSS Level 1 certification, the highest security level in the payment industry. We never have access to your complete card data.",
  s3p4: "Our user sessions are securely stored in an encrypted database with automatic expiration.",

  s4t: "4. Data Sharing",
  s4p1: "Your personal data may be shared only with:",
  s4l1: "Partner airlines — exclusively the data required for ticket issuance and management (name, document, date of birth)",
  s4l2: "Stripe — for secure payment processing",
  s4l3: "Competent authorities — when required by law or court order",
  s4p2: "We do not sell, rent, or share your personal data with third parties for marketing, advertising, or any other commercial purpose.",

  s5t: "5. Cookies and Tracking Technologies",
  s5p1: "We use essential cookies for the site to function:",
  s5l1: "Session cookies — to keep you logged into your account during browsing",
  s5l2: "Preference cookies — to save your preferred language and site settings",
  s5l3: "Security cookies — for protection against fraud and unauthorized access",
  s5p2: "We do not use third-party tracking cookies or targeted advertising tools. You can manage your cookie preferences through your browser settings.",

  s6t: "6. Your Rights",
  s6p1: "You have the following rights regarding your personal data:",
  s6l1: "Access — request a copy of the personal data we hold about you",
  s6l2: "Correction — request correction of incomplete or inaccurate data",
  s6l3: "Deletion — request deletion of your personal data from our systems",
  s6l4: "Portability — request your data in a structured, machine-readable format",
  s6l5: "Withdrawal of consent — withdraw your consent for data processing at any time",
  s6p2: "To exercise any of these rights, contact us by email. We will respond to your request within 15 business days.",

  s7t: "7. Data Retention",
  s7p1: "We retain your personal data for as long as necessary to fulfill the purposes for which it was collected, including legal and tax obligations.",
  s7p2: "Booking data is retained for 5 years after the travel date, as required by aviation industry regulations.",
  s7p3: "After requesting account deletion, your personal data will be removed within 30 days, except when retention is required by law.",

  s8t: "8. Minors",
  s8p1: "Our services are not directed at individuals under 18 years of age. We do not intentionally collect personal data from unaccompanied minors.",
  s8p2: "Bookings for passengers under 18 must be made by a legal guardian, who will be the account holder and responsible for the information provided.",

  s9t: "9. Changes to This Policy",
  s9p1: "We may update this policy periodically to reflect changes in our practices or legal requirements. The update date will always be indicated at the top of this page.",
  s9p2: "We recommend that you review this policy regularly. Continued use of our services after changes constitutes acceptance of the updated policy.",

  s10t: "10. Contact",
  s10p1: "If you have questions, concerns, or requests related to your data privacy, please contact us:",
};

const es = {
  pageTitle: "Política de Privacidad - Michels Travel",
  pageDesc: "Política de privacidad y protección de datos de Michels Travel.",
  back: "Volver",
  title: "Política de Privacidad",
  updated: "Actualizada en febrero de 2026",
  intro: "Michels Travel valora su privacidad y está comprometida con la protección de sus datos personales. Esta política explica cómo recopilamos, usamos, almacenamos y protegemos su información al utilizar nuestros servicios.",

  s1t: "1. Datos que Recopilamos",
  s1p1: "Recopilamos solo los datos estrictamente necesarios para brindar nuestros servicios:",
  s1l1: "Datos de identificación: nombre completo, fecha de nacimiento y número de documento (pasaporte o identidad) — necesarios para la emisión de boletos aéreos",
  s1l2: "Datos de contacto: dirección de correo electrónico y número de teléfono — para comunicación sobre sus reservas",
  s1l3: "Datos de cuenta: email de acceso, contraseña cifrada y conexiones de autenticación por GitHub — para acceso seguro a su cuenta",
  s1l4: "Datos de reserva: historial de búsquedas, reservas realizadas, preferencias de viaje",
  s1l5: "Datos de pago: procesados exclusivamente por Stripe, sin almacenamiento en nuestros servidores",
  s1p2: "No recopilamos datos sensibles como origen racial, opiniones políticas, creencias religiosas o datos biométricos.",

  s2t: "2. Cómo Utilizamos Sus Datos",
  s2p1: "Sus datos se utilizan exclusivamente para:",
  s2l1: "Procesar y gestionar sus reservas de boletos aéreos",
  s2l2: "Enviar confirmaciones de reserva, actualizaciones de vuelos e información relevante sobre su viaje",
  s2l3: "Prestar servicio al cliente y soporte técnico",
  s2l4: "Cumplir con las obligaciones legales y regulatorias aplicables",

  s3t: "3. Seguridad de los Datos",
  s3p1: "Implementamos medidas rigurosas de seguridad para proteger sus datos personales contra acceso no autorizado, alteración, divulgación o destrucción.",
  s3p2: "Todas las comunicaciones entre su navegador y nuestros servidores están cifradas con protocolo TLS/SSL.",
  s3p3: "Los datos de pago son procesados directamente por Stripe, que cuenta con certificación PCI DSS Nivel 1, el más alto nivel de seguridad de la industria de pagos. Nunca tenemos acceso a los datos completos de su tarjeta.",
  s3p4: "Nuestras sesiones de usuario se almacenan de forma segura en una base de datos cifrada con expiración automática.",

  s4t: "4. Compartir Datos",
  s4p1: "Sus datos personales pueden compartirse únicamente con:",
  s4l1: "Aerolíneas asociadas — exclusivamente los datos necesarios para la emisión y gestión de boletos (nombre, documento, fecha de nacimiento)",
  s4l2: "Stripe — para el procesamiento seguro de pagos",
  s4l3: "Autoridades competentes — cuando lo exija la ley u orden judicial",
  s4p2: "No vendemos, alquilamos ni compartimos sus datos personales con terceros para fines de marketing, publicidad o cualquier otro propósito comercial.",

  s5t: "5. Cookies y Tecnologías de Rastreo",
  s5p1: "Utilizamos cookies esenciales para el funcionamiento del sitio:",
  s5l1: "Cookies de sesión — para mantenerlo conectado a su cuenta durante la navegación",
  s5l2: "Cookies de preferencia — para guardar su idioma preferido y configuraciones del sitio",
  s5l3: "Cookies de seguridad — para protección contra fraudes y accesos no autorizados",
  s5p2: "No utilizamos cookies de rastreo de terceros ni herramientas de publicidad dirigida. Puede gestionar sus preferencias de cookies a través de la configuración de su navegador.",

  s6t: "6. Sus Derechos",
  s6p1: "Usted tiene los siguientes derechos sobre sus datos personales:",
  s6l1: "Acceso — solicitar una copia de los datos personales que tenemos sobre usted",
  s6l2: "Corrección — solicitar la corrección de datos incompletos o incorrectos",
  s6l3: "Eliminación — solicitar la eliminación de sus datos personales de nuestros sistemas",
  s6l4: "Portabilidad — solicitar sus datos en un formato estructurado y legible por máquina",
  s6l5: "Revocación de consentimiento — retirar su consentimiento para el procesamiento de datos en cualquier momento",
  s6p2: "Para ejercer cualquiera de estos derechos, contáctenos por correo electrónico. Responderemos su solicitud en un plazo de 15 días hábiles.",

  s7t: "7. Retención de Datos",
  s7p1: "Mantenemos sus datos personales durante el tiempo necesario para cumplir con las finalidades para las que fueron recopilados, incluidas las obligaciones legales y fiscales.",
  s7p2: "Los datos de reservas se mantienen durante 5 años después de la fecha de viaje, conforme a las exigencias legales del sector de aviación.",
  s7p3: "Después de solicitar la eliminación de su cuenta, sus datos personales serán eliminados en un plazo de 30 días, excepto cuando la retención sea exigida por ley.",

  s8t: "8. Menores de Edad",
  s8p1: "Nuestros servicios no están dirigidos a menores de 18 años. No recopilamos intencionalmente datos personales de menores no acompañados.",
  s8p2: "Las reservas para pasajeros menores de 18 años deben ser realizadas por un responsable legal, quien será el titular de la cuenta y responsable de la información proporcionada.",

  s9t: "9. Cambios en esta Política",
  s9p1: "Podemos actualizar esta política periódicamente para reflejar cambios en nuestras prácticas o exigencias legales. La fecha de actualización siempre se indicará en la parte superior de esta página.",
  s9p2: "Recomendamos que revise esta política regularmente. El uso continuado de nuestros servicios después de los cambios constituye la aceptación de la política actualizada.",

  s10t: "10. Contacto",
  s10p1: "Si tiene preguntas, preocupaciones o solicitudes relacionadas con la privacidad de sus datos, contáctenos:",
};
