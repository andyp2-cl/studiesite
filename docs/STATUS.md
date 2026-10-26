# Läge

Uppdateras vid varje commit. Senast: 2026-10-26.

## Klart

- Steg 1–5 i SPEC.md: projektuppsättning, datamodell med RLS, inloggning och roller, elevvyer, generatorer för matematikpaketet med tester.
- Faktaämnen: läs-sedan-quiz, källor från Wikipedia och länkar, Lgr22-innehåll från Skolverket.
- Gamification: XP, nivåer, dagsmål, streak med frys, topplista.
- Hjälp i rätt läge: tips efter två missar i rad (tillbaka till texten, lättare nivå, förklaring på en gratis sajt) och "Lär dig mer"-länkar.
- AI används bara i admin (utkast till frågor), loggat i `ai_calls` med budgettak.
- Admin: innehåll, användare (årskurs, dagsmål, godkäntgräns, lösenord), statistik, inställningar.
- Dagens mix (`/mix`): 10 uppgifter från upp till 4 övade moment, viktade mot nyliga fel och tid sedan senaste övning. "Läs och svara"-moment ingår inte.
- Kortsamling (ersätter monstren): fotbollsspelare eller artister, 42 kort per tema (20 brons, 14 silver, 8 guld), riktiga namn och ritade bilder. Samlingssidan visar albumet för elevens tema.

## På gång

Belöningar är sparsamma: bara kort, och bara för stora milstolpar.

1. Utdelning: ett kort när ett matteområde klarar Lätt (brons), Medel (silver) och Svår (guld), och silver när ett faktaområde är klart.
2. Ta bort mynt och monsterpaket (även tabellen `user_monsters`).
3. Admin väljer tema per elev, och en notis i övningen när ett nytt kort delas ut.

Märken (achievements) byggs inte: korten är den enda samlingen.

## Senare

- Veckosammanfattning ("Wrapped").
- AI-feedback på elevens lösningsbeskrivningar (steg 8 i SPEC.md). Beskrivningarna sparas och ger XP men bedöms inte än.
- Skrivuppgifter med AI-bedömning (visas som "öppnar snart").

## Kända brister

- Dagens mix och kortsamlingen är inte provkörda inloggade av Claude, bara via tester och typkontroll.
- Migrationen `20261026200000_cards.sql` måste köras live: `npm run db:push` och sedan `npm run db:types`. Tills dess visar samlingen fotbollskort utan några tagna kort.
