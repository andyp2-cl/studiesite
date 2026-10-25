# Studiesite

Gamifierad pluggsajt i matematik för åk 6–7. Se `SPEC.md` för vad som byggs och `CLAUDE.md` för arbetsregler.

## Kom igång (PowerShell)

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Fyll i värdena i `.env.local`. Öppna sedan http://localhost:3000 i webbläsaren när det står `Ready`. Stoppa servern med `Ctrl+C`.

Testa från mobilen på samma wifi: kör `npm run dev -- -H 0.0.0.0` och öppna `http://<datorns-ip>:3000`. IP-adressen visas som "Network" när servern startar.

## Skript

| Kommando | Vad det gör |
|---|---|
| `npm run dev` | Utvecklingsserver |
| `npm run build` | Produktionsbygge |
| `npm start` | Kör produktionsbygget |
| `npm test` | Enhetstester (Vitest) |
| `npm run typecheck` | Typkontroll |
| `npm run lint` | ESLint |
| `npm run db:push` | Kör nya migrationer (`supabase/migrations`) mot databasen |
| `npm run db:types` | Genererar om `lib/database.types.ts` efter en migration |
| `npm run seed` | Lägger in mattepaketet, märken och admin-kontot. Rör aldrig befintliga rader |
| `npm run create-user -- herman "Herman"` | Skapar ett elevkonto och visar lösenordet en gång (`--admin` för admin) |
| `npm run check:rls` | Testar säkerhetsreglerna med tillfälliga elevkonton |

## Driftsättning

GitHub-repot kopplas till Vercel (Hobby). Varje push till `main` driftsätts automatiskt. Miljövariablerna från `.env.example` läggs in i Vercel under Project → Settings → Environment Variables.

## PWA

Sajten kan installeras på hemskärmen (manifest i `app/manifest.ts`, ikoner genereras i `app/icons/`). Service workern registreras bara i produktionsbygget och kräver HTTPS. Installationen kan alltså testas på Vercel, inte via lokal http.
