import { ImageAnnotatorClient } from '@google-cloud/vision';

let client: ImageAnnotatorClient | null = null;

function getClient(): ImageAnnotatorClient {
  if (!client) {
    const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!raw || raw.startsWith('PASTE_')) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not configured');
    }
    const credentials = JSON.parse(raw);
    client = new ImageAnnotatorClient({ credentials });
  }
  return client;
}

export interface OcrResult {
  text: string;
  merchant?: string;
  total?: string;
  items: string[];
  ocrError?: string;
}

export async function extractTextFromImage(imageBuffer: Buffer): Promise<OcrResult> {
  try {
    const visionClient = getClient();
    const [result] = await visionClient.textDetection({
      image: { content: imageBuffer.toString('base64') },
    });

    const fullText = result.fullTextAnnotation?.text || '';
    console.log('[OCR] Extracted text length:', fullText.length);
    console.log('[OCR] First 200 chars:', fullText.slice(0, 200));

    if (!fullText) {
      return { text: '', items: [], ocrError: 'No text detected in image' };
    }

    return parseReceiptText(fullText);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[OCR] Error:', msg);
    return { text: '', items: [], ocrError: msg };
  }
}

function parseReceiptText(rawText: string): OcrResult {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  const merchant = lines[0] || undefined;

  let total: string | undefined;
  for (const line of lines) {
    if (/total|jumlah|amount/i.test(line)) {
      const match = line.match(/[\$£€RM]?\s*[\d,]+\.?\d{0,2}/);
      if (match) { total = match[0].trim(); break; }
    }
  }

  const items = lines.slice(1, -3).filter(l => l.length > 2 && l.length < 80);

  return { text: rawText, merchant, total, items };
}
