import { RadarDePodioClient } from "./radar-de-podio-client";

export const metadata = {
  title: "Radar de Pódio",
  description:
    "Receba uma seleção personalizada de corridas compatíveis com seu perfil. Curadoria feita por especialistas.",
};

export default function RadarDePodioPage() {
  return <RadarDePodioClient />;
}
