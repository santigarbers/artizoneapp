import { StyleSheet, View } from 'react-native';
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function TabBarBackground() {
  if (isLiquidGlassSupported) {
    return (
      <LiquidGlassView
        effect="regular"
        style={StyleSheet.absoluteFill}
      />
    );
  }
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: '#111', borderTopWidth: 1, borderTopColor: '#222' },
      ]}
    />
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarBackground: () => <TabBarBackground />,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontSize: 11, marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Descubrir',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'musical-notes' : 'musical-notes-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="salas"
        options={{
          title: 'Salas',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'map' : 'map-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="connections"
        options={{
          title: 'Conexiones',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({});
