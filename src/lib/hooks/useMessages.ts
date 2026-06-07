import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabase';

export type Message = {
  id: string;
  connection_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
};

export function useMessages(connectionId: string | undefined, userId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!connectionId) return;

    supabase
      .from('messages')
      .select('*')
      .eq('connection_id', connectionId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setMessages(data ?? []);
        setLoading(false);
      });

    // Realtime
    const channel = supabase
      .channel(`messages:${connectionId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `connection_id=eq.${connectionId}` },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [connectionId]);

  async function sendMessage(content: string) {
    if (!connectionId || !userId || !content.trim()) return false;
    const { error } = await supabase.from('messages').insert({
      connection_id: connectionId,
      sender_id: userId,
      content: content.trim(),
    });
    return !error;
  }

  async function markAsRead() {
    if (!connectionId || !userId) return;
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('connection_id', connectionId)
      .neq('sender_id', userId)
      .eq('read', false);
  }

  return { messages, loading, sendMessage, markAsRead };
}
