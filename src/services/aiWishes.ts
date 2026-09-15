import { RelationshipType } from '../types/birthday';

export type WishTone = 'heartfelt' | 'funny' | 'poetic' | 'short_sms' | 'formal';

interface WishTemplateOptions {
  name: string;
  relationship: RelationshipType;
  tone: WishTone;
  turningAge?: number;
}

const WISH_TEMPLATES: Record<WishTone, Record<RelationshipType, string[]>> = {
  heartfelt: {
    family: [
      "Happy Birthday, {name}! Having you in my family is one of life's greatest blessings. May this year bring you abundant joy, health, and peace. 🎂❤️",
      "Dearest {name}, on your special day, I want to remind you how much you are cherished. Thank you for always bringing love and warmth into our lives. Have the happiest birthday!",
    ],
    friend: [
      "Happy Birthday to my incredible friend {name}! You make every memory brighter and every challenge easier. Wishing you a year packed with laughter, adventures, and dreams fulfilled! 🎉✨",
      "{name}, so grateful for our friendship and all the unforgettable moments we've shared. May your year ahead be as wonderful as you are! 🥳",
    ],
    love: [
      "Happy Birthday to the love of my life, {name}. Every day with you is a gift, and today I celebrate the incredible person you are. Here's to another beautiful year of love and memories together. 💖✨",
      "To my favorite human in the whole world, {name}—happy birthday! Thank you for filling my life with happiness and magic. Love you always! 🌹",
    ],
    work: [
      "Wishing you a very Happy Birthday, {name}! It's a genuine pleasure collaborating with you. May this upcoming year bring you continued professional success and personal joy. 🌟",
    ],
    other: [
      "Happy Birthday, {name}! Wishing you a wonderful celebration surrounded by the people who mean the most to you. May all your aspirations turn into reality this year! 🎂",
    ]
  },
  funny: {
    family: [
      "Happy Birthday, {name}! Don't worry about getting older, wisdom comes with age... though in your case, we might need to wait a few more years! Just kidding, love you lots! 😂🎂",
      "Happy Birthday, {name}! Another year older, but definitely not any wiser! Let's eat lots of cake before anyone counts the calories. 🍰",
    ],
    friend: [
      "Happy Birthday, {name}! I promise not to reveal how old you actually are... as long as you give me the largest slice of cake! Cheers to another year of terrible decisions together! 🍻🎉",
      "A true friend remembers your birthday, but conveniently forgets your age. Happy Birthday, {name}! 😜",
    ],
    love: [
      "Happy Birthday to someone who is smart, funny, and incredibly lucky to have me! Love you to pieces, {name}! 😂❤️",
    ],
    work: [
      "Happy Birthday, {name}! Take today off... or at least spend 90% of it pretending to look busy while eating snacks! 💼🍩",
    ],
    other: [
      "Happy Birthday, {name}! May your Facebook wall be filled with messages from people you haven't spoken to in 10 years! 🎈",
    ]
  },
  poetic: {
    family: [
      "Like roots that ground a flourishing tree, your presence brings strength and grace to our family. Wishing you a luminous birthday, {name}. 🌿✨",
    ],
    friend: [
      "Time weaves precious stories, and the chapters written with you are my favorite. May your days ahead shine with laughter and golden light. Happy Birthday, {name}. 🌟",
    ],
    love: [
      "In the tapestry of life, your love is the brightest thread. Celebrating the day the world was gifted with your soul. Happy Birthday, my love. 💫🌙",
    ],
    work: [
      "May this milestone mark new horizons of inspiration and triumph. Wishing you a serene and triumphant year ahead, {name}. 🧭",
    ],
    other: [
      "May the year ahead unfold like petals of a fresh blossom, bringing tranquility and discovery. Happy Birthday, {name}. 🌸",
    ]
  },
  short_sms: {
    family: [
      "🎂 Happy Birthday {name}! Wishing you the best day ever! Love you lots! ❤️",
    ],
    friend: [
      "Happy Birthday {name}! 🎉 Hope you have an epic celebration today! Let's catch up soon! 🥳",
    ],
    love: [
      "Happy Birthday my sweetheart {name}! 💖 Can't wait to celebrate together tonight! 🥰",
    ],
    work: [
      "Happy Birthday {name}! Wishing you a fantastic day and great year ahead! 🎂✨",
    ],
    other: [
      "Wishing you a very Happy Birthday, {name}! Have an awesome year ahead! 🎈",
    ]
  },
  formal: {
    family: [
      "Warmest birthday wishes to you, {name}. May this auspicious day usher in good health, peace of mind, and continued prosperity.",
    ],
    friend: [
      "Wishing you a very happy and fulfilling birthday, {name}. May you achieve all your personal and professional milestones in the coming year.",
    ],
    love: [
      "Wishing you the happiest of birthdays, {name}. Thank you for your unwavering companionship and support throughout our journey.",
    ],
    work: [
      "Dear {name}, wishing you a very happy birthday. On behalf of the entire team, thank you for your leadership and contributions. Have a wonderful celebration.",
    ],
    other: [
      "Wishing you a happy and joyful birthday, {name}. May the year ahead be filled with opportunities and well-deserved achievements.",
    ]
  }
};

/**
 * Generate wishes locally with zero latency (instant feel on low-end phones)
 */
export function generateLocalWish(options: WishTemplateOptions): string {
  const { name, relationship, tone } = options;
  const toneTemplates = WISH_TEMPLATES[tone] || WISH_TEMPLATES.heartfelt;
  const templates = toneTemplates[relationship] || toneTemplates.other;
  const template = templates[Math.floor(Math.random() * templates.length)];
  return template.replace(/\{name\}/g, name);
}

/**
 * Optional Gemini API caller if user configures their Google AI key
 */
export async function generateGeminiWish(
  options: WishTemplateOptions,
  apiKey?: string
): Promise<string> {
  if (!apiKey) {
    return generateLocalWish(options);
  }

  try {
    const prompt = `Write a ${options.tone} birthday wish for my ${options.relationship} named "${options.name}". Keep it natural, warm, and engaging. Avoid cliché placeholders. Include appropriate emojis. Output only the message text.`;
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 200, temperature: 0.8 }
      })
    });

    if (response.ok) {
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && text.trim().length > 0) {
        return text.trim();
      }
    }
  } catch (error) {
    console.warn('[AI] Gemini fetch error, falling back to local synthesis:', error);
  }

  return generateLocalWish(options);
}
