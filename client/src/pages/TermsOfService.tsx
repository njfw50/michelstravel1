import { useI18n } from "@/lib/i18n";
import { SEO } from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import {
  Shield,
  FileText,
  CreditCard,
  Plane,
  AlertTriangle,
  Scale,
  Lock,
  Users,
  Ban,
  RefreshCw,
  Globe,
  ArrowLeft,
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
        <h2 className="text-lg font-bold text-gray-900" data-testid={`text-section-${title.toLowerCase().replace(/\s/g, "-")}`}>
          {title}
        </h2>
      </div>
      <div className="text-sm text-gray-600 leading-relaxed space-y-3 ml-0 md:ml-12">
        {children}
      </div>
    </Card>
  );
}

export default function TermsOfService() {
  const { t, language } = useI18n();

  const content = getContent(language);

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title={content.pageTitle}
        description={content.pageDescription}
      />

      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4 -ml-2" data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4 mr-1" />
              {content.backHome}
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-blue-600 rounded-lg text-white">
              <FileText className="w-6 h-6" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900" data-testid="text-terms-title">
              {content.title}
            </h1>
          </div>
          <p className="text-gray-500 text-sm" data-testid="text-terms-updated">
            {content.lastUpdated}
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-8 space-y-5">

        <Card className="p-6 md:p-8 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-sm text-blue-800 leading-relaxed" data-testid="text-terms-intro">
              {content.intro}
            </p>
          </div>
        </Card>

        <Section icon={<Users className="w-5 h-5" />} title={content.s1Title}>
          <p>{content.s1p1}</p>
          <p>{content.s1p2}</p>
          <p>{content.s1p3}</p>
        </Section>

        <Section icon={<Plane className="w-5 h-5" />} title={content.s2Title}>
          <p>{content.s2p1}</p>
          <p>{content.s2p2}</p>
          <p>{content.s2p3}</p>
          <p>{content.s2p4}</p>
        </Section>

        <Section icon={<CreditCard className="w-5 h-5" />} title={content.s3Title}>
          <p>{content.s3p1}</p>
          <p>{content.s3p2}</p>
          <p>{content.s3p3}</p>
          <p>{content.s3p4}</p>
        </Section>

        <Section icon={<RefreshCw className="w-5 h-5" />} title={content.s4Title}>
          <p>{content.s4p1}</p>
          <p>{content.s4p2}</p>
          <p>{content.s4p3}</p>
          <p>{content.s4p4}</p>
        </Section>

        <Section icon={<AlertTriangle className="w-5 h-5" />} title={content.s5Title}>
          <p>{content.s5p1}</p>
          <p>{content.s5p2}</p>
          <p>{content.s5p3}</p>
          <p>{content.s5p4}</p>
        </Section>

        <Section icon={<Lock className="w-5 h-5" />} title={content.s6Title}>
          <p>{content.s6p1}</p>
          <p>{content.s6p2}</p>
          <p>{content.s6p3}</p>
          <p>{content.s6p4}</p>
        </Section>

        <Section icon={<Ban className="w-5 h-5" />} title={content.s7Title}>
          <p>{content.s7p1}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{content.s7l1}</li>
            <li>{content.s7l2}</li>
            <li>{content.s7l3}</li>
            <li>{content.s7l4}</li>
            <li>{content.s7l5}</li>
          </ul>
        </Section>

        <Section icon={<Scale className="w-5 h-5" />} title={content.s8Title}>
          <p>{content.s8p1}</p>
          <p>{content.s8p2}</p>
          <p>{content.s8p3}</p>
        </Section>

        <Section icon={<Globe className="w-5 h-5" />} title={content.s9Title}>
          <p>{content.s9p1}</p>
          <p>{content.s9p2}</p>
          <p>{content.s9p3}</p>
        </Section>

        <Card className="p-6 md:p-8 bg-gray-50 border-gray-200">
          <p className="text-sm text-gray-600 leading-relaxed" data-testid="text-terms-contact">
            {content.contactIntro}
          </p>
          <div className="mt-3 text-sm text-gray-700 font-medium space-y-1">
            <p>Michels Travel</p>
            <p>contact@michelstravel.agency</p>
            <p>+1 (862) 350-1161</p>
            <p>New Jersey, USA</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function getContent(lang: string) {
  if (lang === "es") return esContent;
  if (lang === "en") return enContent;
  return ptContent;
}

const ptContent = {
  pageTitle: "Termos de Uso - Michels Travel",
  pageDescription: "Termos de uso e condições do serviço Michels Travel.",
  backHome: "Voltar",
  title: "Termos de Uso",
  lastUpdated: "Atualizado em fevereiro de 2026",
  intro: "Ao utilizar os serviços da Michels Travel (\"Opção Eficiente\"), você concorda com os termos abaixo. Estes termos foram elaborados para proteger tanto a agência quanto nossos clientes, garantindo transparência e segurança em todas as transações.",

  s1Title: "1. Sobre a Michels Travel",
  s1p1: "A Michels Travel (\"Opção Eficiente\") é uma agência de viagens digital registrada em New Jersey, EUA, que atua como intermediária na comercialização de passagens aéreas. Não somos uma companhia aérea e não operamos voos.",
  s1p2: "Nosso papel é buscar as melhores opções de voos disponíveis no mercado, facilitar a reserva e o pagamento, e oferecer suporte ao cliente durante todo o processo.",
  s1p3: "Ao criar uma conta ou efetuar uma compra em nosso site, você declara ter pelo menos 18 anos de idade e capacidade legal para celebrar contratos.",

  s2Title: "2. Reservas e Passagens Aéreas",
  s2p1: "As passagens aéreas comercializadas em nossa plataforma são emitidas diretamente pelas companhias aéreas parceiras. Preços, horários, rotas e disponibilidade estão sujeitos a alterações sem aviso prévio por parte das companhias aéreas.",
  s2p2: "A Michels Travel aplica uma taxa de serviço sobre o valor base da passagem. Esta taxa cobre os custos de intermediação, atendimento ao cliente e suporte durante a viagem.",
  s2p3: "As informações fornecidas no momento da reserva (nome, data de nascimento, documento) devem ser exatas e corresponder aos documentos de viagem do passageiro. Erros de digitação podem resultar em impossibilidade de embarque, sem direito a reembolso.",
  s2p4: "O passageiro é responsável por verificar a necessidade de vistos, vacinas e demais requisitos de entrada no país de destino antes da compra da passagem.",

  s3Title: "3. Pagamentos e Preços",
  s3p1: "Todos os pagamentos são processados de forma segura através do Stripe, uma das maiores plataformas de pagamento do mundo. A Michels Travel não armazena dados de cartão de crédito em seus servidores.",
  s3p2: "O preço final exibido na tela de pagamento é o valor total a ser cobrado, incluindo a taxa de serviço da agência. Não há taxas ocultas ou cobranças adicionais após a confirmação.",
  s3p3: "Em caso de falha no processamento do pagamento, nenhuma cobrança será efetuada no cartão do cliente. O cliente poderá tentar novamente ou escolher outro método de pagamento.",
  s3p4: "Pagamentos são realizados exclusivamente em dólar americano (USD). Conversões cambiais são de responsabilidade do banco emissor do cartão do cliente.",

  s4Title: "4. Cancelamentos e Reembolsos",
  s4p1: "Solicitações de cancelamento devem ser feitas através da seção \"Minhas Viagens\" em nosso site ou entrando em contato com nosso atendimento ao cliente.",
  s4p2: "As políticas de cancelamento e reembolso variam conforme a tarifa adquirida e as regras da companhia aérea. Tarifas promocionais podem ser não reembolsáveis.",
  s4p3: "Quando aplicável, o valor do reembolso será processado no mesmo método de pagamento utilizado na compra, em até 10 dias úteis após a aprovação pela companhia aérea.",
  s4p4: "A taxa de serviço da Michels Travel não é reembolsável em caso de cancelamento voluntário por parte do cliente, exceto quando a agência não conseguir completar a reserva.",

  s5Title: "5. Responsabilidades e Limitações",
  s5p1: "A Michels Travel atua exclusivamente como intermediária e não se responsabiliza por atrasos, cancelamentos, alterações de voos, overbooking ou qualquer ação das companhias aéreas.",
  s5p2: "Em caso de alterações ou cancelamentos feitos pela companhia aérea, faremos o possível para notificar o cliente e auxiliar na remarcação ou reembolso, conforme as políticas da companhia.",
  s5p3: "Não nos responsabilizamos por bagagens perdidas, danificadas ou extraviadas, sendo estas de responsabilidade exclusiva da companhia aérea operadora do voo.",
  s5p4: "O valor máximo de responsabilidade da Michels Travel em qualquer situação está limitado ao valor da taxa de serviço cobrada na transação em questão.",

  s6Title: "6. Privacidade e Proteção de Dados",
  s6p1: "Levamos a segurança dos seus dados muito a sério. Todas as comunicações são criptografadas e utilizamos as melhores práticas de segurança da informação.",
  s6p2: "Coletamos apenas os dados necessários para processar suas reservas: nome, e-mail, telefone e informações de passageiro. Não compartilhamos seus dados com terceiros para fins de marketing.",
  s6p3: "Os dados de pagamento são processados diretamente pelo Stripe e nunca passam por nossos servidores. Estamos em conformidade com os padrões PCI DSS de segurança de cartões.",
  s6p4: "Você pode solicitar a exclusão dos seus dados pessoais a qualquer momento entrando em contato conosco por e-mail.",

  s7Title: "7. Uso Proibido",
  s7p1: "É expressamente proibido utilizar nosso site para:",
  s7l1: "Realizar reservas com informações falsas ou fraudulentas",
  s7l2: "Utilizar cartões de crédito ou métodos de pagamento de terceiros sem autorização",
  s7l3: "Realizar buscas automatizadas (scraping) ou utilizar bots em nossa plataforma",
  s7l4: "Tentar acessar áreas restritas do sistema ou comprometer a segurança da plataforma",
  s7l5: "Revender passagens adquiridas através de nosso site sem autorização prévia",

  s8Title: "8. Resolução de Disputas",
  s8p1: "Em caso de problemas com sua reserva, nosso atendimento ao cliente está disponível para ajudá-lo a resolver qualquer questão de forma amigável e eficiente.",
  s8p2: "Caso não seja possível resolver o problema diretamente, as partes concordam em buscar mediação antes de recorrer a vias judiciais.",
  s8p3: "Estes termos são regidos pelas leis do Estado de New Jersey, EUA. Qualquer litígio será submetido à jurisdição dos tribunais competentes do Estado de New Jersey.",

  s9Title: "9. Alterações nos Termos",
  s9p1: "A Michels Travel se reserva o direito de alterar estes termos a qualquer momento, sem aviso prévio. As alterações entram em vigor na data de publicação no site.",
  s9p2: "Recomendamos que você revise estes termos periodicamente. O uso continuado dos nossos serviços após alterações constitui aceitação dos novos termos.",
  s9p3: "Em caso de dúvidas sobre estes termos, entre em contato conosco:",

  contactIntro: "Se tiver dúvidas sobre estes termos ou precisar de ajuda, entre em contato:",
};

const enContent = {
  pageTitle: "Terms of Service - Michels Travel",
  pageDescription: "Terms of service and conditions for Michels Travel.",
  backHome: "Back",
  title: "Terms of Service",
  lastUpdated: "Updated February 2026",
  intro: "By using Michels Travel services, you agree to the terms below. These terms are designed to protect both the agency and our customers, ensuring transparency and security in all transactions.",

  s1Title: "1. About Michels Travel",
  s1p1: "Michels Travel is a digital travel agency registered in New Jersey, USA, acting as an intermediary in the sale of airline tickets. We are not an airline and do not operate flights.",
  s1p2: "Our role is to find the best flight options available on the market, facilitate booking and payment, and provide customer support throughout the process.",
  s1p3: "By creating an account or making a purchase on our site, you represent that you are at least 18 years of age and legally capable of entering into contracts.",

  s2Title: "2. Bookings and Airline Tickets",
  s2p1: "Airline tickets sold on our platform are issued directly by partner airlines. Prices, schedules, routes, and availability are subject to change without notice by the airlines.",
  s2p2: "Michels Travel applies a service fee on top of the base ticket price. This fee covers intermediation costs, customer service, and travel support.",
  s2p3: "Information provided at the time of booking (name, date of birth, ID/passport) must be accurate and match the passenger's travel documents. Typographical errors may result in the inability to board, without the right to a refund.",
  s2p4: "The passenger is responsible for verifying visa requirements, vaccinations, and other entry requirements for the destination country before purchasing the ticket.",

  s3Title: "3. Payments and Pricing",
  s3p1: "All payments are processed securely through Stripe, one of the world's largest payment platforms. Michels Travel does not store credit card data on its servers.",
  s3p2: "The final price displayed on the payment screen is the total amount to be charged, including the agency's service fee. There are no hidden fees or additional charges after confirmation.",
  s3p3: "In case of a payment processing failure, no charges will be made to the customer's card. The customer may try again or choose another payment method.",
  s3p4: "Payments are made exclusively in US Dollars (USD). Currency conversions are the responsibility of the customer's card-issuing bank.",

  s4Title: "4. Cancellations and Refunds",
  s4p1: "Cancellation requests must be made through the \"My Trips\" section on our website or by contacting our customer service.",
  s4p2: "Cancellation and refund policies vary according to the fare purchased and the airline's rules. Promotional fares may be non-refundable.",
  s4p3: "When applicable, the refund amount will be processed using the same payment method used for the purchase, within 10 business days after approval by the airline.",
  s4p4: "Michels Travel's service fee is non-refundable in case of voluntary cancellation by the customer, except when the agency is unable to complete the booking.",

  s5Title: "5. Responsibilities and Limitations",
  s5p1: "Michels Travel acts exclusively as an intermediary and is not responsible for delays, cancellations, flight changes, overbooking, or any actions by the airlines.",
  s5p2: "In case of changes or cancellations made by the airline, we will do our best to notify the customer and assist with rebooking or refunds, according to the airline's policies.",
  s5p3: "We are not responsible for lost, damaged, or mishandled baggage, which is the sole responsibility of the airline operating the flight.",
  s5p4: "Michels Travel's maximum liability in any situation is limited to the service fee charged in the transaction in question.",

  s6Title: "6. Privacy and Data Protection",
  s6p1: "We take the security of your data very seriously. All communications are encrypted, and we use best practices in information security.",
  s6p2: "We only collect the data necessary to process your bookings: name, email, phone, and passenger information. We do not share your data with third parties for marketing purposes.",
  s6p3: "Payment data is processed directly by Stripe and never passes through our servers. We are compliant with PCI DSS card security standards.",
  s6p4: "You can request the deletion of your personal data at any time by contacting us via email.",

  s7Title: "7. Prohibited Use",
  s7p1: "It is expressly prohibited to use our site to:",
  s7l1: "Make bookings with false or fraudulent information",
  s7l2: "Use credit cards or payment methods belonging to third parties without authorization",
  s7l3: "Perform automated searches (scraping) or use bots on our platform",
  s7l4: "Attempt to access restricted areas of the system or compromise platform security",
  s7l5: "Resell tickets purchased through our site without prior authorization",

  s8Title: "8. Dispute Resolution",
  s8p1: "In case of issues with your booking, our customer service team is available to help you resolve any matter in a friendly and efficient manner.",
  s8p2: "If the issue cannot be resolved directly, the parties agree to seek mediation before resorting to legal proceedings.",
  s8p3: "These terms are governed by the laws of the State of New Jersey, USA. Any litigation shall be submitted to the jurisdiction of the competent courts of the State of New Jersey.",

  s9Title: "9. Changes to Terms",
  s9p1: "Michels Travel reserves the right to modify these terms at any time, without prior notice. Changes take effect on the date of publication on the site.",
  s9p2: "We recommend that you review these terms periodically. Continued use of our services after changes constitutes acceptance of the new terms.",
  s9p3: "If you have questions about these terms, please contact us:",

  contactIntro: "If you have questions about these terms or need help, please contact us:",
};

const esContent = {
  pageTitle: "Términos de Servicio - Michels Travel",
  pageDescription: "Términos de servicio y condiciones de Michels Travel.",
  backHome: "Volver",
  title: "Términos de Servicio",
  lastUpdated: "Actualizado en febrero de 2026",
  intro: "Al utilizar los servicios de Michels Travel, usted acepta los términos a continuación. Estos términos fueron elaborados para proteger tanto a la agencia como a nuestros clientes, garantizando transparencia y seguridad en todas las transacciones.",

  s1Title: "1. Sobre Michels Travel",
  s1p1: "Michels Travel es una agencia de viajes digital registrada en New Jersey, EE.UU., que actúa como intermediaria en la comercialización de boletos aéreos. No somos una aerolínea y no operamos vuelos.",
  s1p2: "Nuestro papel es buscar las mejores opciones de vuelos disponibles en el mercado, facilitar la reserva y el pago, y ofrecer soporte al cliente durante todo el proceso.",
  s1p3: "Al crear una cuenta o realizar una compra en nuestro sitio, usted declara tener al menos 18 años de edad y capacidad legal para celebrar contratos.",

  s2Title: "2. Reservas y Boletos Aéreos",
  s2p1: "Los boletos aéreos comercializados en nuestra plataforma son emitidos directamente por las aerolíneas asociadas. Precios, horarios, rutas y disponibilidad están sujetos a cambios sin previo aviso por parte de las aerolíneas.",
  s2p2: "Michels Travel aplica una tarifa de servicio sobre el valor base del boleto. Esta tarifa cubre los costos de intermediación, atención al cliente y soporte durante el viaje.",
  s2p3: "La información proporcionada al momento de la reserva (nombre, fecha de nacimiento, documento) debe ser exacta y corresponder a los documentos de viaje del pasajero. Errores de escritura pueden resultar en imposibilidad de embarque, sin derecho a reembolso.",
  s2p4: "El pasajero es responsable de verificar la necesidad de visas, vacunas y demás requisitos de entrada en el país de destino antes de la compra del boleto.",

  s3Title: "3. Pagos y Precios",
  s3p1: "Todos los pagos son procesados de forma segura a través de Stripe, una de las mayores plataformas de pago del mundo. Michels Travel no almacena datos de tarjeta de crédito en sus servidores.",
  s3p2: "El precio final mostrado en la pantalla de pago es el monto total a cobrar, incluyendo la tarifa de servicio de la agencia. No hay tarifas ocultas ni cargos adicionales después de la confirmación.",
  s3p3: "En caso de falla en el procesamiento del pago, no se realizará ningún cargo en la tarjeta del cliente. El cliente podrá intentar nuevamente o elegir otro método de pago.",
  s3p4: "Los pagos se realizan exclusivamente en dólares estadounidenses (USD). Las conversiones de moneda son responsabilidad del banco emisor de la tarjeta del cliente.",

  s4Title: "4. Cancelaciones y Reembolsos",
  s4p1: "Las solicitudes de cancelación deben realizarse a través de la sección \"Mis Viajes\" en nuestro sitio web o contactando a nuestro servicio al cliente.",
  s4p2: "Las políticas de cancelación y reembolso varían según la tarifa adquirida y las reglas de la aerolínea. Las tarifas promocionales pueden no ser reembolsables.",
  s4p3: "Cuando sea aplicable, el monto del reembolso será procesado con el mismo método de pago utilizado en la compra, dentro de los 10 días hábiles posteriores a la aprobación por parte de la aerolínea.",
  s4p4: "La tarifa de servicio de Michels Travel no es reembolsable en caso de cancelación voluntaria por parte del cliente, excepto cuando la agencia no pueda completar la reserva.",

  s5Title: "5. Responsabilidades y Limitaciones",
  s5p1: "Michels Travel actúa exclusivamente como intermediaria y no se responsabiliza por retrasos, cancelaciones, cambios de vuelos, sobreventa o cualquier acción de las aerolíneas.",
  s5p2: "En caso de cambios o cancelaciones realizados por la aerolínea, haremos lo posible para notificar al cliente y asistir en la reprogramación o reembolso, conforme las políticas de la aerolínea.",
  s5p3: "No nos responsabilizamos por equipaje perdido, dañado o extraviado, siendo esto responsabilidad exclusiva de la aerolínea operadora del vuelo.",
  s5p4: "La responsabilidad máxima de Michels Travel en cualquier situación está limitada al valor de la tarifa de servicio cobrada en la transacción en cuestión.",

  s6Title: "6. Privacidad y Protección de Datos",
  s6p1: "Nos tomamos muy en serio la seguridad de sus datos. Todas las comunicaciones están cifradas y utilizamos las mejores prácticas de seguridad de la información.",
  s6p2: "Solo recopilamos los datos necesarios para procesar sus reservas: nombre, correo electrónico, teléfono e información del pasajero. No compartimos sus datos con terceros con fines de marketing.",
  s6p3: "Los datos de pago son procesados directamente por Stripe y nunca pasan por nuestros servidores. Cumplimos con los estándares de seguridad de tarjetas PCI DSS.",
  s6p4: "Puede solicitar la eliminación de sus datos personales en cualquier momento contactándonos por correo electrónico.",

  s7Title: "7. Uso Prohibido",
  s7p1: "Está expresamente prohibido utilizar nuestro sitio para:",
  s7l1: "Realizar reservas con información falsa o fraudulenta",
  s7l2: "Utilizar tarjetas de crédito o métodos de pago de terceros sin autorización",
  s7l3: "Realizar búsquedas automatizadas (scraping) o utilizar bots en nuestra plataforma",
  s7l4: "Intentar acceder a áreas restringidas del sistema o comprometer la seguridad de la plataforma",
  s7l5: "Revender boletos adquiridos a través de nuestro sitio sin autorización previa",

  s8Title: "8. Resolución de Disputas",
  s8p1: "En caso de problemas con su reserva, nuestro servicio al cliente está disponible para ayudarlo a resolver cualquier cuestión de manera amigable y eficiente.",
  s8p2: "Si no es posible resolver el problema directamente, las partes acuerdan buscar mediación antes de recurrir a vías judiciales.",
  s8p3: "Estos términos se rigen por las leyes del Estado de New Jersey, EE.UU. Cualquier litigio será sometido a la jurisdicción de los tribunales competentes del Estado de New Jersey.",

  s9Title: "9. Cambios en los Términos",
  s9p1: "Michels Travel se reserva el derecho de modificar estos términos en cualquier momento, sin previo aviso. Los cambios entran en vigor en la fecha de publicación en el sitio.",
  s9p2: "Recomendamos que revise estos términos periódicamente. El uso continuado de nuestros servicios después de los cambios constituye la aceptación de los nuevos términos.",
  s9p3: "Si tiene preguntas sobre estos términos, contáctenos:",

  contactIntro: "Si tiene preguntas sobre estos términos o necesita ayuda, contáctenos:",
};
