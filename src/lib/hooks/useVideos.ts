import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

export type Video = {
  id: string;
  profile_id: string;
  url: string;
  thumbnail: string | null;
  created_at: string;
};

export function useVideos(profileId: string | undefined) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profileId) return;
    supabase
      .from('videos')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setVideos(data ?? []);
        setLoading(false);
      });
  }, [profileId]);

  async function addVideo(url: string) {
    if (!profileId) return;
    const { data } = await supabase
      .from('videos')
      .insert({ profile_id: profileId, url })
      .select()
      .single();
    if (data) setVideos(prev => [data, ...prev]);
  }

  async function removeVideo(id: string) {
    await supabase.from('videos').delete().eq('id', id);
    setVideos(prev => prev.filter(v => v.id !== id));
  }

  return { videos, loading, addVideo, removeVideo };
}
