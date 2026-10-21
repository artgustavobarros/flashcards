import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { getHealth } from "~/lib/api";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const health = useQuery({ queryKey: ["health"], queryFn: getHealth });

  return (
    <main className="mx-auto max-w-md p-8 font-sans">
      <h1 className="font-semibold text-2xl">Daruma</h1>
      <p className="mt-4 text-sm" data-testid="health">
        {health.isPending && "Checando a API…"}
        {health.isError && `API fora do ar: ${health.error.message}`}
        {health.isSuccess && `API ok · banco ${health.data.db === "up" ? "conectado" : "fora do ar"}`}
      </p>
    </main>
  );
}
