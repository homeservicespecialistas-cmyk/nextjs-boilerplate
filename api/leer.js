import { google } from 'googleapis';

export default async function handler(req, res) {
  const auth = new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/spreadsheets']
  );

  const sheets = google.sheets({ version: 'v4', auth });

  const timestamp = new Date().toISOString();
  const correo = (req.query.correo || '').trim().toLowerCase();

  try {
    // Leer toda la hoja desde A2:D (incluye nombre, correo, estado, código)
    const hoja = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: 'Correos!A2:D',
    });

    const filas = hoja.data.values || [];

    // Buscar el correo en la columna B (índice 1)
    const filaIndex = filas.findIndex(fila =>
      (fila[1] || '').trim().toLowerCase() === correo
    );

    if (filaIndex === -1) {
      return res.status(404).json({ status: 'error', message: 'Correo no encontrado en la hoja Correos' });
    }

    const filaReal = filaIndex + 2; // +2 porque empieza en A2
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: `Correos!D${filaReal}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[timestamp]],
      },
    });

    res.status(200).json({ status: 'ok', timestamp, correo });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: error.message });
  }
}
