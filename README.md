# Studiesite

Gamifierad pluggsajt i matematik för åk 6–7. Se `SPEC.md` för vad som byggs och `CLAUDE.md` för arbetsregler.

## Kom igång (PowerShell)

```powershell
npm install
Copy-Item .env.example .env.local   # fyll i värdena
npm run dev                          # http://localhost:3000
```

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

## Driftsättning

GitHub-repot kopplas till Vercel (Hobby). Varje push till `main` driftsätts automatiskt. Miljövariablerna från `.env.example` läggs in i Vercel under Project → Settings → Environment Variables.

## PWA

Sajten kan installeras på hemskärmen (manifest i `app/manifest.ts`, ikoner genereras i `app/icons/`). Service workern registreras bara i produktionsbygget och kräver HTTPS. Installationen kan alltså testas på Vercel, inte via lokal http.
