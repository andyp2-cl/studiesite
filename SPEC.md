# Studiesite – specifikation

En gamifierad pluggsajt för två syskon (åk 6 och åk 7, 12 och 13 år). Fokus på matematik. Sajten ska kännas modern och rolig, inte som ett skolsystem. Designreferens: Spotify.

## 1. Mål

- Barnen ska vilja öppna sajten frivilligt. Gamification och snygg design är lika viktigt som innehållet.
- Matematik först, med ett färdigt paket enligt Lgr22 för åk 6–7.
- Förälder (admin) kan lägga till ämnen, områden och moment när som helst.
- Senare: ladda upp PDF/foto från läroböcker och låta AI skapa uppgifter som admin godkänner innan publicering.
- Låga driftskostnader. AI används bara där det tillför något; allt som kan rättas med kod rättas med kod.

## 2. Teknik och drift

| Del | Val | Varför |
|---|---|---|
| Ramverk | Next.js (App Router) + TypeScript | En kodbas för frontend och API-rutter |
| Styling | Tailwind CSS + shadcn/ui | Snabbt att bygga snyggt |
| Databas, inloggning, fillagring | Supabase (gratisnivå) | Postgres, auth och storage i ett |
| Hosting | Vercel (Hobby, gratis) kopplat till GitHub-repot | Varje push till `main` deployas automatiskt |
| Matterendering | KaTeX | Snygga formler i förklaringar och uppgifter |
| Svarskontroll | mathjs | Rättar numeriska svar och uttryck utan AI |
| AI | Anthropic Claude API, endast server-side | Se avsnitt 8 |
| Mobil | PWA (installerbar på hemskärmen) | Barnen använder både Windows-dator och mobil |

Utvecklingsmiljö: Windows. All kod och alla skript ska fungera i PowerShell (inga bash-only-skript). Lokal körning med `npm run dev` ska fungera mot Supabase-projektet så att sajten även kan testas på samma wifi.

Hemligheter (`ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) ligger bara i `.env.local` och i Vercels miljövariabler. De får aldrig nå klienten.

## 3. Användare och roller

- **Admin** (förälder): full åtkomst, adminpanel, statistik.
- **Elev** (två konton): pluggar, samlar XP, ser topplistan.

Inloggning med användarnamn + lösenord (barnen ska inte behöva e-post). Implementera med Supabase Auth där admin skapar elevkonton med en intern pseudo-adress, t.ex. `<användarnamn>@studiesite.local`. Elever kan inte registrera sig själva. Sessionen ska vara långlivad så att barnen slipper logga in hela tiden på mobilen.

Row Level Security i Supabase: elever ser bara sin egen data plus topplistans publika fält (namn, avatar, XP, nivå, streak).

## 4. Innehållsstruktur

**Ämne → Område → Moment**

Exempel: Matematik → Bråk → Förlänga och förkorta.

Varje **moment** har:
- **Introduktion**: grundläggande förklaring (markdown + KaTeX), synlig från start.
- **Tre nivåer**: Lätt, Medel, Svår. Medel låses upp när Lätt är klar, osv.
- **Fördjupningar**: förklaringstexter som låses upp när en viss nivå klaras ("Det du just gjorde kallas…"). Admin anger vilken nivå som låser upp vilken text.
- **Uppgiftskälla**: antingen en *generator* (kod) eller en bank med *fasta uppgifter* (skrivna av admin eller AI-genererade och godkända).

En nivå räknas som klarad när eleven har minst 8 rätt av de senaste 10 försöken på nivån. Varje klarad nivå ger en stjärna (max 3 per moment), som visas som en progressring på momentkortet.

## 5. Matematikpaketet (förifyllt via seed)

Varje moment får en generator i kod med parametrar per nivå. Generatorer ska vara deterministiska utifrån en seed så att en uppgift kan återskapas och visas igen i statistiken.

**Taluppfattning**: positionssystemet och avrundning, negativa tal, de fyra räknesätten, prioriteringsregler.
**Bråk**: förlänga och förkorta, jämföra och storleksordna, blandad form, addition och subtraktion, multiplikation och division.
**Decimaltal och procent**: räkna med decimaltal, omvandla mellan bråk, decimaltal och procent, procent av ett tal, hur många procent.
**Potenser**: potensform, kvadrater och kvadratrötter.
**Algebra**: skriva och tolka uttryck, förenkla uttryck, ekvationer i ett steg, ekvationer i två steg, talmönster.
**Geometri**: omkrets och area (rektangel, triangel, parallellogram, cirkel), vinklar, enhetsomvandling (längd, area, volym).
**Statistik och sannolikhet**: medelvärde, median och typvärde, enkel sannolikhet.

Varje moment i seeden ska ha en kort introduktion och minst en fördjupning skriven på enkel svenska för 12–13-åringar.

Geometriuppgifter ska ha enkla SVG-figurer genererade i koden (rektanglar, trianglar, vinklar med mått).

## 6. Svar och lösningar i matte

**Svarsinmatning**: ett vanligt textfält plus en symbolrad med knappar för bråkstreck, ×, ÷, ^, √, π, parenteser och minus. Symbolraden är extra viktig på mobil. Svaret visas live som renderad formel (KaTeX) under fältet.

**Rättning (gratis, utan AI)**: mathjs tolkar svaret och jämför med facit. Ekvivalenta svar ska godkännas: `3/4`, `0.75`, `0,75` och `6/8` är rätt om inte uppgiften uttryckligen kräver förkortad form. Både komma och punkt som decimaltecken ska accepteras. För ekvationer räcker det att eleven skriver `x = 4` eller `4`.

**Vid fel svar**: visa rätt svar och en färdig steg-för-steg-lösning som generatorn tar fram (ingen AI). Eleven kan försöka på en liknande uppgift direkt.

**Beskriv din lösning**: valfritt fritextfält ("Hur tänkte du?"). Beskrivningen sparas och syns för admin i statistiken. Det ger lite extra XP att skriva en beskrivning.

**AI-feedback på lösning**: en knapp "Få feedback" som skickar uppgift, facit och elevens beskrivning till den billiga modellen. Max 5 anrop per elev och dag (konfigurerbart). Svaret ska vara kort, uppmuntrande och på svenska.

## 7. Gamification

**XP**: Lätt 10, Medel 20, Svår 30 per rätt svar. +5 för en skriven lösningsbeskrivning. Ingen XP-förlust vid fel.

**Nivåer**: XP-kurva som går snabbt i början och sedan planar ut. Varje nivå har ett namn (t.ex. Nybörjare → Räknare → Problemlösare → Mattemästare → Legend). Nivå upp ger en tydlig animation.

**Dagsmål och streak**: dagsmål på 50 XP (admin kan ändra). Att nå dagsmålet förlänger streaken. Varje elev får en "streakfrys" per vecka som automatiskt räddar en missad dag.

**Märken (achievements)**: t.ex. Första rätt, 10 i rad, 7 dagars streak, 30 dagars streak, Bråkmästare (alla bråkmoment med 3 stjärnor), Nattuggla, Morgonpigg, Hundra uppgifter, Förklaringsproffs (20 lösningsbeskrivningar). Definieras i en tabell så att admin kan lägga till fler.

**Topplista**: veckovis (nollställs måndag) och all-time. Veckovisa listan är huvudvyn så att det alltid finns en chans att vinna veckan.

**Belöningsbutik**: separat valuta, "mynt", som tjänas parallellt med XP (1 mynt per 10 XP). Admin lägger in riktiga belöningar med pris (skärmtid, välja middag, glass). Eleven "köper" och admin godkänner utlösningen.

**Veckosammanfattning ("Wrapped")**: på måndagar visas ett snyggt kort med förra veckans siffror: uppgifter, XP, bästa moment, längsta svit rätt, nya märken.

**Dagens mix**: en personlig blandad övningsrunda med 10 uppgifter, viktad mot moment där eleven nyligen haft fel eller inte övat på länge (enkel spaced repetition).

## 8. AI-användning och kostnadskontroll

All AI-kod samlas i en modul, t.ex. `lib/ai.ts`. Modellnamn sätts via miljövariabler, inte hårdkodat:

- `AI_MODEL_CHEAP` – den billigaste aktuella Claude-modellen (Haiku-klass), för lösningsfeedback och rättning av fritext.
- `AI_MODEL_SMART` – mellanklassmodell (Sonnet-klass), för att läsa PDF/foton och skapa uppgifter (fas 2).

Krav:
- Varje anrop loggas i en tabell (`ai_calls`): användare, syfte, modell, tokens in/ut, uppskattad kostnad.
- Admin sätter en månadsbudget i inställningar. När den är nådd stängs AI-funktioner av och sajten fungerar vidare utan dem.
- Promptar ber om korta svar och JSON där det är lämpligt.

## 9. Adminpanel (`/admin`)

- **Innehåll**: skapa, redigera, sortera (dra och släpp) och dölja ämnen, områden och moment. Redigera introduktion och fördjupningar i markdown med live-förhandsvisning (KaTeX). Koppla moment till en generator eller till fasta uppgifter.
- **Fasta uppgifter**: skapa och redigera uppgifter med typerna numeriskt svar, uttryck/ekvation, flerval, sant/falskt, fritext.
- **Användare**: skapa elevkonton, återställ lösenord, välj avatar.
- **Statistik**: per elev: tid och uppgifter per dag/vecka, träffsäkerhet per moment (markera svaga moment tydligt), senaste fel, lösningsbeskrivningar.
- **Belöningar**: hantera butiken och godkänn utlösningar.
- **Inställningar**: dagsmål, AI-budget, max AI-feedback per dag.
- **AI-kostnad**: förbrukning den här månaden.

## 10. Design

Referens: Spotify.

- Mörkt tema som standard (nästan svart bakgrund, mörkgrå kort), en stark accentfärg. Ljust tema som tillval.
- Startsidan som en Spotify-hem: hälsning efter tid på dygnet, "Fortsätt där du slutade", "Dagens mix", rader med horisontellt scrollbara områdeskort.
- Varje ämne och område har en egen gradientfärg och en ikon.
- Fast bottennavigering på mobil (Hem, Ämnen, Topplista, Profil), sidomeny på dator.
- Mjuka mikroanimationer: kortet "studsar" vid rätt svar, XP-siffror som flyger upp, konfetti vid nivå upp och nya märken. Respektera `prefers-reduced-motion`.
- Ljudeffekter avstängda som standard, går att slå på i profilen.
- All text i gränssnittet på svenska, kort och vänlig ton. Inget som känns barnsligt för en 13-åring.
- Mobile-first, men ska vara riktigt bra på en Windows-laptop också.

## 11. Datamodell (riktlinje)

`profiles` (id, username, display_name, role, avatar, xp, coins, level, streak, streak_freezes, last_active_date)
`subjects`, `areas`, `moments` (hierarki, sort_order, color, icon, is_hidden)
`content_blocks` (moment_id, type: intro/deepening, body_md, unlock_level)
`generators` (moment_id, generator_key, params_per_level jsonb)
`tasks` (moment_id, level, type, prompt_md, answer jsonb, choices jsonb, solution_md, status: draft/published, source: admin/ai)
`attempts` (user_id, moment_id, level, task_id eller generator_seed, answer, correct, explanation_text, created_at)
`moment_progress` (user_id, moment_id, stars, current_level)
`xp_events` (user_id, amount, reason, created_at)
`achievements`, `user_achievements`
`rewards`, `reward_redemptions` (status: pending/approved/denied)
`uploads` (fas 2: fil, ämne, status)
`ai_calls`, `settings`

Supabase-migrationer ska ligga i repot. En seed-fil skapar matematikpaketet, märkena och testkonton.

## 12. Fas 2 (bygg inte nu, men designa så att det går)

- Uppladdning av PDF eller foto i admin, kopplat till ett ämne och område.
- `AI_MODEL_SMART` läser materialet och föreslår ett område, moment, en introduktionstext och 10–20 uppgifter av blandade typer (mest fritext, plus flerval och sant/falskt).
- Allt hamnar som **utkast**. Admin granskar, redigerar och publicerar.
- Fritextsvar rättas först med enkel matchning mot facit och nyckelord; bara vid osäkerhet anropas `AI_MODEL_CHEAP`.
- Ämnen som kommer: NO, SO, tyska och spanska. För språk tillkommer uppgiftstypen glosor/flashcards.

## 13. Version 1 – leveransordning

1. Projektuppsättning: Next.js, Tailwind, shadcn/ui, Supabase-klient, PWA, deploy till Vercel.
2. Datamodell, migrationer, RLS och seed.
3. Inloggning och roller.
4. Elevvyer: hem, ämne, område, moment (intro, nivåer, uppgiftsflöde, fördjupningar).
5. Generatorer för hela matematikpaketet, med enhetstester för varje generator och för svarskontrollen.
6. Gamification: XP, nivåer, dagsmål, streak, märken, topplista, Dagens mix.
7. Adminpanel: innehåll, användare, statistik, inställningar.
8. AI-feedback på lösningar med loggning och budgettak.
9. Belöningsbutik och veckosammanfattning.

Varje steg ska gå att köra och testa innan nästa påbörjas.
