import { ImageAnnotatorClient } from '@google-cloud/vision';

let client: ImageAnnotatorClient | null = null;

function getClient(): ImageAnnotatorClient {
  if (!client) {
    const credentials = JSON.parse(
      process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}'
    );
    client = new ImageAnnotatorClient({ credentials });
  }
  return client;
}

export interface OcrResult {
  text: string;
  merchant?: string;
  total?: string;
  items: string[];
}

export async function extractTextFromImage(imageBuffer: Buffer): Promise<OcrResult> {
  try {
    const visionClient = getClient();
    const [result] = await visionClient.textDetection({ image: { content: imageBuffer } });
    const fullText = result.fullTextAnnotation?.text || '';

    return parseReceiptText(fullText);
  } catch (err) {
    console.error('OCR error:', err);
    // Fallback: return empty result so the classifier uses rule-based logic
    return { text: '', items: [] };
  }
}

function parseReceiptText(rawText: string): OcrResult {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  // Merchant is usually the first non-empty line
  const merchant = lines[0] || undefined;

  // Find total — look for lines containing "total" keyword followed by a number
  let total: string | undefined;
  for (const line of lines) {
    if (/total/i.test(line)) {
      const match = line.match(/[\$£€RM]?\s*[\d,]+\.?\d{0,2}/);
      if (match) {
        total = match[0].trim();
        break;
      }
    }
  }

  // Items are middle lines (skip first 1 and last 3 which tend to be header/footer)
  const items = lines.slice(1, -3).filter(l => l.length > 2 && l.length < 80);

  return { text: rawText, merchant, total, items };
}
