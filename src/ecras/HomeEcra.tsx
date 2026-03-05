import { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, StyleSheet, TextInput, ScrollView, RefreshControl } from 'react-native';
import { getRandomRecipes, searchRecipes } from '../chamadasapi/spoonacular';
import { Receita } from '../types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

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
  const [pesquisa, setPesquisa] = useState('');
  const [resultados, setResultados] = useState<Receita[]>([]);
  const [pesquisando, setPesquisando] = useState(false);

  async function carregarReceitas() {
    setLoading(true);
    try {
      const receitas = await getRandomRecipes(10);
      setRecomendadas(receitas);
    } catch (error) {
      console.error('Erro ao carregar receitas:', error);
    } finally {
      setLoading(false);
    }
  }

  async function pesquisarReceitas() {
    if (!pesquisa.trim()) return;
    setPesquisando(true);
    try {
      const resultados = await searchRecipes(pesquisa);
      setResultados(resultados);
    } catch (error) {
      console.error('Erro ao pesquisar:', error);
    } finally {
      setPesquisando(false);
    }
  }

  function limparPesquisa() {
    setPesquisa('');
    setResultados([]);
  }

  useEffect(() => {
    carregarReceitas();
  }, []);

  const dadosParaMostrar = resultados.length > 0 ? resultados : recomendadas;
  const tituloSecao = resultados.length > 0 ? `Resultados para "${pesquisa}"` : '🍽️ Sugestões para hoje';

  return (
    <View style={styles.container}>

      {/* Barra de pesquisa — fora do ScrollView para ficar fixa */}
      <View style={styles.barraPesquisa}>
        <TextInput
          style={styles.input}
          placeholder="Pesquisar receitas..."
          placeholderTextColor="#999"
          value={pesquisa}
          onChangeText={setPesquisa}
          onSubmitEditing={pesquisarReceitas}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.botaoPesquisa} onPress={pesquisarReceitas}>
          <Ionicons name="search" size={20} color={cores.branco} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.botaoFiltros}
          onPress={() => navigation.navigate('Filter')}
        >
          <Ionicons name="options-outline" size={20} color={cores.branco} />
        </TouchableOpacity>
      </View>

      {/* Botão limpar pesquisa */}
      {resultados.length > 0 && (
        <TouchableOpacity onPress={limparPesquisa}>
          <Text style={styles.limparTexto}>✕ Limpar pesquisa</Text>
        </TouchableOpacity>
      )}

      {/* Título + Grelha dentro do ScrollView */}
      <ScrollView
        contentContainerStyle={styles.scrollConteudo}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={carregarReceitas}
            colors={[cores.verde]}
            tintColor={cores.verde}
          />
        }
      >
        <Text style={styles.titulo}>{tituloSecao}</Text>

        {loading || pesquisando ? (
          <ActivityIndicator size="large" color={cores.verde} />
        ) : (
          <View style={styles.grelha}>
            {dadosParaMostrar.map((item) => (
              <TouchableOpacity
                key={item.id.toString()}
                style={styles.card}
                onPress={() => navigation.navigate('RecipeDetail', { id: item.id })}
              >
                <Image source={{ uri: item.image }} style={styles.imagem} />
                <Text style={styles.nomeReceita} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.tempo}>⏱️ {item.readyInMinutes} min</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.bege, padding: 16 },
  scrollConteudo: { flexGrow: 1, paddingBottom: 24 },
  barraPesquisa: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: cores.branco,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
    elevation: 2,
  },
  botaoPesquisa: {
    backgroundColor: cores.verde,
    borderRadius: 10,
    padding: 10,
    elevation: 2,
  },
  botaoFiltros: {
    backgroundColor: cores.laranja,
    borderRadius: 10,
    padding: 10,
    elevation: 2,
  },
  limparTexto: {
    color: cores.laranja,
    marginBottom: 8,
    fontWeight: '600',
  },
  titulo: { fontSize: 22, fontWeight: 'bold', color: cores.verde, marginBottom: 16 },
  grelha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: cores.branco,
    borderRadius: 12,
    width: '48%',
    overflow: 'hidden',
    elevation: 3,
    marginBottom: 12,
  },
  imagem: { width: '100%', height: 120 },
  nomeReceita: { fontSize: 14, fontWeight: '600', color: '#333', padding: 8 },
  tempo: { fontSize: 12, color: cores.laranja, paddingHorizontal: 8, paddingBottom: 8 },
});