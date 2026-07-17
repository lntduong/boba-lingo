import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    // OCR.space requires the data URI scheme for base64
    const base64Image = image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`;

    const form = new FormData();
    form.append('base64Image', base64Image);
    form.append('language', 'cht');
    form.append('scale', 'true');
    form.append('isOverlayRequired', 'false');
    form.append('OCREngine', '2'); // Engine 2 is recommended for Asian texts

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        'apikey': process.env.OCR_SPACE_API_KEY || 'helloworld',
      },
      body: form,
    });

    const data = await response.json();

    if (data.IsErroredOnProcessing) {
      return NextResponse.json({ error: data.ErrorMessage?.[0] || 'OCR failed' }, { status: 500 });
    }

    const text = data.ParsedResults?.[0]?.ParsedText || '';

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error('OCR Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process image' }, { status: 500 });
  }
}
