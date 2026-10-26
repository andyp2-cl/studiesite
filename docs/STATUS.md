# Läge

Uppdateras vid varje commit. Senast: 2026-10-26.

## Klart

- Steg 1–5 i SPEC.md: projektuppsättning, datamodell med RLS, inloggning och roller, elevvyer, generatorer för matematikpaketet med tester.
- Faktaämnen: läs-sedan-quiz, källor från Wikipedia och länkar, Lgr22-innehåll från Skolverket.
- Gamification: XP, nivåer, dagsmål (standard 150 XP, förslag 150 till och med åk 6 och 180 från åk 7), streak med frys, topplista.
- Hjälp i rätt läge: tips efter två missar i rad (tillbaka till texten, lättare nivå, förklaring på en gratis sajt) och "Lär dig mer"-länkar.
- AI används bara i admin, med den billiga modellen (Haiku), loggat i `ai_calls` med budgettak. "Skapa moment med frågor" på ett område delar upp det i 3–4 moment och fyller alla med lästext och 8–12 frågor (fritext, flerval, sant/falskt) som publiceras direkt. Tomma moment kan fyllas på samma sätt. Fyll ett enskilt moment ger fortfarande utkast att granska. AI skriver inga skrivuppgifter. Ungefär 5 öre per moment.
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
- Skrivuppgifter med AI-bedömning (visas som "öppnar snart").

## Kända brister

- Dagens mix, kortsamlingen och kortutdelningen är inte provkörda inloggade av Claude, bara via tester, typkontroll och en läsfråga mot databasen.
- Kortens position, genre och land är skrivna ur minnet och kan innehålla enstaka fel. Rättas direkt i datafilerna.
