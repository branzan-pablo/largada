import { LandingHeader } from "@/components/landing/landing-header";
import { Footer } from "@/components/footer/footer";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso",
};

export default function TermosDeUsoPage() {
  return (
    <main className="text-[#6B7280] antialiased overflow-x-hidden min-h-screen bg-white pt-16">
      <LandingHeader />

      <article className="max-w-7xl mx-auto px-6 py-16 md:py-12">
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#0D1B2A] tracking-tight mb-2">
          Termos de Uso
        </h1>
        <p className="text-sm text-gray-400 mb-12">
          Última atualização: 24 de fevereiro de 2026
        </p>

        <div className="space-y-10 text-[#6B7280] leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-[#0D1B2A] mb-4">
              1. Aceite dos Termos
            </h2>
            <p>
              Ao acessar ou utilizar a plataforma Largada, você concorda com
              estes Termos de Uso. Se você não concordar com qualquer parte
              destes termos, por favor, não utilize a plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0D1B2A] mb-4">
              2. Descrição do Serviço
            </h2>
            <p>
              A Largada é um calendário online de corridas de rua da região Noroeste Paulista. A
              plataforma agrega informações sobre eventos de corrida, permitindo
              que usuários descubram provas por localização, distância e data.
            </p>
            <p className="mt-3">
              A Largada{" "}
              <strong className="text-[#0D1B2A]">não organiza corridas</strong>{" "}
              e{" "}
              <strong className="text-[#0D1B2A]">não realiza inscrições</strong>{" "}
              em eventos. Os links para inscrição direcionam para sites externos
              de responsabilidade dos organizadores de cada evento.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0D1B2A] mb-4">
              3. Cadastro e Conta
            </h2>
            <p>
              Para utilizar os recursos da plataforma, é necessário criar uma
              conta informando nome, email e senha, ou autenticando-se via
              Google ou Strava. Você é responsável por:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-1">
              <li>Fornecer informações verdadeiras e atualizadas</li>
              <li>Manter a segurança das suas credenciais de acesso</li>
              <li>Todas as atividades realizadas na sua conta</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0D1B2A] mb-4">
              4. Uso Permitido
            </h2>
            <p>
              A plataforma é destinada ao uso pessoal e não comercial. Ao
              utilizar a Largada, você concorda em:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-1">
              <li>
                Não publicar informações falsas ou enganosas sobre corridas
              </li>
              <li>
                Não utilizar a plataforma para fins ilegais ou não autorizados
              </li>
              <li>
                Não tentar acessar áreas restritas ou interferir no
                funcionamento da plataforma
              </li>
              <li>
                Não copiar, reproduzir ou distribuir o conteúdo da plataforma
                sem autorização
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0D1B2A] mb-4">
              5. Corrida em Destaque
            </h2>
            <p>
              Organizadores de corridas podem contratar o serviço de destaque
              para suas corridas mediante pagamento único de R$&nbsp;149,00 por
              corrida. O pagamento é processado pela AbacatePay (PIX ou cartão
              de crédito).
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-1">
              <li>
                O destaque é ativado após confirmação do pagamento e permanece
                ativo até a data do evento
              </li>
              <li>Não há reembolso após a ativação do destaque</li>
              <li>
                A Largada reserva-se o direito de remover destaques de corridas
                que violem estes termos
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0D1B2A] mb-4">
              6. Propriedade Intelectual
            </h2>
            <p>
              Todo o conteúdo original da plataforma — incluindo marca, design,
              código e textos — é de propriedade da Largada e está protegido
              pelas leis de propriedade intelectual.
            </p>
            <p className="mt-3">
              Ao sugerir uma corrida ou enviar conteúdo para a plataforma, você
              concede à Largada uma licença não exclusiva, gratuita e por tempo
              indeterminado para exibir, distribuir e utilizar esse conteúdo na
              plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0D1B2A] mb-4">
              7. Limitação de Responsabilidade
            </h2>
            <p>A Largada não se responsabiliza por:</p>
            <ul className="list-disc pl-6 mt-3 space-y-1">
              <li>
                Informações incorretas, desatualizadas ou incompletas sobre
                corridas
              </li>
              <li>
                Cancelamentos, alterações de data ou problemas na organização
                dos eventos
              </li>
              <li>Problemas com inscrições realizadas em sites externos</li>
              <li>
                Conteúdo de sites de terceiros acessados através de links na
                plataforma
              </li>
            </ul>
            <p className="mt-3">
              Links exibidos na plataforma podem conter parâmetros de afiliados.
            </p>
            <p className="mt-3">
              Serviços de terceiros integrados à plataforma (incluindo Strava,
              Google e AbacatePay) são fornecidos{" "}
              <strong className="text-[#0D1B2A]">
                &quot;no estado em que se encontram&quot;
              </strong>
              , sem garantias de qualquer tipo, expressas ou implícitas,
              incluindo garantias de comercialização, adequação a um fim
              específico e não violação de direitos. A Largada não se
              responsabiliza por danos consequenciais, especiais, punitivos ou
              indiretos decorrentes do uso desses serviços de terceiros.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0D1B2A] mb-4">
              8. Modificações nos Termos
            </h2>
            <p>
              A Largada pode atualizar estes termos a qualquer momento. O uso
              continuado da plataforma após as alterações constitui aceitação
              dos novos termos. Alterações significativas serão comunicadas
              através da plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0D1B2A] mb-4">
              9. Legislação Aplicável
            </h2>
            <p>
              Estes termos são regidos pelas leis da República Federativa do
              Brasil. Qualquer disputa será resolvida no foro da comarca onde a
              empresa está registrada, no estado de São Paulo.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0D1B2A] mb-4">
              10. Contato
            </h2>
            <p>
              Em caso de dúvidas sobre estes termos, entre em contato conosco
              através da nossa{" "}
              <Link href="/contato" className="text-[#FF4D00] hover:underline">
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
