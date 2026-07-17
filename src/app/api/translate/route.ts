import { NextResponse } from 'next/server';
import translate from 'google-translate-api-x';
import { pinyin } from 'pinyin-pro';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Translate to Vietnamese
    const resVi = await translate(text, { to: 'vi' });
    const vietnamese = (resVi as any).text;

    // Translate to English
    const resEn = await translate(text, { to: 'en' });
    const english = (resEn as any).text;

    // Translate to Traditional Chinese
    const resZhTw = await translate(text, { to: 'zh-TW' });
    const chinese = (resZhTw as any).text;

    // Get Pinyin
    const pinyinMarks = pinyin(chinese);

    return NextResponse.json({
      vietnamese,
      english,
      chinese,
      pinyin: pinyinMarks,
    });
  } catch (error: any) {
    console.error('Translation error:', error);
    return NextResponse.json({ error: 'Failed to translate' }, { status: 500 });
  }
}
