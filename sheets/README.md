# InvitadosMatri — Google Sheets

1. Crea un Google Sheet llamado **InvitadosMatri**.
2. Crea estas pestañas: `Guests`, `RSVP`, `Gifts`, `Contributions`, `Settings`, `Club`.
3. En `Guests`, primera fila: `id, displayName, fullName, email, guestLimit`.
4. Importa `src/data/guests.json` (o pega las columnas desde `Save the date V1.xlsx`).
5. En `Gifts`, copia los 15 regalos desde `src/data/gifts.ts` (id, emoji, títulos, metas).
6. Extensiones → Apps Script. Pega `Code.gs`.
7. Project Settings → Script properties → `ADMIN_TOKEN` = el mismo valor que `VITE_ADMIN_TOKEN`.
8. Deploy → New deployment → Web app.
   - Execute as: Me
   - Who has access: Anyone
9. Copia la URL en `.env` como `VITE_SHEETS_API`.

Sin esta URL la app funciona en local con `guests.json` + `localStorage`.
