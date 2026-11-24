# Läge

Uppdateras vid varje commit. Senast: 2026-11-23.

## Klart

- Steg 1–5 i SPEC.md: projektuppsättning, datamodell med RLS, inloggning och roller, elevvyer, generatorer för matematikpaketet med tester.
- Faktaämnen: läs-sedan-quiz, källor från Wikipedia och länkar, Lgr22-innehåll från Skolverket.
- Gamification: XP, nivåer, dagsmål (standard 150 XP, förslag 150 till och med åk 6 och 180 från åk 7), streak med frys, topplista.
- Hjälp i rätt läge: tips efter två missar i rad (tillbaka till texten, lättare nivå, förklaring på en gratis sajt) och "Lär dig mer"-länkar.
- AI anropas bara på servern, loggat i `ai_calls` med budgettak. Admin använder mest den billiga modellen (Haiku). "Skapa moment med frågor" på ett område delar upp det i 3–4 moment och fyller alla med lästext och 8–12 frågor (fritext, flerval, sant/falskt) som publiceras direkt. Tomma moment kan fyllas på samma sätt. Fyll ett enskilt moment ger fortfarande utkast att granska. Varje moment får också en skrivuppgift med bedömningsstöd, och "Skapa skrivuppgift med AI" lägger till en i moment som redan har lästext. Ungefär 5 öre per moment.
- Foto av frågor: i ett "Läs och svara"-moment fotar admin 1–4 bilder med frågor (arbetsblad, frågor i boken). AI (Sonnet) läser av frågorna, skriver en kort lästext (300–500 ord) där svaren finns, gör om frågorna till fritext, flerval eller sant/falskt och lägger till en skrivuppgift. Områdets källor används om de finns. Allt blir utkast. Bilderna förminskas i webbläsaren (Vercel tar max 4,5 MB per anrop). Ungefär 50 öre per gång.
- Skrivuppgifter: eleven skriver, skickar och får kort AI-feedback (Haiku) mot bedömningsstödet: Godkänd, Nästan där eller Inte än. Godkänd text ger tredje stjärnan. Senaste texten och feedbacken visas så att eleven kan förbättra och skicka igen. Max antal per dag följer inställningen för AI-feedback (standard 5).
- "Mer om det här": när eleven har svarat på alla frågor (klarat eller inte) kan AI skriva ett nytt avsnitt (200–250 ord) på samma tema med 5 frågor, publicerat direkt för alla. Högst 3 per elev och dag och högst 10 lästexter per moment.
- Glosor (språkämnen): i ett moment klistrar admin in glosor, ett par per rad (`perdón – ursäkta, förlåt`). Det blir en lästext "Glosor" och publicerade frågor: vad betyder ordet (fritext), hur säger man det på språket (fritext) och flerval där de andra glosornas betydelser är fel alternativ. Komma och frågetecken skiljer rätta svar åt, ord inom parentes kan utelämnas, han/hon/den godtar vart och ett, och accenter och ¿ ¡ behöver eleven inte skriva. Momentet blir "Läs och svara". Ingen AI.
- Fritextsvar godtas också när eleven skriver kärnan av ett längre svar: "intressant" för "Vad intressant!", "fråga" för "en fråga". Orden ska stå i samma ordning, det längsta ordet ska vara med och minst hälften av orden. "en" eller bara "gammal" för "Hur gammal är han" blir fortfarande fel. Gäller alla fritextfrågor, även befintliga.
- Fritextsvar tål accenter och ¿ ¡ ("cuantos anos" för "Cuántos años", men å ä ö räknas) och en liten felskrivning: en bokstav fel, för mycket eller för lite från 5 tecken, två från 12. Korta ord måste vara exakta.
- Admin: innehåll, användare (årskurs, dagsmål, godkäntgräns, lösenord), statistik, inställningar.
- "Visa som" i admin är bara för att titta: raden blir gul och övning och "Jag har läst" är spärrade (svaren skulle annars sparas på adminkontot). Barnen loggar in själva.
- "Logga ut" längst ner i sidomenyn (dator) och på Profil (mobil), både för elever och i admin.
- Dagens mix (`/mix`): 10 uppgifter från upp till 4 övade moment, viktade mot nyliga fel och tid sedan senaste övning. "Läs och svara"-moment ingår inte.
- Kortsamling (ersätter monstren): fotbollsspelare (546 kort) eller artister (721 kort) i brons, silver och guld, riktiga namn och enkla ritade bilder. Data i `lib/cards/football.ts` och `music.ts`, en rad per kort; nya kort läggs sist i sin nivå. Samlingssidan visar elevens kort och hur många som finns kvar per nivå.
- Kortutdelning: ett bronskort för var femte rätt svar (alla ämnen), och ett kort när alla synliga moment i ett matteområde klarat Lätt (brons), Medel (silver) och Svår (guld), och silver när alla quiz i ett faktaområde är klara. Delas ut när svaret sparas och kontrolleras även när samlingssidan öppnas, så redan klarade områden ger kort i efterhand. I övningen visas det nya kortet med länk till samlingen.
- Admin väljer kortsamling per elev under Användare (Herman: fotboll, Märta: artister).
- Mynt, monster och den gamla belöningsbutiken är borttagna. Admins statistik visar antal kort i stället för mynt.

## På gång

Belöningar är bara kort: brons för var femte rätt svar, finare kort för klara områden.

Inget just nu.

Märken (achievements) byggs inte: korten är den enda samlingen.

## Senare

- Veckosammanfattning ("Wrapped").
- AI-feedback på elevens lösningsbeskrivningar (steg 8 i SPEC.md). Beskrivningarna sparas och ger XP men bedöms inte än.

## Kända brister

- Fotoflödet, skrivfeedbacken och "Mer om det här" är bara testade med enhetstester och typkontroll, inte med riktiga AI-anrop.
- Dagens mix, kortsamlingen och kortutdelningen är inte provkörda inloggade av Claude, bara via tester, typkontroll och en läsfråga mot databasen.
- Kortens position, genre och land är skrivna ur minnet och kan innehålla enstaka fel. Rättas direkt i datafilerna.
