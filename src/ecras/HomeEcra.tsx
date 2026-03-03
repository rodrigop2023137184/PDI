import { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { getRandomRecipes } from '../chamadasapi/spoonacular';
import { Receita } from '../types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Home: undefined;
  RecipeDetail: { id: number };
  Favorites: undefined;
  Filter: undefined;
};

type HomeNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeNavigationProp;
}

const cores = {
  verde: '#37914B',
  laranja: '#FA9B2D',
  branco: '#FFFFFF',
  bege: '#F5F0E1',
};

export default function HomeEcra({ navigation }: Props) {
  const [recomendadas, setRecomendadas] = useState<Receita[]>([]);
  const [loading, setLoading] = useState(false);

  async function carregarReceitas() {
    setLoading(true);
    try {
      const receitas = await getRandomRecipes(5);
      console.log('Receitas recebidas:', receitas); 
      setRecomendadas(receitas);
    } catch (error) {
      console.error('Erro ao carregar receitas:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarReceitas();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>🍽️ Sugestões para hoje</Text>

      {loading ? (
        <ActivityIndicator size="large" color={cores.verde} />
      ) : (
        <FlatList
          data={recomendadas}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('RecipeDetail', { id: item.id })}
            >
              <Image source={{ uri: item.image }} style={styles.imagem} />
              <Text style={styles.nomeReceita} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.tempo}>⏱️ {item.readyInMinutes} min</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity style={styles.botao} onPress={carregarReceitas}>
        <Text style={styles.botaoTexto}>🔄 Outras sugestões</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.bege, padding: 16 },
  titulo: { fontSize: 22, fontWeight: 'bold', color: cores.verde, marginBottom: 16 },
  card: {
    backgroundColor: cores.branco,
    borderRadius: 12,
    marginRight: 12,
    width: 180,
    overflow: 'hidden',
    elevation: 3,
  },
  imagem: { width: '100%', height: 120 },
  nomeReceita: { fontSize: 14, fontWeight: '600', color: '#333', padding: 8 },
  tempo: { fontSize: 12, color: cores.laranja, paddingHorizontal: 8, paddingBottom: 8 },
  botao: { marginTop: 16, backgroundColor: cores.laranja, borderRadius: 10, padding: 12, alignItems: 'center' },
  botaoTexto: { color: cores.branco, fontWeight: 'bold', fontSize: 16 },
});