import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import RecipeDetailScreen from './src/screens/RecipeDetailScreen';

// Tipos das rotas para TypeScript
export type RootStackParamList = {
  Tabs: undefined;
  DetalheReceita: { receitaId: string };
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
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {/* Tabs principais */}
        <Stack.Screen
          name="Tabs"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        {/* Ecrã de detalhe (abre por cima das tabs) */}
        <Stack.Screen
          name="DetalheReceita"
          component={RecipeDetailScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}