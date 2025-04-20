import { db, auth } from './firebase';
import { collection, addDoc, query, where, orderBy, getDocs } from 'firebase/firestore';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export async function sendMessageWithHistory(history: ChatMessage[]): Promise<ChatMessage> {
  if (!auth.currentUser) {
    throw new Error('User must be authenticated to send messages');
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const messages = history.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });

    const aiResponse = await response.json();

    if (!response.ok) {
      throw new Error(aiResponse.error || 'Failed to fetch response from AI');
    }

    const now = new Date();
    await addDoc(collection(db, 'chats'), {
      userId: auth.currentUser.uid,
      message: history[history.length - 1].content,
      response: aiResponse.content,
      timestamp: now,
    });

    return {
      role: 'assistant',
      content: aiResponse.content,
      timestamp: now,
    };
  } catch (error) {
    console.error('Error in sendMessageWithHistory:', error);
    throw error;
  }
}

export async function getChatHistory(): Promise<ChatMessage[]> {
  if (!auth.currentUser) {
    return [{
      role: 'assistant',
      content: "hello",
      timestamp: new Date()
    }];
  }

  try {
    const chatQuery = query(
      collection(db, 'chats'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('timestamp', 'asc')
    );

    const snapshot = await getDocs(chatQuery);
    const messages: ChatMessage[] = [];

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const timestamp = data.timestamp.toDate();
      messages.push({
        role: 'user',
        content: data.message,
        timestamp
      });
      if (data.response) {
        messages.push({
          role: 'assistant',
          content: data.response,
          timestamp
        });
      }
    });

    return messages.length > 0 ? messages : [{
      role: 'assistant',
      content: "Hi there! How can I help you today?",
      timestamp: new Date()
    }];
  } catch (error) {
    console.error('Error fetching chat history:', error);
    throw error;
  }
}
