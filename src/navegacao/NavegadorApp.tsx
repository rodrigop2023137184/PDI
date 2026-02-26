import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import HomeScreen from '../ecras/HomeEcra';
import RecipeDetailScreen from '../ecras/DetalhesReceita';
import FavoritesScreen from '../ecras/FavoritosEcra';
import FilterScreen from '../ecras/FiltrosEcra';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: '#1a1a2e' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Komikalate' }} />
        <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} options={{ title: 'Receita' }} />
        <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Favoritos' }} />
        <Stack.Screen name="Filter" component={FilterScreen} options={{ title: 'Filtros' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}