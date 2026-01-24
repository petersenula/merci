// src/components/landing/sections/HeroSection.server.tsx
import Button from "@/components/ui/button";

export default function HeroSectionServer() {
  return (
    <section className="sr-only">
      <h1 className="text-4xl md:text-5xl font-bold leading-tight text-slate-900">
        Trinkgeld digital sammeln – einfach & fair
      </h1>

      <p className="text-lg text-slate-600">
        Für Einzelpersonen und Teams in der Schweiz.  
        Disponible en français · Disponibile in italiano · Available in English.
      </p>

      <form action="/signup">
        <Button
          type="submit"
          variant="green"
          className="px-6 py-3 text-lg rounded-xl"
        >
          Jetzt Trinkgeld sammeln
        </Button>
      </form>

      <p className="text-sm text-foreground/60">
        Kostenlos starten · Keine Einrichtungskosten
      </p>
    </section>
  );
}