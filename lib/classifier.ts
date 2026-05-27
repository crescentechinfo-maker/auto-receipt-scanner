import OpenAI from 'openai';
import { ReceiptCategory, CATEGORIES } from './types';

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'ReceiptScan',
      },
    });
  }
  return openai;
}

export interface AIReceiptResult {
  category: ReceiptCategory;
  merchant?: string;
  total?: string;
}

const CATEGORY_PROMPT = `You are a receipt classifier. Look at this receipt image carefully.

Classify it into exactly ONE of these categories:
${CATEGORIES.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Rules:
- Medical, dental, pharmacy, clinic, hospital → "Medical expenses"
- School, university, course, tuition, books → "Education fees"
- Gym, sports, fitness, yoga, badminton → "Lifestyle & sports"
- Nursery, daycare, kindergarten, baby items → "Childcare costs"
- Insurance, takaful, EPF, KWSP, pension → "Insurance & retirement"
- Donation, zakat, charity, church, mosque → "Charity donations"
- Hotel, flight, Grab, taxi, toll, parking (business) → "Travel & lodging"
- Restaurant, dinner with clients, catering → "Client entertainment"
- Office rent, electricity, internet for business → "Office rent & utilities"
- Software, SaaS, cloud, Microsoft, Adobe, AWS → "Software & tech"
- Facebook ads, Google ads, marketing, printing → "Marketing & ads"
- Salary, payroll, staff wages → "Staff payroll"
- Repair, maintenance, servicing, renovation → "Repairs & maintenance"
- Supermarket, hypermarket, wet market, grocery → "Groceries"
- Restaurant, cafe, mamak, food court, food delivery → "Dining out"
- Petrol, fuel, Grab, bus, MRT, LRT, toll (personal) → "Fuel & transit"
- Electric bill, water bill, phone bill, internet bill → "Home bills"
- Cinema, games, hobbies, shopping, leisure → "Leisure & hobbies"

Also extract:
- Merchant name (store/company name at top of receipt)
- Total amount paid

Respond in this exact JSON format only:
{"category":"<category name>","merchant":"<merchant name or null>","total":"<amount or null>"}`;

export async function classifyReceiptImage(
  imageBuffer: Buffer,
  mimeType: string
): Promise<AIReceiptResult> {
  if (!process.env.OPENROUTER_API_KEY) {
    console.warn('[AI] No OPENROUTER_API_KEY — using default category');
    return { category: 'Dining out' };
  }

  try {
    const client = getOpenAI();
    const base64 = imageBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const response = await client.chat.completions.create({
      model: 'google/gemini-2.0-flash-001',
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: dataUrl } },
          { type: 'text', text: CATEGORY_PROMPT },
        ],
      }],
      max_tokens: 80,
      temperature: 0,
    });

    const raw = response.choices[0]?.message?.content?.trim() || '';
    console.log('[AI] Raw response:', raw);

    // Parse JSON response
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response: ' + raw);

    const parsed = JSON.parse(jsonMatch[0]);
    const category = CATEGORIES.find(
      c => c.toLowerCase() === (parsed.category || '').toLowerCase()
    ) ?? 'Dining out';

    console.log('[AI] Category:', category, '| Merchant:', parsed.merchant, '| Total:', parsed.total);

    return {
      category,
      merchant: parsed.merchant && parsed.merchant !== 'null' ? parsed.merchant : undefined,
      total: parsed.total && parsed.total !== 'null' ? parsed.total : undefined,
    };
  } catch (err) {
    console.error('[AI] Classification error:', err instanceof Error ? err.message : err);
    return { category: 'Dining out' };
  }
}
