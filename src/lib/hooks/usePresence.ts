import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

export function usePresence(userId?: string) {
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel('artizone:presence', {
      config: { presence: { key: userId } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const ids = new Set(Object.keys(channel.presenceState()));
        setOnlineIds(ids);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: userId });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { onlineIds };
}
