import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { type ReactNode, useCallback } from "react";
import { DarumaLogo } from "~/components/daruma-mark";

// Public, signed in or not. Also the privacy policy URL on Google's consent screen.
export const Route = createFileRoute("/privacidade")({
  component: Privacy,
  head: () => ({ meta: [{ title: "Termos e privacidade · Daruma" }] }),
});

const CONTACT = "contato@artbarros.tech";

const TERMS: [string, ReactNode][] = [
  [
    "O que é o Daruma",
    "Um app gratuito para estudar com Cards e repetição espaçada. É um projeto pessoal, mantido por uma pessoa.",
  ],
  [
    "Sua conta",
    "Você entra com sua conta Google. Na primeira vez, sua conta no Daruma é criada. Para entrar, você precisa ter acesso a essa conta Google.",
  ],
  [
    "Seu conteúdo",
    "O que você escreve nos Cards é seu. Não guarde aqui conteúdo ilegal ou de outras pessoas sem permissão.",
  ],
  [
    "Sem garantia",
    "O app é oferecido como está. Ele pode mudar, ficar fora do ar ou ser encerrado.",
  ],
  [
    "Sair quando quiser",
    "Em Configurações → Conta → Apagar conta, você apaga a conta e tudo o que ela guarda.",
  ],
];

const PRIVACY: [string, ReactNode][] = [
  [
    "O que guardamos",
    "Do Google: seu nome, seu e-mail e sua foto. Do que você cria: Decks, Cards, Labels, Comments, imagens e o histórico de Ratings. Das Configurações: horário da revisão, fuso, novos por dia e tema.",
  ],
  [
    "Para quê",
    "Só para o app funcionar: montar a revisão de cada dia, mostrar seu Progresso e enviar o aviso da revisão.",
  ],
  [
    "E-mails",
    "O único e-mail que o Daruma envia é o aviso da revisão de hoje. Você o desliga em Configurações → Notificações.",
  ],
  [
    "Com quem",
    "Não vendemos nem compartilhamos seus dados. Usamos três serviços para o app funcionar: o Google, para o login; o Resend, para enviar o aviso; e a Hostinger, onde ficam o servidor e o banco de dados.",
  ],
  [
    "Cookies",
    "Só um cookie de sessão, para manter você conectado. Com cada sessão guardamos o IP e o navegador de onde você entrou, por segurança. Não há anúncios nem rastreamento.",
  ],
  [
    "Apagar seus dados",
    "Apagar a conta remove tudo na hora. As cópias de segurança do servidor somem em até 3 semanas.",
  ],
  [
    "Seus direitos",
    <>
      Pela LGPD, você pode pedir acesso, correção ou exclusão dos seus dados.
      Escreva para{" "}
      <a
        className="font-medium text-primary hover:underline"
        href={`mailto:${CONTACT}`}
      >
        {CONTACT}
      </a>
      .
    </>,
  ],
];

function Section({
  id,
  items,
  title,
}: {
  id: string;
  items: [string, ReactNode][];
  title: string;
}) {
  return (
    <section className="scroll-mt-6 space-y-4" id={id}>
      <h2 className="font-heading font-semibold text-2xl tracking-tight">
        {title}
      </h2>
      {items.map(([heading, body]) => (
        <div className="space-y-1" key={heading}>
          <h3 className="font-medium">{heading}</h3>
          <p className="text-muted-foreground">{body}</p>
        </div>
      ))}
    </section>
  );
}

function Privacy() {
  const router = useRouter();
  const back = useCallback(() => {
    if (router.history.canGoBack()) {
      router.history.back();
    } else {
      router.navigate({ to: "/" });
    }
  }, [router]);

  return (
    <div className="min-h-dvh">
      <header className="px-5 py-5 md:px-10">
        <Link to="/">
          <DarumaLogo />
        </Link>
      </header>
      <main className="mx-auto max-w-2xl space-y-10 px-5 pt-4 pb-24 leading-relaxed">
        <div className="space-y-2">
          <button
            className="inline-flex items-center gap-1.5 font-medium text-primary text-sm underline-offset-4 hover:underline"
            onClick={back}
            type="button"
          >
            <ArrowLeft className="size-4" />
            Voltar
          </button>
          <h1 className="font-heading font-semibold text-3xl tracking-tight">
            Termos e privacidade
          </h1>
          <p className="text-muted-foreground text-sm">
            Atualizado em 21 de outubro de 2026.
          </p>
          <nav className="flex gap-4 pt-1 text-sm">
            <a
              className="font-medium text-primary hover:underline"
              href="#termos"
            >
              Termos de uso
            </a>
            <a
              className="font-medium text-primary hover:underline"
              href="#privacidade"
            >
              Privacidade
            </a>
          </nav>
        </div>
        <Section id="termos" items={TERMS} title="Termos de uso" />
        <Section id="privacidade" items={PRIVACY} title="Privacidade" />
      </main>
    </div>
  );
}
