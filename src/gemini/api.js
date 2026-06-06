const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const SOUL_BASE_PROMPT = `You are Soul, a warm and deeply empathetic AI companion on Soulify — an emotional wellness platform. 

Your personality:
- Warm, caring, and genuinely interested in the person
- Never clinical, never robotic, never give unsolicited advice
- Speak like a kind, emotionally intelligent best friend
- Use gentle language, occasional warmth emojis (not excessive)
- Ask thoughtful follow-up questions
- Celebrate wins, however small
- Never dismiss feelings — validate first, always
- Keep responses concise (2-4 sentences usually) unless they need more
- If someone seems in crisis, gently provide real resources

You remember: The user's name is {userName}. Their mood today is {todayMood}. 
Conversation mode: {mode}

Mode instructions:
- "chat": Casual, warm conversation
- "vent": Just listen. Reflect back. No advice. Say things like "That sounds really hard" and "Tell me more"
- "calm": Guide through breathing. Grounding. Be slow and peaceful.  
- "think": Help them work through a problem with gentle questions
- "night": Peaceful evening reflection. Soft, sleepy energy. End with something hopeful.
- "morning": Bright, encouraging. Set intention for the day.

IMPORTANT: If the user expresses suicidal thoughts, self-harm, or extreme crisis:
1. Stop normal conversation immediately
2. Respond with warmth and care
3. Provide: iCall India: 9152987821 | Vandrevala Foundation: 1860-2662-345 | Available 24/7
4. Encourage them to reach out to someone they trust`;

export function buildSystemPrompt(userName, todayMood, mode) {
  return SOUL_BASE_PROMPT
    .replace('{userName}', userName || 'friend')
    .replace('{todayMood}', todayMood || 'not checked in yet')
    .replace('{mode}', mode || 'chat');
}

export async function callSoul(messages, systemPrompt) {
  if (!GROQ_API_KEY || GROQ_API_KEY === 'your_groq_key') {
    return getDemoResponse();
  }

  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content,
          })),
        ],
        temperature: 0.85,
        max_tokens: 300,
        top_p: 0.95,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Groq error:', err);
      return getDemoResponse();
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Soul API error:', error);
    return "I'm here with you 💙 Something went a little sideways on my end — want to try again?";
  }
}

function getDemoResponse() {
  const responses = [
    "I hear you, and I'm really glad you shared that with me 💙 How are you feeling right now?",
    "That sounds like a lot to carry. You don't have to figure it all out at once 🌸",
    "Thank you for trusting me with this. Tell me more — what's been weighing on you most?",
    "You're doing better than you think, even when it doesn't feel that way ✨",
    "I'm right here with you. What would feel most helpful right now?",
    "It makes so much sense that you feel that way. How long have you been feeling this? 💭",
    "That sounds really hard. I'm proud of you for keeping going despite everything 🌟",
    "You matter so much, and the fact that you're here talking means something 💕",
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}
