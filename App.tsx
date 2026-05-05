import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Session } from '@supabase/supabase-js';

import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import RecipeDetailScreen from './src/screens/RecipeDetailScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegistoScreen from './src/screens/RegistoScreen';
import InicialScreen from './src/screens/InicialScreen';
import { supabase } from './lib/supabase';

// Tipos das rotas para TypeScript
export type RootStackParamList = {
  Inicial: undefined;
  Tabs: undefined;
  DetalheReceita: { receitaId: string };
  Login: undefined;
  Registo: undefined;
};

export type TabParamList = {
  Início: undefined;
  Perfil: undefined;
};

const cores = {
  verde: '#37914B',
  laranja: '#FA9B2D',
  branco: '#FFFFFF',
  bege: '#F5F0E1',
};
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator
       screenOptions={{
         headerShown: false,
         tabBarActiveTintColor: cores.verde,
         tabBarInactiveTintColor: '#000000',
         tabBarStyle: {
           backgroundColor: cores.branco,
           borderTopWidth: 0,
           borderTopLeftRadius: 20,
           borderTopRightRadius: 20,
           elevation: 8,
           shadowColor: '#000',
           shadowOffset: { width: 0, height: -2 },
           shadowOpacity: 0.08,
           shadowRadius: 4,
           height: 65,
       },
        }}
    >

      <Tab.Screen
        name="Início"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: cores.bege }}>
        <ActivityIndicator size="large" color={cores.verde} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={session ? 'Tabs' : 'Inicial'}
      >
        {/* Ecrã inicial (onboarding) — mostrado quando o utilizador não tem sessão */}
        <Stack.Screen name="Inicial" component={InicialScreen} />
        {/* Tabs principais — ProfileScreen mostra o estado anónimo quando não há sessão */}
        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Screen name="DetalheReceita" component={RecipeDetailScreen} />
        {/* Ecrãs de auth */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Registo" component={RegistoScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
