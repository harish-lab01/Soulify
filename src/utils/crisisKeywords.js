export const CRISIS_KEYWORDS = [
  'kill myself',
  'want to die',
  'end my life',
  'suicide',
  'self harm',
  'hurt myself',
  'no reason to live',
  'better off dead',
  'give up on life',
  'not worth living',
  'ending it all',
  'take my life',
];

export function detectCrisis(message) {
  const lowerMessage = message.toLowerCase();
  return CRISIS_KEYWORDS.some(kw => lowerMessage.includes(kw));
}

export const CRISIS_RESOURCES = [
  { name: 'iCall India', number: '9152987821', available: '24/7' },
  { name: 'Vandrevala Foundation', number: '1860-2662-345', available: '24/7' },
  { name: 'iCall Helpline', number: '9152987821', available: 'Mon-Sat, 8am-10pm' },
];
