import OpenAI from 'openai';
import { ReceiptCategory, CATEGORIES } from './types';
import { OcrResult } from './ocr';

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

// Rule-based fallback keywords per category
const RULES: Record<ReceiptCategory, RegExp> = {
  'Food & Beverage': /restaurant|cafe|coffee|pizza|burger|mcdonald|kfc|subway|starbucks|grocery|supermarket|food|drink|meal|bakery|sushi|noodle|mamak|tesco|giant|aeon/i,
  'Transport': /grab|uber|lyft|taxi|bus|train|mrt|lrt|ktm|fuel|petrol|shell|petronas|parking|toll|flight|airasia|mas|airline|commuter/i,
  'Shopping': /shopping|mall|fashion|clothing|shoes|nike|adidas|h&m|zara|uniqlo|lazada|shopee|amazon|carrefour|ikea|electronics|gadget/i,
  'Bills & Utilities': /electric|water|telekom|celcom|maxis|digi|unifi|bill|utility|internet|phone|insurance|subscription|netflix|spotify/i,
  'Travel': /hotel|airbnb|booking|resort|motel|hostel|holiday|tourism|tour|travel|expedia|agoda/i,
  'Office / Work': /office|stationery|printer|ink|laptop|software|microsoft|adobe|zoom|slack|aws|cloud|hardware|supply/i,
  'Others': /.*/,
};

export async function classifyReceipt(ocr: OcrResult): Promise<ReceiptCategory> {
  if (process.env.OPENROUTER_API_KEY) {
    try {
      return await classifyWithAI(ocr);
    } catch (err) {
      console.warn('OpenRouter classification failed, falling back to rules:', err);
    }
  }
  return classifyWithRules(ocr);
}

async function classifyWithAI(ocr: OcrResult): Promise<ReceiptCategory> {
  const client = getOpenAI();

  const prompt = `You are a receipt classifier. Based on the receipt details below, classify it into exactly ONE of these categories:
${CATEGORIES.join(', ')}

Receipt details:
- Merchant: ${ocr.merchant || 'Unknown'}
- Items: ${ocr.items.slice(0, 10).join(', ') || 'None detected'}
- Total: ${ocr.total || 'Unknown'}
- Raw text excerpt: ${ocr.text.slice(0, 300)}

Respond with ONLY the category name, nothing else.`;

  const response = await client.chat.completions.create({
    model: 'openai/gpt-oss-120b:free',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 20,
    temperature: 0,
  });

  const raw = response.choices[0]?.message?.content?.trim() || '';
  const matched = CATEGORIES.find(c => c.toLowerCase() === raw.toLowerCase());
  return matched ?? classifyWithRules(ocr);
}

function classifyWithRules(ocr: OcrResult): ReceiptCategory {
  const text = `${ocr.merchant || ''} ${ocr.items.join(' ')} ${ocr.text}`.toLowerCase();

  const orderedCategories: ReceiptCategory[] = [
    'Food & Beverage',
    'Transport',
    'Shopping',
    'Bills & Utilities',
    'Travel',
    'Office / Work',
    'Others',
  ];

  for (const category of orderedCategories) {
    if (category !== 'Others' && RULES[category].test(text)) {
      return category;
    }
  }
  return 'Others';
}
