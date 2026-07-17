import { NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

async function getDoc() {
  if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SHEET_ID) {
    throw new Error('Google Sheets credentials are not set in environment variables');
  }

  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
  await doc.loadInfo();
  return doc;
}

export async function GET() {
  try {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['Sentences'] || doc.sheetsByIndex[0];
    const rows = await sheet.getRows();
    
    const sentences = rows.map(row => ({
      id: row.get('ID'),
      topic: row.get('Topic'),
      vietnamese: row.get('Vietnamese'),
      english: row.get('English'),
      chinese: row.get('Chinese_Traditional'),
      pinyin: row.get('Pinyin'),
      createdAt: row.get('CreatedAt')
    }));

    return NextResponse.json(sentences.reverse()); // Latest first
  } catch (error: any) {
    console.error('Error fetching sentences:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const doc = await getDoc();
    
    let sheet = doc.sheetsByTitle['Sentences'];
    if (!sheet) {
      // Create sheet if it doesn't exist
      sheet = await doc.addSheet({ headerValues: ['ID', 'Topic', 'Vietnamese', 'English', 'Chinese_Traditional', 'Pinyin', 'CreatedAt'], title: 'Sentences' });
    }
    
    const newRow = await sheet.addRow({
      ID: crypto.randomUUID(),
      Topic: data.topic || 'General',
      Vietnamese: data.vietnamese,
      English: data.english,
      Chinese_Traditional: data.chinese,
      Pinyin: data.pinyin,
      CreatedAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error adding sentence:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['Sentences'] || doc.sheetsByIndex[0];
    const rows = await sheet.getRows();
    
    const rowToDelete = rows.find(row => row.get('ID') === id);
    if (rowToDelete) {
      await rowToDelete.delete();
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Sentence not found' }, { status: 404 });
    }
  } catch (error: any) {
    console.error('Error deleting sentence:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
