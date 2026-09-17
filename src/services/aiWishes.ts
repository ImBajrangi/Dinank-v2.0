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
    student: [
      "Happy Birthday, {name}! 🎓 May this year bring you brilliant academic success, deep learning, and immense joy. Keep dreaming big and reaching new heights! 🎂✨",
      "Wishing you a very Happy Birthday, {name}! May your hard work bear wonderful fruits and your journey ahead be filled with accomplishments and wisdom. 🌟📚",
    ],
    family: [
      "Happy Birthday, {name}! Having you in my family is one of life's greatest blessings. May this year bring you abundant joy, health, and peace. 🎂❤️",
      "Dearest {name}, on your special day, I want to remind you how much you are cherished. Thank you for always bringing love and warmth into our lives. Have the happiest birthday! 💐✨",
    ],
    friend: [
      "Happy Birthday to my incredible friend {name}! You make every memory brighter and every challenge easier. Wishing you a year packed with laughter, adventures, and dreams fulfilled! 🎉🥳",
      "{name}, so grateful for our friendship and all the unforgettable moments we've shared. May your year ahead be as wonderful as you are! 🍰✨",
    ],
    work: [
      "Wishing you a very Happy Birthday, {name}! It's a genuine pleasure collaborating with you. May this upcoming year bring you continued professional success and personal joy. 🌟🎂",
    ],
    other: [
      "Happy Birthday, {name}! Wishing you a wonderful celebration surrounded by the people who mean the most to you. May all your aspirations turn into reality this year! 🎂🎉",
    ]
  },
  funny: {
    student: [
      "Happy Birthday, {name}! May your attendance stay 100%, assignments do themselves, and exams be super easy! Enjoy your special day! 🍕🎉",
      "Happy Birthday, {name}! No homework excuses valid today, but definitely eat 100% of the birthday cake! 🎂🍰",
    ],
    family: [
      "Happy Birthday, {name}! Don't worry about getting older, wisdom comes with age... though in your case, we might need to wait a few more years! Just kidding, love you lots! 😂🎂",
      "Happy Birthday, {name}! Another year older, but definitely not any wiser! Let's eat lots of cake before anyone counts the calories. 🍰🥳",
    ],
    friend: [
      "Happy Birthday, {name}! I promise not to reveal how old you actually are... as long as you give me the largest slice of cake! Cheers to another year of fun adventures together! 🍻🎉",
      "A true friend remembers your birthday, but conveniently forgets your age. Happy Birthday, {name}! 😊🎂",
    ],
    work: [
      "Happy Birthday, {name}! Take today off... or at least spend 90% of it pretending to look busy while eating snacks! 💼🍩",
    ],
    other: [
      "Happy Birthday, {name}! May your social feeds be flooded with birthday wishes from people you haven't seen in years! 🎈🎉",
    ]
  },
  poetic: {
    student: [
      "Like a seedling reaching for the sky, may your thirst for knowledge illuminate your path to greatness. Happy Birthday, {name}. 🌿📖✨",
    ],
    family: [
      "Like roots that ground a flourishing tree, your presence brings strength and grace to our family. Wishing you a luminous birthday, {name}. 🌿✨❤️",
    ],
    friend: [
      "Time weaves precious stories, and the chapters written with you are my favorite. May your days ahead shine with laughter and golden light. Happy Birthday, {name}. 🌟✨",
    ],
    work: [
      "May this milestone mark new horizons of inspiration and triumph. Wishing you a serene and triumphant year ahead, {name}. 🧭🌟",
    ],
    other: [
      "May the year ahead unfold like petals of a fresh blossom, bringing tranquility and discovery. Happy Birthday, {name}. 🌸✨",
    ]
  },
  short_sms: {
    student: [
      "Happy Birthday {name}! 🎓 Wishing you huge success in your studies and a bright year ahead! 🎂✨",
    ],
    family: [
      "Happy Birthday {name}! 🎂 Wishing you the best day ever! Love you lots! ❤️",
    ],
    friend: [
      "Happy Birthday {name}! 🎉 Hope you have an epic celebration today! Let's catch up soon! 🥳🍰",
    ],
    work: [
      "Happy Birthday {name}! 🎂 Wishing you a fantastic day and great year ahead! ✨",
    ],
    other: [
      "Wishing you a very Happy Birthday, {name}! Have an awesome year ahead! 🎈🎉",
    ]
  },
  formal: {
    student: [
      "Dear {name}, heartfelt birthday greetings to you. May this academic year bring you immense knowledge, exemplary discipline, and stellar achievements.",
    ],
    family: [
      "Warmest birthday wishes to you, {name}. May this auspicious day usher in good health, peace of mind, and continued prosperity.",
    ],
    friend: [
      "Wishing you a very happy and fulfilling birthday, {name}. May you achieve all your personal and professional milestones in the coming year.",
    ],
    work: [
      "Dear {name}, wishing you a very happy birthday. On behalf of the entire team, thank you for your leadership and contributions. Have a wonderful celebration.",
    ],
    other: [
      "Wishing you a happy and joyful birthday, {name}. May the year ahead be filled with opportunities and well-deserved achievements.",
    ]
  }
};

export interface GenerateWishOptions {
  name: string;
  relationship: RelationshipType;
  tone: WishTone;
  turningAge?: number;
  groupClass?: string;
  section?: string;
  session?: string;
  senderName?: string;
  customPrompt?: string;
  geminiApiKey?: string;
}

/**
 * Smart prompt-aware generative synthesis
 */
export function generateLocalWish(options: GenerateWishOptions): string {
  const { name, relationship, tone, customPrompt, senderName, groupClass, section } = options;
  const promptLower = (customPrompt || '').toLowerCase();
  const sender = senderName ? `\n\n- ${senderName}` : '';
  const classInfo = [groupClass, section ? `Sec ${section}` : null].filter(Boolean).join(' - ');

  // 1. Hindi / Hinglish prompt detection
  if (promptLower.includes('hindi') || promptLower.includes('hinglish')) {
    if (relationship === 'student') {
      return `प्रिय *${name}*, जन्मदिन की हार्दिक शुभकामनाएं! 🎂🎓\n\nईश्वर से प्रार्थना है कि यह वर्ष आपकी पढ़ाई और जीवन में अपार सफलता और ज्ञान लेकर आए। खूब मन लगाकर पढ़ें और आगे बढ़ें! ✨🎉${sender}`;
    }
    if (relationship === 'family') {
      return `जन्मदिन की ढेर सारी बधाई और प्यार, *${name}*! 🎂❤️\n\nभगवान आपको उत्तम स्वास्थ्य, लंबी उम्र और ढेर सारी खुशियाँ दें। आप हमेशा ऐसे ही मुस्कुराते रहें! 💐${sender}`;
    }
    if (relationship === 'friend') {
      return `जन्मदिन मुबारक हो मेरे प्यारे दोस्त *${name}*! 🎉🥳\n\nआज का दिन तुम्हारे लिए ढेर सारी मस्ती और खुशियां लेकर आए। पार्टी कब दे रहे हो भाई? 🍰✨${sender}`;
    }
    return `जन्मदिन की बहुत-बहुत शुभकामनाएं, *${name}*! 🎂🎉\n\nईश्वर आपके जीवन में सुख, शांति और समृद्धि बनाए रखे।${sender}`;
  }

  // 2. Shayari / Poetry prompt detection
  if (promptLower.includes('shayari') || promptLower.includes('poem') || tone === 'poetic') {
    if (relationship === 'student') {
      return `हो पूरी दिल की हर ख्वाहिश आपकी, 🌟\nमिले खुशियों का जहां आपको, 📚\nअगर आप मांगें आसमां का एक सितारा, ✨\nतो खुदा दे दे सारा आसमां आपको। 🎓\n\nजन्मदिन की ढेर सारी शुभकामनाएं, *${name}*! 🎂🎉${sender}`;
    }
    if (relationship === 'family') {
      return `सूरज की किरणें तेज दे आपको, ☀️\nखिलते हुए फूल खुशबू दे आपको, 🌸\nहम जो देंगे वो भी कम होगा, ❤️\nदेने वाला हर खुशी दे आपको। 🎂\n\nHappy Birthday dear *${name}*! 🎉${sender}`;
    }
    return `दुआ है कि कामयाबी के हर शिखर पर आपका नाम हो, 🌟\nकदम-कदम पर दुनिया का सलाम हो, 💫\nहिम्मत से हर मुश्किल का सामना करना, 🎈\nहमारी दुआ है कि वक्त भी एक दिन आपका गुलाम हो। 👑\n\nHappy Birthday *${name}*! 🎂🎉${sender}`;
  }

  // 3. Academic & Marks Motivation prompt detection
  if (promptLower.includes('academic') || promptLower.includes('marks') || promptLower.includes('study') || promptLower.includes('exam')) {
    return `Dear *${name}*, wishing you a very Happy Birthday! 🎓🎂\n\nMay this year reward all your dedication with top scores, deep wisdom, and stellar achievements${classInfo ? ` in *${classInfo}*` : ''}. Keep aiming high and inspiring everyone around you! 🌟📚${sender}`;
  }

  // 4. Short / WhatsApp Status format
  if (promptLower.includes('short') || tone === 'short_sms') {
    if (relationship === 'student') {
      return `🎂 Happy Birthday ${name}! Wishing you huge academic success and a fantastic year ahead! 🎓✨`;
    }
    return `🎂 Happy Birthday ${name}! Wishing you joy, good health, and an amazing year ahead! 🎉🥳`;
  }

  // 5. Tone templates standard selection
  const toneTemplates = WISH_TEMPLATES[tone] || WISH_TEMPLATES.heartfelt;
  const templates = toneTemplates[relationship] || toneTemplates.other;
  const template = templates[Math.floor(Math.random() * templates.length)];
  let result = template.replace(/\{name\}/g, name);
  if (senderName) {
    result += `\n\nBest wishes,\n*${senderName}*`;
  }
  return result;
}

/**
 * Generate highly customized AI wish using Gemini API (if key set) or smart generative director
 */
export async function generateAIWish(options: GenerateWishOptions): Promise<string> {
  const {
    name,
    relationship,
    tone,
    groupClass,
    section,
    session,
    senderName,
    customPrompt,
    geminiApiKey,
  } = options;

  if (geminiApiKey && geminiApiKey.trim().length > 0) {
    const classInfo = [groupClass, section ? `Sec ${section}` : null, session ? `Batch ${session}` : null]
      .filter(Boolean)
      .join(', ');

    const systemInstruction =
      "You are an expert AI birthday wish writer. Generate a warm, personalized, and engaging birthday message. Do not include markdown headers or greetings to the user. Include celebratory emojis suitable for a festive greeting. Output only the message text.";

    const userPrompt = customPrompt && customPrompt.trim().length > 0
      ? `Write a birthday wish for ${name} (${relationship}${classInfo ? ` - ${classInfo}` : ''}).
Tone: ${tone}.
Custom instructions from sender: "${customPrompt.trim()}".
Sender name: ${senderName || 'Well-wisher'}.
Keep it natural, genuine, warm, and include fitting celebratory emojis. Output ONLY the message text.`
      : `Write a ${tone} birthday wish for my ${relationship} named "${name}"${classInfo ? ` who is in ${classInfo}` : ''}.
Sender name: ${senderName || 'Well-wisher'}.
Keep it natural, warm, and engaging with celebratory emojis. Output ONLY the message text.`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey.trim()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }] }],
            generationConfig: { maxOutputTokens: 200, temperature: 0.8 },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim().length > 0) {
          return text.trim().replace(/^["']|["']$/g, '');
        }
      }
    } catch (geminiError) {
      console.warn('[AI] Gemini fetch fallback:', geminiError);
    }
  }

  // Fast smart generative director fallback
  return generateLocalWish(options);
}
