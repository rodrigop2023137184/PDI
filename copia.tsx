import React, { useEffect, useState } from 'react';
import BarraPesq from '../../componentes/BarraPesq';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { Receita } from '../../types';
import { RootStackParamList } from '../../App';

// ── Tipos ─────────────────────────────────────────────
type HomeNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Tabs'>;

interface Props {
  navigation: HomeNavigationProp;
}

// ── Constantes ────────────────────────────────────────
const cores = {
  verde: '#37914B',
  laranja: '#FA9B2D',
  branco: '#FFFFFF',
  bege: '#F5F0E1',
};

const filtros = [
  { label: 'Vegetariana', valor: 'vegetariana' },
  { label: 'Vegan', valor: 'vegan' },
  { label: 'Omnívora', valor: 'omnivora' },
];

// ── Componente ────────────────────────────────────────
export default function HomeScreen({ navigation }: Props) {
  const [recomendadas, setRecomendadas] = useState<Receita[]>([]);
  const [loading, setLoading] = useState(false);
  const [pesquisa, setPesquisa] = useState('');
  const [resultados, setResultados] = useState<Receita[]>([]);
  const [pesquisando, setPesquisando] = useState(false);
  const [ingredientes, setIngredientes] = useState<string[]>([]);
  const [filtroAtivo, setFiltroAtivo] = useState<string | null>(null);

  async function carregarReceitas(dietType?: string) {
    setLoading(true);
    try {
      let query = supabase
        .from('receitas')
        .select('id, nome, imagem_url, prep_tempo_min, dieta_type');

      if (dietType) {
        query = query.eq('dieta_type', dietType);
      }

      const { data, error } = await query
        .order('data_criacao', { ascending: false })
        .limit(10);

      if (error) throw error;

      setRecomendadas(data ?? []);
    } catch (error) {
      console.error('Erro ao carregar receitas:', error);
    } finally {
      setLoading(false);
    }
  }

  function adicionarIngrediente() {
   const texto = pesquisa.trim().toLowerCase();
     if (!texto) return;
     if (ingredientes.includes(texto)) return; // evita duplicados
    setIngredientes(prev => [...prev, texto]);
    setPesquisa('');
  }

  function removerIngrediente(ingrediente: string) {
   setIngredientes(prev => prev.filter(i => i !== ingrediente));
  }

  async function pesquisarReceitas() {
  console.log('== PESQUISA INICIADA ==');
  console.log('Ingredientes:', ingredientes);
  console.log('Texto:', pesquisa);

  if (ingredientes.length === 0 && !pesquisa.trim()) return;

  setPesquisando(true);
  try {
    // ── Pesquisa por ingredientes ──────────────────
    if (ingredientes.length > 0) {
  const listaFinal = pesquisa.trim()
    ? [...ingredientes, pesquisa.trim().toLowerCase()]
    : ingredientes;

  let query = supabase
    .from('receitas')
    .select('id, nome, imagem_url, prep_tempo_min, dieta_type');

  listaFinal.forEach(ing => {
    query = query.filter(
      'ingredientes',
      'cs',
      `[{"name": "${ing}"}]`   
    );
  });

  const { data, error } = await query.limit(20);
  if (error) throw error;
  setResultados((data as Receita[]) ?? []);

    // ── Pesquisa por nome ──────────────────────────
    } else {
      const { data, error } = await supabase
        .from('receitas')
        .select('id, nome, imagem_url, prep_tempo_min, dieta_type')
        .ilike('nome', `%${pesquisa.trim()}%`)
        .limit(20);

      if (error) throw error;
      setResultados((data as Receita[]) ?? []);
    }
  } catch (error) {
    console.error('Erro ao pesquisar:', error);
  } finally {
    setPesquisando(false);
  }
}

  function limparPesquisa() {
    setPesquisa('');
    setResultados([]);
    setIngredientes([]);
  }

  useEffect(() => {
    carregarReceitas();
   }, []);

  function getIconeSaudacao() {
    const hora = new Date().getHours();
    let iconName: React.ComponentProps<typeof Ionicons>['name'];
    if (hora >= 6 && hora < 12) iconName = 'sunny';
    else if (hora >= 12 && hora < 20) iconName = 'partly-sunny';
    else iconName = 'moon';
    return <Ionicons name={iconName} size={22} color="orange" />;
  }

  function getTextoSaudacao() {
    const hora = new Date().getHours();
    if (hora >= 6 && hora < 12) return 'Bom dia';
    if (hora >= 12 && hora < 20) return 'Boa tarde';
    return 'Boa noite';
  }

  const dadosParaMostrar = resultados.length > 0 ? resultados : recomendadas;
  const tituloSecao =
    resultados.length > 0
      ? `Resultados para "${pesquisa}"`
      : 'Recomendações do Chefe';

  return (
    <View style={styles.container}>

      {/* Saudação */}
      <View style={styles.saudacaoContainer}>
        <View style={styles.saudacaoLinha}>
          {getIconeSaudacao()}
          <Text style={styles.saudacao}> {getTextoSaudacao()}</Text>
        </View>
        <Text style={styles.nomeUtilizador}>Miguel</Text>
      </View>

      <BarraPesq
         valor={pesquisa}
         onMudar={setPesquisa}
         onPesquisar={pesquisarReceitas}
         onAdicionar={adicionarIngrediente}
        />

      {/* Tags de ingredientes */}
      {ingredientes.length > 0 && (
        <View style={styles.tagsContainer}>
          {ingredientes.map((ing) => (
           <View key={ing} style={styles.tag}>
         <Text style={styles.tagTexto}>{ing}</Text>
           <TouchableOpacity onPress={() => removerIngrediente(ing)}>
            <Ionicons name="close-circle" size={16} color={cores.branco} />
          </TouchableOpacity>
          </View>
         ))}
       </View>
      )}

      {/* Botão limpar pesquisa */}
      {resultados.length > 0 && (
        <TouchableOpacity onPress={limparPesquisa}>
          <Text style={styles.limparTexto}>✕ Limpar pesquisa</Text>
        </TouchableOpacity>
      )}

      {/* Botões de filtro por dieta */}
      <View style={styles.filtrosContainer}>
        {filtros.map((filtro, index) => (
          <TouchableOpacity
            key={filtro.valor}
            onPress={() => {
              const novoFiltro = filtroAtivo === filtro.valor ? null : filtro.valor;
              setFiltroAtivo(novoFiltro);
              limparPesquisa();
              carregarReceitas(novoFiltro ?? undefined);
            }}
            style={[
              styles.filtroBotao,
              index < filtros.length - 1 && { marginRight: 8 },
              { backgroundColor: filtroAtivo === filtro.valor ? cores.verde : cores.branco },
            ]}
          >
            <Text
              style={[
                styles.filtroTexto,
                { color: filtroAtivo === filtro.valor ? cores.branco : '#888' },
              ]}
            >
              {filtro.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Grelha de receitas */}
      <ScrollView
        contentContainerStyle={styles.scrollConteudo}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => carregarReceitas(filtroAtivo ?? undefined)}
            colors={[cores.verde]}
            tintColor={cores.verde}
          />
        }
      >
        <Text style={styles.titulo}>{tituloSecao}</Text>

        {loading || pesquisando ? (
          <ActivityIndicator size="large" color={cores.verde} />
        ) : dadosParaMostrar.length === 0 ? (
          <Text style={styles.semResultados}>Nenhuma receita encontrada.</Text>
        ) : (
          <View style={styles.grelha}>
            {dadosParaMostrar.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                onPress={() => navigation.navigate('DetalheReceita', { receitaId: item.id })}
              >
                <Image
                  source={{ uri: item.imagem_url ?? undefined }}
                  style={styles.imagem}
                />
                <Text style={styles.nomeReceita} numberOfLines={2}>
                  {item.nome}
                </Text>
                <View style={styles.tempoContainer}>
                  <Ionicons name="time-outline" size={14} color="grey" />
                  <Text style={styles.tempo}> {item.prep_tempo_min} min</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.bege, padding: 16 },
  scrollConteudo: { flexGrow: 1, paddingBottom: 24 },
  saudacaoContainer: { marginBottom: 16 },
  saudacaoLinha: { flexDirection: 'row', alignItems: 'center' },
  saudacao: { fontSize: 16, color: '#888' },
  nomeUtilizador: { fontSize: 26, fontWeight: 'bold', color: cores.laranja },
  barraPesquisa: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
    marginRight: 8,
  },
  botaoPesquisa: {
    backgroundColor: cores.verde,
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    marginRight: 8,
  },

  tagsContainer: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 8,
  marginBottom: 12,
  },
  tag: {
   flexDirection: 'row',
   alignItems: 'center',
   backgroundColor: cores.verde,
   borderRadius: 20,
   paddingHorizontal: 10,
   paddingVertical: 4,
   gap: 4,
  },
  tagTexto: {
   color: cores.branco,
   fontSize: 13,
   fontWeight: '600',
  },
  botaoFiltros: {
    backgroundColor: cores.laranja,
    borderRadius: 10,
    padding: 10,
    elevation: 2,
  },
  limparTexto: { color: cores.laranja, marginBottom: 8, fontWeight: '600' },
  filtrosContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filtroBotao: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  filtroTexto: { fontWeight: '600', fontSize: 13 },
  titulo: { fontSize: 22, fontWeight: 'bold', color: cores.verde, marginBottom: 16 },
  grelha: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    backgroundColor: cores.branco,
    borderRadius: 12,
    width: '48%',
    overflow: 'hidden',
    elevation: 3,
    marginBottom: 12,
  },
  tempoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  imagem: { width: '100%', height: 120 },
  nomeReceita: { fontSize: 14, fontWeight: '600', color: '#333', padding: 8 },
  tempo: { fontSize: 12, color: cores.laranja },
  semResultados: { textAlign: 'center', color: '#999', marginTop: 32, fontSize: 15 },
});