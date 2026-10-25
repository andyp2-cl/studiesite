# CLAUDE.md – Studiesite

Läs `SPEC.md` innan du börjar. Den är källan för vad som ska byggas.

## Arbetsregler

- Bygg i den ordning som står i SPEC.md avsnitt 13. Avsluta varje steg med något som går att köra, och sammanfatta vad som gjorts innan du går vidare.
- Fråga hellre än gissa när SPEC.md inte räcker.
- Utvecklingsmiljön är Windows. Skript och instruktioner ska fungera i PowerShell. Använd `npm`.
- Gör en commit per logiskt delsteg med beskrivande meddelanden på engelska.

## Konventioner

- Kod, variabelnamn och kommentarer på engelska. All text som användaren ser på svenska.
- TypeScript strict. Inga `any` utan motivering.
- Gränssnittstexter samlas i en fil (t.ex. `lib/strings.ts`) så att de är lätta att justera.
- Generatorer ligger i `lib/generators/<område>/<moment>.ts` och exporterar en gemensam signatur: `generate(level, seed) → { prompt, answer, solutionSteps, figure? }`.
- Varje generator och svarskontrollen ska ha enhetstester (Vitest).
- AI-anrop bara via `lib/ai.ts`, bara server-side, alltid loggade i `ai_calls` och alltid kontrollerade mot budgettaket.

## Säkerhet

- Hemligheter endast i `.env.local` och Vercel. Lägg till `.env.example` utan värden.
- RLS på alla tabeller. Elever får aldrig nå `/admin` eller adminrutter.
- Committa aldrig `.env.local`.
