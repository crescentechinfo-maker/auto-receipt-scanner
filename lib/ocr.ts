// OCR removed — AI vision model handles reading + classification in one step
// See lib/classifier.ts → classifyReceiptImage()

export interface OcrResult {
  text: string;
  merchant?: string;
  total?: string;
  items: string[];
}

export async function extractTextFromImage(_imageBuffer: Buffer): Promise<OcrResult> {
  return { text: '', items: [] };
}
