import OpenAI from 'openai';

let cachedClient: OpenAI | null = null;

export const getOpenAIClient = (): OpenAI => {
  if (cachedClient) {
    return cachedClient;
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OpenAI API key is not configured');
  }

  cachedClient = new OpenAI({ apiKey });
  return cachedClient;
};

export const resetOpenAIClient = () => {
  cachedClient = null;
};
