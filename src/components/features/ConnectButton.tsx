import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ConnectionWithProfile } from '@/lib/hooks/useConnections';

type Props = {
  connection: ConnectionWithProfile | null;
  onConnect: () => Promise<void> | void;
  compact?: boolean;
};

export function ConnectButton({ connection, onConnect, compact }: Props) {
  const [busy, setBusy] = useState(false);

  if (connection && connection.status === 'accepted') {
    return (
      <View style={[styles.status, styles.accepted, compact && styles.compact]}>
        <Text style={[styles.statusText, styles.acceptedText]}>Conectados</Text>
      </View>
    );
  }

  if (connection && connection.status === 'pending') {
    return (
      <View style={[styles.status, compact && styles.compact]}>
        <Text style={styles.statusText}>Pendiente</Text>
      </View>
    );
  }

  async function handlePress() {
    setBusy(true);
    try {
      await onConnect();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Pressable
      style={[styles.button, compact && styles.compact]}
      onPress={handlePress}
      disabled={busy}
      hitSlop={8}
    >
      {busy ? (
        <ActivityIndicator color="#000" size="small" />
      ) : (
        <Text style={styles.buttonText}>Conectar</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#000', fontSize: 14, fontWeight: '600' },
  status: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: { color: '#888', fontSize: 14 },
  accepted: { borderColor: '#2a4a2a', backgroundColor: '#1a2e1a' },
  acceptedText: { color: '#4ade80' },
  compact: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
});
