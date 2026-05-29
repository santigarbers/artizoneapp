import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

export type Profile = {
  id: string;
  username: string;
  bio: string | null;
  genres: string[] | null;
  instruments: string[] | null;
  avatar_url: string | null;
};

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setProfile(data);
        setLoading(false);
      });
  }, [userId]);

  async function updateProfile(updates: Partial<Omit<Profile, 'id'>>) {
    if (!userId) return false;
    setSaving(true);
    setError(null);

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) setError(error.message);
    else setProfile(prev => prev ? { ...prev, ...updates } : prev);

    setSaving(false);
    return !error;
  }

  return { profile, loading, saving, error, updateProfile };
}
