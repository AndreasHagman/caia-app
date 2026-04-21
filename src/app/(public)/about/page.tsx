import { calculateAge, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const BIRTH_DATE = new Date("2025-03-16");

const traits = [
  { label: "Energy", value: "Very high" },
  { label: "Intelligence", value: "Extremely smart" },
  { label: "Affection", value: "Loves people" },
  { label: "Playfulness", value: "Always ready" },
];

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-2">About Caia</h1>
      <p className="text-muted-foreground mb-10">{calculateAge()}</p>

      <Card className="rounded-3xl shadow-sm mb-8 overflow-hidden">
        <div className="bg-sage-100 aspect-[4/3] flex items-center justify-center">
          <span className="text-sage-400 text-sm">Photo goes here</span>
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground block">Full name</span>
              <span className="font-medium">Caia</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Breed</span>
              <span className="font-medium">Nova Scotia Duck Tolling Retriever</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Born</span>
              <span className="font-medium">{formatDate(BIRTH_DATE)}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Age</span>
              <span className="font-medium">{calculateAge()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <h2 className="text-xl font-semibold mb-4">Personality</h2>
      <div className="grid grid-cols-2 gap-3 mb-8">
        {traits.map((t) => (
          <div
            key={t.label}
            className="bg-white rounded-2xl p-4 border border-cream-200 shadow-sm"
          >
            <span className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">
              {t.label}
            </span>
            <Badge variant="secondary" className="bg-sage-100 text-sage-700">
              {t.value}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
