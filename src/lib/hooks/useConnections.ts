import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

export type Connection = {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
};

export type ConnectionWithProfile = Connection & {
  sender: { id: string; username: string; avatar_url: string | null };
  receiver: { id: string; username: string; avatar_url: string | null };
};

export function useConnections(userId: string | undefined) {
  const [connections, setConnections] = useState<ConnectionWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetchConnections();
  }, [userId]);

  async function fetchConnections() {
    if (!userId) return;
    const { data } = await supabase
      .from('connections')
      .select(`
        *,
        sender:profiles!connections_sender_id_fkey(id, username, avatar_url),
        receiver:profiles!connections_receiver_id_fkey(id, username, avatar_url)
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    setConnections((data as ConnectionWithProfile[]) ?? []);
    setLoading(false);
  }

  async function sendConnection(receiverId: string) {
    const { data, error } = await supabase
      .from('connections')
      .insert({ sender_id: userId, receiver_id: receiverId })
      .select(`
        *,
        sender:profiles!connections_sender_id_fkey(id, username, avatar_url),
        receiver:profiles!connections_receiver_id_fkey(id, username, avatar_url)
      `)
      .single();

    if (!error && data) {
      setConnections(prev => [data as ConnectionWithProfile, ...prev]);
    }
    return { error };
  }

  async function updateStatus(connectionId: string, status: 'accepted' | 'rejected') {
    const { error } = await supabase
      .from('connections')
      .update({ status })
      .eq('id', connectionId);

    if (!error) {
      setConnections(prev =>
        prev.map(c => c.id === connectionId ? { ...c, status } : c)
      );
    }
    return { error };
  }

  function getConnectionWith(otherUserId: string) {
    return connections.find(
      c => c.sender_id === otherUserId || c.receiver_id === otherUserId
    ) ?? null;
  }

  const pending = connections.filter(
    c => c.status === 'pending' && c.receiver_id === userId
  );

  const accepted = connections.filter(c => c.status === 'accepted');

  return { connections, pending, accepted, loading, sendConnection, updateStatus, getConnectionWith, fetchConnections };
}
