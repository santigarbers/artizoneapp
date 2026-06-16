import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabase';

export type GroupMessage = {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  read_by: string[];
  created_at: string;
  sender: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
};

export function useGroupMessages(groupId: string | undefined, userId: string | undefined) {
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!groupId) return;

    fetchMessages();

    const channel = supabase
      .channel(`group_messages:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          // Fetch the full message with sender profile
          const { data } = await supabase
            .from('group_messages')
            .select('*, sender:profiles!group_messages_sender_id_fkey(id, username, avatar_url)')
            .eq('id', (payload.new as { id: string }).id)
            .single();
          if (data) {
            setMessages(prev => [...prev, data as GroupMessage]);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  // Mark messages as read whenever new messages arrive and userId is set
  useEffect(() => {
    if (groupId && userId && messages.length > 0) {
      markAsRead();
    }
  }, [messages.length, groupId, userId]);

  async function fetchMessages() {
    if (!groupId) return;
    const { data } = await supabase
      .from('group_messages')
      .select('*, sender:profiles!group_messages_sender_id_fkey(id, username, avatar_url)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });

    setMessages((data ?? []) as GroupMessage[]);
    setLoading(false);
  }

  async function sendMessage(content: string): Promise<boolean> {
    if (!groupId || !userId || !content.trim()) return false;
    const { error } = await supabase.from('group_messages').insert({
      group_id: groupId,
      sender_id: userId,
      content: content.trim(),
      read_by: [userId],
    });
    return !error;
  }

  async function markAsRead() {
    if (!groupId || !userId) return;
    await supabase.rpc('mark_group_messages_read', {
      p_group_id: groupId,
      p_user_id: userId,
    });
  }

  return { messages, loading, sendMessage, markAsRead };
}
