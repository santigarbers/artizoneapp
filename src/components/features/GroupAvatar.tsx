import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

type MemberPreview = {
  user_id?: string;
  username: string;
  avatar_url: string | null;
};

type Props = {
  avatarUrl?: string | null;
  members: MemberPreview[];
  size?: number;
};

export function GroupAvatar({ avatarUrl, members, size = 54 }: Props) {
  // Single group photo
  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
      />
    );
  }

  const shown = members.slice(0, 3);
  const small = Math.round(size * 0.58);

  if (shown.length === 0) {
    return (
      <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={{ fontSize: size * 0.38 }}>👥</Text>
      </View>
    );
  }

  // Stacked overlapping avatars
  const overlap = Math.round(small * 0.33);
  const totalWidth = small + (shown.length - 1) * (small - overlap);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ flexDirection: 'row', width: totalWidth, alignItems: 'flex-end' }}>
        {shown.map((m, i) => (
          <View
            key={i}
            style={[
              styles.stackRing,
              {
                width: small,
                height: small,
                borderRadius: small / 2,
                marginLeft: i === 0 ? 0 : -overlap,
                zIndex: shown.length - i,
              },
            ]}
          >
            {m.avatar_url ? (
              <Image
                source={{ uri: m.avatar_url }}
                style={{ width: small - 3, height: small - 3, borderRadius: (small - 3) / 2 }}
                contentFit="cover"
              />
            ) : (
              <View
                style={[
                  styles.stackPlaceholder,
                  { width: small - 3, height: small - 3, borderRadius: (small - 3) / 2 },
                ]}
              >
                <Text style={{ color: '#fff', fontSize: small * 0.38, fontWeight: 'bold' }}>
                  {m.username?.[0]?.toUpperCase() ?? '?'}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: '#1e1e1e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackRing: {
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#0f0f0f',
  },
  stackPlaceholder: {
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
