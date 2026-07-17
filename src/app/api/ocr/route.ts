import { NextResponse } from 'next/server';
import vision from '@google-cloud/vision';

const client = new vision.ImageAnnotatorClient({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});

export async function POST(req: Request) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    // Remove the data:image/jpeg;base64, prefix if present
    const base64Image = image.replace(/^data:image\/\w+;base64,/, '');

    // Call Google Cloud Vision API
    const [result] = await client.documentTextDetection({
      image: { content: Buffer.from(base64Image, 'base64') },
      imageContext: {
        languageHints: ['zh-TW', 'zh-Hant', 'zh'], // Hint for traditional Chinese
      }
    });

    const fullTextAnnotation = result.fullTextAnnotation;

    if (!fullTextAnnotation) {
      return NextResponse.json({ text: '' });
    }

    return NextResponse.json({ text: fullTextAnnotation.text });
  } catch (error: any) {
    console.error('OCR Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process image' }, { status: 500 });
  }
}
