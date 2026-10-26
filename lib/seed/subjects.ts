// The school subjects of Lgr22 for åk 6–9, without areas: the admin adds
// areas (and sources) to the ones being studied and hides the rest.
// Mathematics, with its full package, is in math.ts.

export type SeedSubjectShell = {
  slug: string;
  name: string;
  description: string;
  color: string;
  icon: string;
};

export const otherSubjects: SeedSubjectShell[] = [
  { slug: "svenska", name: "Svenska", description: "Läsa, skriva, grammatik och litteratur.", color: "#f59b23", icon: "book-text" },
  { slug: "engelska", name: "Engelska", description: "Ord, grammatik, läsförståelse och att skriva på engelska.", color: "#509bf5", icon: "message-square-text" },
  { slug: "tyska", name: "Tyska", description: "Glosor, grammatik och vardagsfraser.", color: "#e8115b", icon: "languages" },
  { slug: "spanska", name: "Spanska", description: "Glosor, grammatik och vardagsfraser.", color: "#ff6437", icon: "speech" },
  { slug: "historia", name: "Historia", description: "Från forntiden till i dag – händelser, människor och orsaker.", color: "#a56752", icon: "hourglass" },
  { slug: "geografi", name: "Geografi", description: "Jordens landskap, klimat, befolkning och resurser.", color: "#148a08", icon: "earth" },
  { slug: "religionskunskap", name: "Religionskunskap", description: "Världsreligioner, livsfrågor och etik.", color: "#8d67ab", icon: "hand-heart" },
  { slug: "samhallskunskap", name: "Samhällskunskap", description: "Demokrati, rättigheter, ekonomi och medier.", color: "#2d46b9", icon: "scale" },
  { slug: "biologi", name: "Biologi", description: "Kroppen, ekologi, evolution och livets byggstenar.", color: "#27856a", icon: "dna" },
  { slug: "fysik", name: "Fysik", description: "Energi, krafter, elektricitet, ljud och ljus.", color: "#4100f4", icon: "atom" },
  { slug: "kemi", name: "Kemi", description: "Ämnen, reaktioner och kemin i vardagen.", color: "#af2896", icon: "flask" },
  { slug: "teknik", name: "Teknik", description: "Hur tekniska lösningar fungerar och tas fram.", color: "#477d95", icon: "cpu" },
  { slug: "hem-och-konsumentkunskap", name: "Hem- och konsumentkunskap", description: "Mat, hälsa, ekonomi och hållbar konsumtion.", color: "#ba5d07", icon: "chef-hat" },
  { slug: "idrott-och-halsa", name: "Idrott och hälsa", description: "Träning, hälsa, kost och livsstil.", color: "#e13300", icon: "heart-pulse" },
  { slug: "musik", name: "Musik", description: "Musikteori, instrument och musikhistoria.", color: "#dc148c", icon: "music" },
  { slug: "bild", name: "Bild", description: "Bildanalys, tekniker och konsthistoria.", color: "#0fa3b1", icon: "palette" },
  { slug: "slojd", name: "Slöjd", description: "Material, verktyg och arbetsprocessen.", color: "#7d4b32", icon: "hammer" },
];
