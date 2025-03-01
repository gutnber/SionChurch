import { toast } from 'react-hot-toast';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const callDeepSeekAPI = async (messages: Message[]) => {
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sk-b266b9a9f1d143acb5bac4eef1e1be12'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling DeepSeek API:', error);
    toast.error('Failed to get a response. Please try again later.');
    throw error;
  }
};