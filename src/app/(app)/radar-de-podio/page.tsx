import { RadarDePodioClient } from "./radar-de-podio-client";

export const metadata = {
  title: "Radar de Pódio — Descubra onde você tem chances reais de pódio",
  description:
    "O Radar de Pódio cruza seu desempenho com o perfil de cada prova e mostra onde suas chances de pódio são maiores. Pare de adivinhar e comece a competir com estratégia.",
};

export default function RadarDePodioPage() {
  return <RadarDePodioClient />;
}
