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

const RULES: Record<ReceiptCategory, RegExp> = {
  // Tax Deductible (Personal)
  'Medical expenses':        /clinic|hospital|pharmacy|doctor|medical|dental|optik|klinik|ubat|medicine|health|specialist|lab|xray|physiotherapy/i,
  'Education fees':          /school|university|college|tuition|course|training|seminar|workshop|upskill|skill|book|stationary|education|learning/i,
  'Lifestyle & sports':      /gym|fitness|sport|yoga|swimming|badminton|tennis|golf|bicycle|equipment|equipment|lifestyle/i,
  'Childcare costs':         /nursery|daycare|childcare|kindergarten|tadika|babysitter|child|baby|pampers|formula/i,
  'Insurance & retirement':  /insurance|takaful|epf|kwsp|perkeso|socso|annuity|retirement|pension|policy|premium/i,
  'Charity donations':       /donation|charity|zakat|derma|wakaf|mosque|masjid|church|temple|ngo|fund|relief/i,
  // Business Operations
  'Travel & lodging':        /hotel|airbnb|hostel|resort|motel|flight|airasia|malindo|mas|airline|grab|uber|taxi|bus|train|toll|parking|travel|lodging/i,
  'Client entertainment':    /restaurant|cafe|dinner|lunch|banquet|event|entertainment|client|customer|hosting|catering/i,
  'Office rent & utilities':  /rent|sewa|utilities|electric|water|internet|wifi|unifi|maxis|celcom|digi|office|premis/i,
  'Software & tech':         /software|saas|subscription|microsoft|google|adobe|zoom|slack|aws|cloud|domain|hosting|app|license|tech/i,
  'Marketing & ads':         /marketing|advertising|ads|facebook|google ads|instagram|billboard|banner|flyer|printing|promotion/i,
  'Staff payroll':           /salary|gaji|payroll|staff|employee|hr|epf|socso|overtime|allowance|bonus/i,
  'Repairs & maintenance':   /repair|maintenance|servis|service|fix|plumber|electrician|air.*cond|aircon|renovation|upgrade/i,
  // Daily Personal Finance
  'Groceries':               /grocery|supermarket|tesco|giant|aeon|mydin|99|speedmart|pasar|wet market|hypermarket|jaya grocer/i,
  'Dining out':              /mcdonald|kfc|burger|pizza|mamak|nasi|makan|food|cafe|coffee|starbucks|restaurant|bistro|warung|kopitiam/i,
  'Fuel & transit':          /petrol|petronas|shell|caltex|bpetrol|fuel|diesel|grab|commuter|mrt|lrt|ktm|bus|rapid|toll/i,
  'Home bills':              /electric|tnb|water|syabas|internet|unifi|maxis|digi|celcom|astro|phone|bill|home|rumah/i,
  'Leisure & hobbies':       /cinema|movie|concert|theme park|games|hobby|travel|holiday|vacation|leisure|entertainment|shopping|mall/i,
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

  const categoryList = CATEGORIES.map((c, i) => `${i + 1}. ${c}`).join('\n');

  const prompt = `You are a receipt classifier. Classify this receipt into exactly ONE category from this list:

${categoryList}

Receipt details:
- Merchant: ${ocr.merchant || 'Unknown'}
- Items: ${ocr.items.slice(0, 10).join(', ') || 'None detected'}
- Total: ${ocr.total || 'Unknown'}
- Text: ${ocr.text.slice(0, 400)}

Rules:
- Medical, dental, pharmacy → "Medical expenses"
- School, university, course, tuition → "Education fees"
- Gym, sports equipment → "Lifestyle & sports"
- Nursery, childcare, baby items → "Childcare costs"
- Insurance, EPF, pension → "Insurance & retirement"
- Donation, zakat, charity → "Charity donations"
- Hotel, flights, business travel → "Travel & lodging"
- Business dinner, client meal → "Client entertainment"
- Office rent, utilities for business → "Office rent & utilities"
- Software, SaaS, cloud tools → "Software & tech"
- Ads, marketing spend → "Marketing & ads"
- Salary, payroll → "Staff payroll"
- Repair, maintenance services → "Repairs & maintenance"
- Supermarket, wet market → "Groceries"
- Restaurant, cafe, food delivery → "Dining out"
- Petrol, toll, public transport → "Fuel & transit"
- Home utility bills → "Home bills"
- Cinema, games, hobbies → "Leisure & hobbies"

Respond with ONLY the exact category name from the list above.`;

  const response = await client.chat.completions.create({
    model: 'openai/gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 30,
    temperature: 0,
  });

  const raw = response.choices[0]?.message?.content?.trim() || '';
  const matched = CATEGORIES.find(c => c.toLowerCase() === raw.toLowerCase());
  return matched ?? classifyWithRules(ocr);
}

function classifyWithRules(ocr: OcrResult): ReceiptCategory {
  const text = `${ocr.merchant || ''} ${ocr.items.join(' ')} ${ocr.text}`;

  for (const category of CATEGORIES) {
    if (RULES[category].test(text)) return category;
  }
  return 'Dining out'; // safe default
}
