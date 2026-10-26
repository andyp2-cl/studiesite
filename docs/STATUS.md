# Läge

Uppdateras vid varje commit. Senast: 2026-10-26.

## Klart

- Steg 1–5 i SPEC.md: projektuppsättning, datamodell med RLS, inloggning och roller, elevvyer, generatorer för matematikpaketet med tester.
- Faktaämnen: läs-sedan-quiz, källor från Wikipedia och länkar, Lgr22-innehåll från Skolverket.
- Gamification: XP, nivåer, dagsmål, streak med frys, topplista.
- Hjälp i rätt läge: tips efter två missar i rad (tillbaka till texten, lättare nivå, förklaring på en gratis sajt) och "Lär dig mer"-länkar.
- AI används bara i admin, med den billiga modellen (Haiku), loggat i `ai_calls` med budgettak. "Skapa moment med frågor" på ett område delar upp det i 3–4 moment och fyller alla med lästext och 8–12 frågor (fritext, flerval, sant/falskt) som publiceras direkt. Tomma moment kan fyllas på samma sätt. Fyll ett enskilt moment ger fortfarande utkast att granska. AI skriver inga skrivuppgifter. Ungefär 5 öre per moment.
- Admin: innehåll, användare (årskurs, dagsmål, godkäntgräns, lösenord), statistik, inställningar.
- Dagens mix (`/mix`): 10 uppgifter från upp till 4 övade moment, viktade mot nyliga fel och tid sedan senaste övning. "Läs och svara"-moment ingår inte.
- Kortsamling (ersätter monstren): fotbollsspelare (546 kort) eller artister (721 kort) i brons, silver och guld, riktiga namn och enkla ritade bilder. Data i `lib/cards/football.ts` och `music.ts`, en rad per kort; nya kort läggs sist i sin nivå. Samlingssidan visar elevens kort och hur många som finns kvar per nivå.
- Kortutdelning: ett kort när alla synliga moment i ett matteområde klarat Lätt (brons), Medel (silver) och Svår (guld), och silver när alla quiz i ett faktaområde är klara. Delas ut när svaret sparas (med en notis i övningen) och kontrolleras även när samlingssidan öppnas, så redan klarade områden ger kort i efterhand.

## På gång

Belöningar är sparsamma: bara kort, och bara för stora milstolpar.

1. Ta bort mynt och monsterpaket (även tabellen `user_monsters`).
2. Admin väljer tema per elev (fotboll eller musik), och en snyggare notis när ett nytt kort delas ut.

Märken (achievements) byggs inte: korten är den enda samlingen.

## Senare

- Veckosammanfattning ("Wrapped").
- AI-feedback på elevens lösningsbeskrivningar (steg 8 i SPEC.md). Beskrivningarna sparas och ger XP men bedöms inte än.
- Skrivuppgifter med AI-bedömning (visas som "öppnar snart").

## Kända brister

- Dagens mix, kortsamlingen och kortutdelningen är inte provkörda inloggade av Claude, bara via tester, typkontroll och en läsfråga mot databasen.
- Kortens position, genre och land är skrivna ur minnet och kan innehålla enstaka fel. Rättas direkt i datafilerna.
