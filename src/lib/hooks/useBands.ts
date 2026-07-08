import { useCallback, useEffect, useState } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../supabase';

export type Band = {
  id: string;
  name: string;
  bio: string | null;
  genres: string[] | null;
  formed_year: number | null;
  city: string | null;
  neighborhood: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  status: 'active' | 'hiatus' | 'disbanded';
  is_solo_project: boolean;
  created_by: string;
  created_at: string;
};

export type BandMember = {
  id: string;
  band_id: string;
  profile_id: string;
  role: 'leader' | 'member' | 'ex_member' | 'guest';
  instruments: string[] | null;
  joined_at: string;
  left_at: string | null;
  status: 'active' | 'invited' | 'ex';
  profile: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
};

export type NewBandInput = {
  name: string;
  bio?: string | null;
  genres?: string[] | null;
  formed_year?: number | null;
  city?: string | null;
  neighborhood?: string | null;
};

export type BandInvitation = {
  id: string;
  band_id: string;
  inviter_id: string;
  invitee_id: string;
  proposed_role: string | null;
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  invitee: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
};

async function uploadBandImage(bandId: string, uri: string, kind: 'avatar' | 'cover') {
  const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `bands/${bandId}/${kind}.${ext}`;
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' as any });
  const byteArray = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, byteArray, { contentType: `image/${ext}`, upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}

export function useMyBands(userId: string | undefined) {
  const [bands, setBands] = useState<(Band & { my_role: BandMember['role'] })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyBands = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('band_members')
      .select('role, band:bands(*)')
      .eq('profile_id', userId)
      .eq('status', 'active');

    if (!error && data) {
      setBands(
        (data as any[])
          .filter(row => row.band)
          .map(row => ({ ...row.band, my_role: row.role }))
      );
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchMyBands();
  }, [fetchMyBands]);

  return { bands, loading, refetch: fetchMyBands };
}

export function useCreateBand(userId: string | undefined) {
  const [creating, setCreating] = useState(false);

  async function createBand(
    input: NewBandInput,
    avatarUri?: string,
    coverUri?: string
  ): Promise<{ bandId?: string; error?: string }> {
    if (!userId || !input.name.trim()) return { error: 'El nombre de la banda es obligatorio' };

    setCreating(true);
    const { data: band, error } = await supabase
      .from('bands')
      .insert({
        name: input.name.trim(),
        bio: input.bio?.trim() || null,
        genres: input.genres?.length ? input.genres : null,
        formed_year: input.formed_year ?? null,
        city: input.city?.trim() || null,
        neighborhood: input.neighborhood?.trim() || null,
        created_by: userId,
      })
      .select('id')
      .single();

    if (error || !band) {
      setCreating(false);
      return { error: error?.message ?? 'Error al crear la banda' };
    }

    const updates: Record<string, string> = {};
    try {
      if (avatarUri) updates.avatar_url = await uploadBandImage(band.id, avatarUri, 'avatar');
      if (coverUri) updates.cover_url = await uploadBandImage(band.id, coverUri, 'cover');
      if (Object.keys(updates).length > 0) {
        await supabase.from('bands').update(updates).eq('id', band.id);
      }
    } catch {
      // La banda ya existe; las imágenes se pueden reintentar después
    }

    setCreating(false);
    return { bandId: band.id as string };
  }

  return { createBand, creating };
}

export function useBand(bandId: string | undefined) {
  const [band, setBand] = useState<Band | null>(null);
  const [members, setMembers] = useState<BandMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!bandId) return;
    setLoading(true);
    setError(null);

    const [{ data: bandData, error: bandError }, { data: memberData }] = await Promise.all([
      supabase.from('bands').select('*').eq('id', bandId).single(),
      supabase
        .from('band_members')
        .select('*, profile:profiles(username, display_name, avatar_url)')
        .eq('band_id', bandId)
        .eq('status', 'active')
        .order('joined_at', { ascending: true }),
    ]);

    if (bandError) setError('No se pudo cargar la banda.');
    else setBand(bandData);
    setMembers((memberData as any[]) ?? []);
    setLoading(false);
  }, [bandId]);

  useEffect(() => {
    load();
  }, [load]);

  return { band, members, loading, error, refetch: load };
}

export type ReceivedBandInvitation = {
  id: string;
  proposed_role: string | null;
  message: string | null;
  band: Pick<Band, 'id' | 'name' | 'avatar_url'>;
  inviter: { username: string; display_name: string | null };
};

export function useMyBandInvitations(userId: string | undefined) {
  const [invitations, setInvitations] = useState<ReceivedBandInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('band_invitations')
      .select('id, proposed_role, message, band:bands(id, name, avatar_url), inviter:profiles!band_invitations_inviter_id_fkey(username, display_name)')
      .eq('invitee_id', userId)
      .eq('status', 'pending');
    setInvitations((data as any[]) ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  async function accept(invitationId: string) {
    setResponding(true);
    const { error } = await supabase.rpc('accept_band_invitation', { p_invitation_id: invitationId });
    if (!error) await load();
    setResponding(false);
    return { error: error?.message };
  }

  async function reject(invitationId: string) {
    setResponding(true);
    const { error } = await supabase
      .from('band_invitations')
      .update({ status: 'rejected' })
      .eq('id', invitationId);
    if (!error) await load();
    setResponding(false);
    return { error: error?.message };
  }

  return { invitations, loading, responding, accept, reject, refetch: load };
}

export function useBandManagement(bandId: string | undefined, userId: string | undefined) {
  const [band, setBand] = useState<Band | null>(null);
  const [activeMembers, setActiveMembers] = useState<BandMember[]>([]);
  const [exMembers, setExMembers] = useState<BandMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<BandInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!bandId) return;
    setLoading(true);

    const [{ data: bandData }, { data: memberData }, { data: invitationData }] = await Promise.all([
      supabase.from('bands').select('*').eq('id', bandId).single(),
      supabase
        .from('band_members')
        .select('*, profile:profiles(username, display_name, avatar_url)')
        .eq('band_id', bandId)
        .order('joined_at', { ascending: true }),
      supabase
        .from('band_invitations')
        .select('*, invitee:profiles!band_invitations_invitee_id_fkey(username, display_name, avatar_url)')
        .eq('band_id', bandId)
        .eq('status', 'pending'),
    ]);

    setBand(bandData ?? null);
    const allMembers = (memberData as any[]) ?? [];
    setActiveMembers(allMembers.filter(m => m.status === 'active'));
    setExMembers(allMembers.filter(m => m.status === 'ex'));
    setPendingInvitations((invitationData as any[]) ?? []);
    setLoading(false);
  }, [bandId]);

  useEffect(() => {
    load();
  }, [load]);

  const myMembership = activeMembers.find(m => m.profile_id === userId);
  const isLeader = myMembership?.role === 'leader';

  async function updateBandInfo(updates: Partial<Pick<Band,
    'name' | 'bio' | 'genres' | 'formed_year' | 'city' | 'neighborhood' | 'status'
  >>) {
    if (!bandId) return { error: 'Banda inválida' };
    const { error } = await supabase.from('bands').update(updates).eq('id', bandId);
    if (!error) await load();
    return { error: error?.message };
  }

  async function updateBandImage(uri: string, kind: 'avatar' | 'cover') {
    if (!bandId) return { error: 'Banda inválida' };
    try {
      const url = await uploadBandImage(bandId, uri, kind);
      const field = kind === 'avatar' ? 'avatar_url' : 'cover_url';
      await supabase.from('bands').update({ [field]: url }).eq('id', bandId);
      await load();
      return {};
    } catch (e: any) {
      return { error: e.message ?? 'Error al subir la imagen' };
    }
  }

  async function changeMemberRole(memberId: string, role: 'leader' | 'member') {
    const { error } = await supabase.from('band_members').update({ role }).eq('id', memberId);
    if (!error) await load();
    return { error: error?.message };
  }

  async function removeMember(memberId: string) {
    const { error } = await supabase
      .from('band_members')
      .update({ role: 'ex_member', status: 'ex', left_at: new Date().toISOString().slice(0, 10) })
      .eq('id', memberId);
    if (!error) await load();
    return { error: error?.message };
  }

  async function inviteMusician(inviteeId: string, proposedRole: string, message: string) {
    if (!bandId || !userId) return { error: 'Banda inválida' };
    const { error } = await supabase.from('band_invitations').insert({
      band_id: bandId,
      inviter_id: userId,
      invitee_id: inviteeId,
      proposed_role: proposedRole || null,
      message: message.trim() || null,
    });
    if (!error) await load();
    return { error: error?.message };
  }

  async function cancelInvitation(invitationId: string) {
    const { error } = await supabase.from('band_invitations').delete().eq('id', invitationId);
    if (!error) await load();
    return { error: error?.message };
  }

  return {
    band,
    activeMembers,
    exMembers,
    pendingInvitations,
    loading,
    isLeader,
    myMembership,
    refetch: load,
    updateBandInfo,
    updateBandImage,
    changeMemberRole,
    removeMember,
    inviteMusician,
    cancelInvitation,
  };
}
