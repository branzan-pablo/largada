import { LandingHeader } from "@/components/landing/landing-header";
import { Footer } from "@/components/footer/footer";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade",
};

export default function PoliticaDePrivacidadePage() {
  return (
    <main className="text-[#6B7280] antialiased overflow-x-hidden min-h-screen bg-white pt-16">
      <LandingHeader />

      <article className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#0D1B2A] tracking-tight mb-2">
          Política de Privacidade
        </h1>
        <p className="text-sm text-gray-400 mb-12">
          Última atualização: 24 de fevereiro de 2026
        </p>

        <div className="space-y-10 text-[#6B7280] leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-[#0D1B2A] mb-4">
              1. Introdução
            </h2>
            <p>
              A Largada respeita a privacidade dos seus usuários. Esta Política
              de Privacidade descreve quais dados pessoais coletamos, por que os
              coletamos, como os utilizamos e quais são os seus direitos,
              conforme a Lei Geral de Proteção de Dados (LGPD — Lei nº
              13.709/2018).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0D1B2A] mb-4">
              2. Dados que Coletamos
            </h2>

            <h3 className="text-base font-semibold text-[#0D1B2A] mt-6 mb-2">
              2.1 Dados de cadastro
            </h3>
            <p>
              Nome completo, endereço de e-mail e foto de perfil (quando
              fornecida via login com Google ou Strava).
            </p>

            <h3 className="text-base font-semibold text-[#0D1B2A] mt-6 mb-2">
              2.2 Dados de localização
            </h3>
            <p>
              Cidade, estado e coordenadas geográficas (latitude e longitude)
              da cidade selecionada. Esses dados são usados para exibir
              corridas próximas a você e para o raio de notificações.
            </p>

            <h3 className="text-base font-semibold text-[#0D1B2A] mt-6 mb-2">
              2.3 Preferências
            </h3>
            <p>
              Raio de notificação (em km) e preferência de ativação/desativação
              de notificações push.
            </p>

            <h3 className="text-base font-semibold text-[#0D1B2A] mt-6 mb-2">
              2.4 Dados de pagamento
            </h3>
            <p>
              Ao contratar o serviço de Corrida em Destaque, coletamos nome,
              e-mail, telefone e CPF/CNPJ. Esses dados são enviados diretamente
              ao nosso processador de pagamento (AbacatePay) para criação da
              cobrança. A Largada não armazena dados de cartão de crédito.
            </p>

            <h3 className="text-base font-semibold text-[#0D1B2A] mt-6 mb-2">
              2.5 Dados de navegação
            </h3>
            <p>
              Endpoints de notificações push (para envio de alertas),
              registros de cliques em links de corridas (para análise de uso)
              e métricas de desempenho coletadas pelo Vercel Speed Insights
              (dados anonimizados).
            </p>

            <h3 className="text-base font-semibold text-[#0D1B2A] mt-6 mb-2">
              2.6 Dados de terceiros
            </h3>
            <p>
              Quando você faz login via Google ou Strava, recebemos nome,
              e-mail e foto de perfil conforme autorizado por você no momento
              da autenticação. Não acessamos outros dados dessas contas.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0D1B2A] mb-4">
              3. Base Legal para o Tratamento
            </h2>
            <p>
              Conforme o Art. 7 da LGPD, tratamos seus dados com as seguintes
              bases legais:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-1">
              <li>
                <strong className="text-[#0D1B2A]">Consentimento:</strong>{" "}
                notificações push e compartilhamento de localização
              </li>
              <li>
                <strong className="text-[#0D1B2A]">Execução de contrato:</strong>{" "}
                criação de conta, processamento de pagamentos
              </li>
              <li>
                <strong className="text-[#0D1B2A]">Interesse legítimo:</strong>{" "}
                analytics, melhoria da plataforma e prevenção de fraudes
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0D1B2A] mb-4">
              4. Compartilhamento de Dados
            </h2>
            <p>
              Seus dados podem ser compartilhados com os seguintes
              prestadores de serviço, exclusivamente para operação da
              plataforma:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>
                <strong className="text-[#0D1B2A]">AbacatePay</strong> —
                processamento de pagamentos (nome, e-mail, telefone, CPF/CNPJ)
              </li>
              <li>
                <strong className="text-[#0D1B2A]">Supabase</strong> —
                infraestrutura e armazenamento de dados
              </li>
              <li>
                <strong className="text-[#0D1B2A]">Vercel</strong> —
                hospedagem da plataforma e métricas de desempenho
              </li>
              <li>
                <strong className="text-[#0D1B2A]">Google / Strava</strong> —
                autenticação OAuth (somente durante o login)
              </li>
            </ul>
            <p className="mt-3">
              A Largada{" "}
              <strong className="text-[#0D1B2A]">
                não vende dados pessoais
              </strong>{" "}
              a terceiros.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0D1B2A] mb-4">
              5. Armazenamento e Segurança
            </h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Dados armazenados em banco de dados PostgreSQL (Supabase) com
                Row-Level Security (RLS) ativo
              </li>
              <li>
                Senhas gerenciadas pelo Supabase Auth com hash bcrypt
              </li>
              <li>
                Toda comunicação ocorre via HTTPS
              </li>
              <li>
                Acesso administrativo restrito e autenticado
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0D1B2A] mb-4">
              6. Seus Direitos (LGPD Art. 18)
            </h2>
            <p>
              Como titular dos dados, você tem direito a:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-1">
              <li>
                <strong className="text-[#0D1B2A]">Acesso</strong> — saber
                quais dados pessoais temos sobre você
              </li>
              <li>
                <strong className="text-[#0D1B2A]">Correção</strong> —
                solicitar a atualização de dados incompletos ou incorretos
              </li>
              <li>
                <strong className="text-[#0D1B2A]">Exclusão</strong> —
                solicitar a remoção dos seus dados pessoais
              </li>
              <li>
                <strong className="text-[#0D1B2A]">Revogação de consentimento</strong> —
                desativar notificações e revogar permissões a qualquer momento
              </li>
              <li>
                <strong className="text-[#0D1B2A]">Portabilidade</strong> —
                solicitar seus dados em formato estruturado
              </li>
            </ul>
            <p className="mt-3">
              Para exercer qualquer desses direitos, entre em contato pela nossa{" "}
              <Link
                href="/contato"
                className="text-[#FF4D00] hover:underline"
              >
                página de contato
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0D1B2A] mb-4">
              7. Cookies e Tecnologias Semelhantes
            </h2>
            <p>A Largada utiliza apenas cookies essenciais:</p>
            <ul className="list-disc pl-6 mt-3 space-y-1">
              <li>
                <strong className="text-[#0D1B2A]">Cookies de sessão</strong> —
                gerenciados pelo Supabase Auth para manter sua autenticação
              </li>
              <li>
                <strong className="text-[#0D1B2A]">Cookie de estado OAuth</strong> —
                proteção CSRF temporária durante login com Strava
              </li>
            </ul>
            <p className="mt-3">
              Não utilizamos cookies de publicidade ou rastreamento de
              terceiros. O Vercel Speed Insights coleta métricas de
              desempenho de forma anonimizada, sem identificar usuários
              individualmente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0D1B2A] mb-4">
              8. Retenção de Dados
            </h2>
            <p>
              Seus dados pessoais são mantidos enquanto sua conta estiver
              ativa. Ao solicitar exclusão da conta, seus dados pessoais serão
              removidos em até 30 dias.
            </p>
            <p className="mt-3">
              Registros de pagamento podem ser retidos por prazo superior
              conforme exigido pela legislação fiscal brasileira.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0D1B2A] mb-4">
              9. Alterações nesta Política
            </h2>
            <p>
              Esta política pode ser atualizada periodicamente. Alterações
              significativas serão comunicadas através da plataforma. O uso
              continuado após alterações constitui aceitação da nova política.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0D1B2A] mb-4">
              10. Contato do Encarregado (DPO)
            </h2>
            <p>
              Para questões relacionadas à proteção de dados pessoais, entre
              em contato com nosso encarregado de dados:
            </p>
            <p className="mt-3">
              <strong className="text-[#0D1B2A]">E-mail:</strong>{" "}
              <a
                href="mailto:branzan.pablo@gmail.com"
                className="text-[#FF4D00] hover:underline"
              >
                branzan.pablo@gmail.com
              </a>
            </p>
            <p className="mt-1">
              Você também pode nos contatar pela{" "}
              <Link
                href="/contato"
                className="text-[#FF4D00] hover:underline"
              >
                página de contato
              </Link>
              .
            </p>
          </section>
        </div>
      </article>

      <Footer />
    </main>
  );
}
