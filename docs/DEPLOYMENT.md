# Morichup — Deploy in produzione

Architettura di deploy scelta: **client su Vercel** (statico, build Vite) e
**server su un host always-on separato** (Railway/Render/Fly.io — qualsiasi
host che tenga un processo Node.js vivo 24/7). Non si usa Vercel per il
server: le sue funzioni sono serverless e stateless, incompatibili con un
server Socket.IO che tiene lo stato delle stanze in memoria in un processo
lungo. Nessun database: se il server riavvia, le partite in corso si
perdono (accettabile per questa fase, vedi `docs/ARCHITECTURE.md`).

```
┌─────────────────────────┐        WebSocket        ┌──────────────────────────┐
│   client — Vercel        │ ───────────────────────▶ │  server — Railway/Render/ │
│   morichup.ivxn.dev      │ ◀─────────────────────── │  Fly.io (always-on)       │
└─────────────────────────┘                           └──────────────────────────┘
```

## 1. Server (Railway/Render/Fly.io)

Il monorepo usa npm workspaces: la piattaforma deve buildare `shared` e
`server` (in quest'ordine, `server` dipende dai tipi di `shared`) e poi
avviare il server. Dalla **root del repository** (non dalla cartella
`server/`):

- **Build command**: `npm install && npm run build --workspace shared && npm run build --workspace server`
  (serve principalmente come controllo dei tipi prima del deploy: il
  progetto è ancora troppo piccolo per un vero step di bundling)
- **Start command**: `npm run start --workspace server` (esegue `tsx src/index.ts`
  nella cartella `server` — lo stesso meccanismo già usato in sviluppo, non il
  file compilato in `dist/`: l'output di `tsc` non è eseguibile direttamente
  da Node puro perché il monorepo usa `moduleResolution: "Bundler"`)
- **Variabili d'ambiente**: copia `server/.env.example` — di solito basta
  impostare `CORS_ORIGIN` con il dominio del client una volta che esiste
  (vedi punto 3). `PORT` è quasi sempre gestita automaticamente dalla
  piattaforma.
- **Health check**: `GET /health` risponde `{"status":"ok"}`, utile per il
  controllo di salute della piattaforma.

Qualsiasi delle tre piattaforme (Railway, Render, Fly.io) va bene: la scelta
tra loro è indifferente per questo progetto, prendi quella con cui hai più
familiarità o il piano gratuito più comodo. Prendi nota dell'URL pubblico
assegnato al server (es. `https://morichup-server.up.railway.app`): serve al
punto 2.

## 2. Client (Vercel)

1. Importa la repo GitHub `YasserOudabashi/morichup` su Vercel.
2. **Root Directory**: `client` (il progetto Vite vero e proprio è lì, non
   nella root del monorepo).
3. Framework preset: Vite (rilevato automaticamente). Vercel esegue da solo
   `npm install` e `npm run build` dentro `client/`; `vercel.json` in
   `client/` aggiunge il rewrite `/* → /index.html` necessario perché i link
   di invito (`/join/CODICE`, vedi `lib/url.ts`) sono gestiti lato client e
   altrimenti darebbero 404 su un refresh o un accesso diretto.
4. **Variabile d'ambiente**: `VITE_SERVER_URL` = l'URL pubblico del server
   ottenuto al punto 1 (es. `https://morichup-server.up.railway.app`).
5. Deploy.

## 3. Dominio (sottodominio di ivxn.dev)

1. In Vercel → progetto → Settings → Domains, aggiungi il sottodominio
   scelto (es. `morichup.ivxn.dev`).
2. Vercel indica il record DNS da creare (di solito un `CNAME` verso
   `cname.vercel-dns.com`); aggiungilo dal pannello DNS dove è gestito
   `ivxn.dev`.
3. Una volta che il dominio del client è definitivo, torna al server e
   imposta `CORS_ORIGIN` con quel dominio (punto 1) — altrimenti il browser
   blocca le richieste Socket.IO cross-origin in produzione.

Il server può restare sul suo sottodominio automatico della piattaforma
scelta (es. `*.up.railway.app`); non è necessario un sottodominio dedicato
di `ivxn.dev` per lui, a meno che tu non preferisca l'uniformità (in tal
caso: CNAME di un secondo sottodominio, es. `api.morichup.ivxn.dev`, verso
l'host scelto, seguendo la sua documentazione per i domini custom).

## Checklist rapida

- [ ] Server deployato, `/health` risponde 200
- [ ] `VITE_SERVER_URL` del client punta al server deployato
- [ ] Client deployato su Vercel, build verde
- [ ] Dominio `ivxn.dev` collegato al client su Vercel
- [ ] `CORS_ORIGIN` del server aggiornata con il dominio finale del client
- [ ] Partita di prova end-to-end in produzione con 2 dispositivi/browser reali
