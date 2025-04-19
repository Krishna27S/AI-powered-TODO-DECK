import { db, auth } from './firebase';
import { collection, addDoc, query, where, orderBy, getDocs } from 'firebase/firestore';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export async function sendMessage(content: string): Promise<ChatMessage> {
  if (!auth.currentUser) {
    throw new Error('User must be authenticated to send messages');
  }

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content }]
      }),
    });

    const aiResponse = await response.json();

    // Store chat history in Firebase
    await addDoc(collection(db, 'chats'), {
      userId: auth.currentUser.uid,
      message: content,
      response: aiResponse.content,
      timestamp: new Date(),
    });

    return {
      role: 'assistant',
      content: aiResponse.content,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Error in sendMessage:', error);
    throw error;
  }
}

export async function getChatHistory(): Promise<ChatMessage[]> {
  if (!auth.currentUser) {
    return [{
      role: 'assistant',
      content: "hello.",
      timestamp: new Date()
    }];
  }

  try {
    // Create the query with proper indexing
    const chatQuery = query(
      collection(db, 'chats'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('timestamp', 'asc')
    );

    const snapshot = await getDocs(chatQuery);
    const messages: ChatMessage[] = [];
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      // Add user message
      messages.push({
        role: 'user',
        content: data.message,
        timestamp: data.timestamp.toDate(),
      });
      // Add assistant response if it exists
      if (data.response) {
        messages.push({
          role: 'assistant',
          content: data.response,
          timestamp: data.timestamp.toDate(),
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