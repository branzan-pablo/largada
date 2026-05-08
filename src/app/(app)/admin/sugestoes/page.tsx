import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateShort, formatDateTime } from "@/lib/date";
import { SuggestionActions } from "./suggestion-actions";

export const metadata = {
  title: "Sugestões | Admin",
};

export default async function AdminSuggestionsPage() {
  const supabase = await createClient();

  const { data: suggestions } = await supabase
    .from("race_suggestions")
    .select("*, profiles!race_suggestions_user_id_fkey(full_name)")
    .order("created_at", { ascending: false });

  const pending = suggestions?.filter((s) => s.status === "pending") ?? [];
  const reviewed = suggestions?.filter((s) => s.status !== "pending") ?? [];

  return (
    <>
      {pending.length > 0 && (
        <section className="mb-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pending.map((suggestion) => (
              <Card key={suggestion.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{suggestion.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Cidade: {`${suggestion.city} - ${suggestion.state}`}
                  </p>
                  {suggestion.date && (
                    <p className="text-sm text-muted-foreground">
                      Data: {formatDateShort(suggestion.date)}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="space-y-3">
                  {suggestion.link && (
                    <a
                      href={suggestion.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Ver link
                    </a>
                  )}
                  {suggestion.notes && (
                    <p className="text-sm text-muted-foreground">
                      {suggestion.notes}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Por:{" "}
                    {suggestion.profiles?.full_name ?? "Anônimo"}{" "}
                    · {formatDateTime(suggestion.created_at)}
                  </p>
                  <SuggestionActions suggestion={suggestion} />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {pending.length === 0 && (
        <p className="mb-8 text-muted-foreground">
          Nenhuma sugestão pendente.
        </p>
      )}

      {reviewed.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Já Revisadas</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reviewed.map((suggestion) => (
              <Card key={suggestion.id} className="opacity-70">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {suggestion.name}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className={
                        suggestion.status === "approved"
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }
                    >
                      {suggestion.status === "approved"
                        ? "Aprovada"
                        : "Rejeitada"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {suggestion.city}
                  </p>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
