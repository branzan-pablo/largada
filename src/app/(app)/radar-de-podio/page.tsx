import { RadarDePodioClient } from "./radar-de-podio-client";

export const metadata = {
  title: "Radar de Pódio",
  description:
    "Descubra suas chances de pódio nas corridas da região. Analisamos seu pace, distância e categoria.",
};

export default function RadarDePodioPage() {
  return <RadarDePodioClient />;
}
