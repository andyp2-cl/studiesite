# Läge

Uppdateras vid varje commit. Senast: 2026-10-26.

## Klart

- Steg 1–5 i SPEC.md: projektuppsättning, datamodell med RLS, inloggning och roller, elevvyer, generatorer för matematikpaketet med tester.
- Faktaämnen: läs-sedan-quiz, källor från Wikipedia och länkar, Lgr22-innehåll från Skolverket.
- Gamification: XP, nivåer, dagsmål, streak med frys, topplista.
- Hjälp i rätt läge: tips efter två missar i rad (tillbaka till texten, lättare nivå, förklaring på en gratis sajt) och "Lär dig mer"-länkar.
- AI används bara i admin (utkast till frågor), loggat i `ai_calls` med budgettak.
- Admin: innehåll, användare (årskurs, dagsmål, godkäntgräns, lösenord), statistik, inställningar.
- Monstersamling (ersatte belöningsbutiken): 60 monster i fyra sällsyntheter, överraskningspaket för mynt.
- Dagens mix (`/mix`): 10 uppgifter från upp till 4 övade moment, viktade mot nyliga fel och tid sedan senaste övning. "Läs och svara"-moment ingår inte.

## På gång

1. Märken, data: utdelningsregler mot tabellerna `achievements` och `user_achievements`.
2. Märken, visning: märken på profilen och notis vid nytt märke.

## Senare

- Veckosammanfattning ("Wrapped").
- AI-feedback på elevens lösningsbeskrivningar (steg 8 i SPEC.md). Beskrivningarna sparas och ger XP men bedöms inte än.
- Skrivuppgifter med AI-bedömning (visas som "öppnar snart").

## Kända brister

- Dagens mix är inte provkörd inloggad av Claude, bara via tester och typkontroll.
