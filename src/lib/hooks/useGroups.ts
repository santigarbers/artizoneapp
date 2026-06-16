import { useEffect, useRef, useState } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../supabase';

export type GroupMemberPreview = {
  user_id: string;
  username: string;
  avatar_url: string | null;
};

export type Group = {
  group_id: string;
  group_name: string;
  group_avatar_url: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  members_preview: GroupMemberPreview[];
};

export function useGroups(userId: string | undefined) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!userId) return;
    fetchGroups();

    const channel = supabase
      .channel(`group_messages:user:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'group_messages' },
        () => { fetchGroups(); }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'group_messages' },
        () => { fetchGroups(); }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  async function fetchGroups() {
    if (!userId) return;
    const { data } = await supabase.rpc('get_group_conversations', { p_user_id: userId });
    if (data) {
      setGroups(
        (data as any[]).map(row => ({
          ...row,
          unread_count: Number(row.unread_count ?? 0),
          members_preview: (row.members_preview ?? []) as GroupMemberPreview[],
        }))
      );
    }
    setLoading(false);
  }

  async function createGroup(
    name: string,
    memberIds: string[],
    avatarUri?: string,
  ): Promise<{ groupId?: string; error?: string }> {
    if (!userId || !name.trim()) return { error: 'Nombre inválido' };

    const { data: groupId, error } = await supabase.rpc('create_group_with_members', {
      p_name: name.trim(),
      p_member_ids: memberIds,
    });

    if (error || !groupId) return { error: error?.message ?? 'Error al crear el grupo' };

    // Upload avatar if provided
    if (avatarUri) {
      try {
        const ext = avatarUri.split('.').pop()?.toLowerCase() ?? 'jpg';
        const path = `groups/${groupId as string}.${ext}`;
        const base64 = await FileSystem.readAsStringAsync(avatarUri, { encoding: 'base64' as any });
        const byteArray = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, byteArray, { contentType: `image/${ext}`, upsert: true });
        if (!uploadError) {
          const { data } = supabase.storage.from('avatars').getPublicUrl(path);
          await supabase.from('groups').update({ avatar_url: data.publicUrl }).eq('id', groupId);
        }
      } catch {
        // Avatar upload failed silently — group still created
      }
    }

    await fetchGroups();
    return { groupId: groupId as string };
  }

  return { groups, loading, refetch: fetchGroups, createGroup };
}
