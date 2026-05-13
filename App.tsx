import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeIcon, UserCircleIcon } from 'react-native-heroicons/outline';
import { Session } from '@supabase/supabase-js';

import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import RecipeDetailScreen from './src/screens/RecipeDetailScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegistoScreen from './src/screens/RegistoScreen';
import InicialScreen from './src/screens/InicialScreen';
import RecuperarPasswordScreen from './src/screens/RecuperarPasswordScreen';
import TodasReceitasScreen from './src/screens/TodasReceitasScreen';
import ReceitasRelacionadasScreen from './src/screens/ReceitasRelacionadasScreen';
import SugestaoIAScreen from './src/screens/SugestaoIAScreen';
import { supabase } from './lib/supabase';
import { AlertProvider } from './componentes/AlertaCustom';

export type RootStackParamList = {
  Inicial: undefined;
  Tabs: undefined;
  DetalheReceita: { receitaId: string };
  Login: undefined;
  Registo: undefined;
  RecuperarPassword: undefined;
  TodasReceitas: undefined;
  ReceitasRelacionadas: {
    receitaAtualId: string;
    ingredientesAtuais: string[];
    receitaAtualNome: string;
  };
  SugestaoIA: undefined;
};

export type TabParamList = {
  Início: undefined;
  Perfil: undefined;
};

const cores = {
  verde: '#37914B',
  laranja: '#FA9B2D',
  branco: '#FFFFFF',
  bege: '#FFF1CE',
};
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator
       screenOptions={{
         headerShown: false,
         tabBarShowLabel: false,
         tabBarActiveTintColor: cores.verde,
         tabBarInactiveTintColor: '#000000',
         tabBarStyle: {
           position: 'absolute',
           left: 0,
           right: 0,
           bottom: 0,
           backgroundColor: cores.branco,
           borderTopWidth: 0,
           borderTopLeftRadius: 20,
           borderTopRightRadius: 20,
           elevation: 8,
           shadowColor: '#000',
           shadowOffset: { width: 0, height: -2 },
           shadowOpacity: 0.08,
           shadowRadius: 4,
           height: 75,
           paddingTop: 14,
       },
        }}
    >

      <Tab.Screen
        name="Início"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <HomeIcon color={color} size={size} strokeWidth={2} />
          ),
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <UserCircleIcon color={color} size={size} strokeWidth={2} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [recuperandoPassword, setRecuperandoPassword] = useState(false);
  const [emailRecuperacao, setEmailRecuperacao] = useState('');

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  function iniciarRecuperacao(email: string) {
    setEmailRecuperacao(email);
    setRecuperandoPassword(true);
  }

  async function terminarRecuperacao() {
    await supabase.auth.signOut();
    setEmailRecuperacao('');
    setRecuperandoPassword(false);
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: cores.bege }}>
        <ActivityIndicator size="large" color={cores.verde} />
      </View>
    );
  }

  return (
    <AlertProvider>
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {recuperandoPassword ? (
          <Stack.Screen name="RecuperarPassword">
            {() => (
              <RecuperarPasswordScreen
                email={emailRecuperacao}
                onConcluido={terminarRecuperacao}
              />
            )}
          </Stack.Screen>
        ) : session ? (
          <>
            <Stack.Screen name="Tabs" component={TabNavigator} />
            <Stack.Screen name="DetalheReceita" component={RecipeDetailScreen} />
            <Stack.Screen name="TodasReceitas" component={TodasReceitasScreen} />
            <Stack.Screen name="ReceitasRelacionadas" component={ReceitasRelacionadasScreen} />
            <Stack.Screen name="SugestaoIA" component={SugestaoIAScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Inicial" component={InicialScreen} />
            <Stack.Screen name="Login">
              {() => <LoginScreen onIniciarRecuperacao={iniciarRecuperacao} />}
            </Stack.Screen>
            <Stack.Screen name="Registo" component={RegistoScreen} />
            <Stack.Screen name="Tabs" component={TabNavigator} />
            <Stack.Screen name="DetalheReceita" component={RecipeDetailScreen} />
            <Stack.Screen name="TodasReceitas" component={TodasReceitasScreen} />
            <Stack.Screen name="ReceitasRelacionadas" component={ReceitasRelacionadasScreen} />
            <Stack.Screen name="SugestaoIA" component={SugestaoIAScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
    </AlertProvider>
  );
}