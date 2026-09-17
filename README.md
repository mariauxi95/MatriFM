# Maru & Fer · Invitación digital

Invitación destino estilo aerolínea / *The Long Distance Club*.

## Desarrollo

```bash
npm install
npm run dev
```

Abre un código de prueba, por ejemplo:

[http://localhost:5173/invite/191201](http://localhost:5173/invite/191201)

Admin local: [http://localhost:5173/admin](http://localhost:5173/admin) con token `change-me` (o el de `.env`).

## Persistencia

- Sin `VITE_SHEETS_API`: RSVP, regalos y FM Club quedan en `localStorage`.
- Con Google Sheet **InvitadosMatri**: sigue `sheets/README.md`.

## Contenido

Paleta, fotos y ilustraciones viven en `public/images`. La lista de invitados se genera con:

```bash
python scripts/extract_guests.py
```
