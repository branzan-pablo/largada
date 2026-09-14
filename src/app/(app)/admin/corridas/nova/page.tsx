import { RaceForm } from "@/components/admin/race-form";

export const metadata = { title: "Nova Corrida | Admin" };

export default function NewRacePage() {
  return <><h1 className="mb-6 text-2xl font-bold">Nova Corrida</h1><RaceForm /></>;
}
