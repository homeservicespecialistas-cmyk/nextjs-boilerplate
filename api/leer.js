import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).send('Falta el parámetro id');

  const auth = new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/spreadsheets']
  );

  const sheets = google.sheets({ version: 'v4', auth });
  const sheetId = process.env.GOOGLE_SHEETS_ID;

  try {
    const get = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Correos!A2:E',
    });

    const rows = get.data.values || [];
    const index = rows.findIndex(row => row[3] === id);

    if (index !== -1) {
      const rowNumber = index + 2;
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `Correos!C${rowNumber}:E${rowNumber}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [['Leído', new Date().toISOString()]],
        },
      });
    }

    const imagePath = path.join(process.cwd(), 'public', 'tarjeta.png');
    const imageBuffer = fs.readFileSync(imagePath);
    res.setHeader('Content-Type', 'image/png');
    res.send(imageBuffer);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error interno');
  }
}
