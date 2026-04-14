import React, { useEffect, useState } from 'react';
import BarraPesq from '../../componentes/BarraPesq';
import {
  View,
  Text,
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
      setRecomendadas((data as Receita[]) ?? []);
    } catch (error) {
      console.error('Erro ao carregar receitas:', error);
    } finally {
      setLoading(false);
    }
  }

  function adicionarIngrediente() {
    const texto = pesquisa.trim().toLowerCase();
    if (!texto) return;
    if (ingredientes.includes(texto)) return;
    setIngredientes(prev => [...prev, texto]);
    setPesquisa('');
  }

  function removerIngrediente(ingrediente: string) {
    setIngredientes(prev => prev.filter(i => i !== ingrediente));
  }

  async function pesquisarReceitas() {
  if (ingredientes.length === 0 && !pesquisa.trim()) return;

  setPesquisando(true);
  try {
    // ── Pesquisa por ingredientes ──────────────────
    if (ingredientes.length > 0) {
      const listaFinal = pesquisa.trim()
        ? [...ingredientes, pesquisa.trim().toLowerCase()]
        : ingredientes;

      // Passo 1 — ir buscar os IDs dos ingredientes pelo nome
      const { data: ingsData, error: ingsError } = await supabase
        .from('ingredientes')
        .select('id, nome')
        .in('nome', listaFinal);

      if (ingsError) throw ingsError;

      // Verificar se todos os ingredientes foram encontrados
      if (!ingsData || ingsData.length === 0) {
        setResultados([]);
        setPesquisando(false);
        return;
      }

      const ids = ingsData.map(i => i.id);

      // Passo 2 — filtrar receitas que contêm todos os ingredientes
      let query = supabase
        .from('receitas')
        .select('id, nome, imagem_url, prep_tempo_min, dieta_type');

      ids.forEach(id => {
        query = query.filter(
          'ingredientes',
          'cs',
          `[{"ingrediente_id": "${id}"}]`
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

      {/* Barra de pesquisa */}
      <BarraPesq
        valor={pesquisa}
        onMudar={setPesquisa}
        onPesquisar={pesquisarReceitas}
        onAdicionar={adicionarIngrediente}
        onFiltros={() => {/* navegação para ecrã de filtros */}}
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
              { backgroundColor: filtroAtivo === filtro.valor ? cores.laranja : cores.branco },
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

      {/* Lista de receitas */}
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
        {/* Cabeçalho da secção */}
        <View style={styles.secaoHeader}>
          <Text style={styles.titulo}>{tituloSecao}</Text>
          {resultados.length === 0 && (
            <TouchableOpacity>
              <Text style={styles.verMais}>Ver mais</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading || pesquisando ? (
          <ActivityIndicator size="large" color={cores.verde} />
        ) : dadosParaMostrar.length === 0 ? (
          <Text style={styles.semResultados}>Nenhuma receita encontrada.</Text>
        ) : (
          dadosParaMostrar.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => navigation.navigate('DetalheReceita', { receitaId: item.id })}
            >
              {/* Imagem à esquerda */}
              <Image
                source={{ uri: item.imagem_url ?? undefined }}
                style={styles.imagem}
              />

              {/* Texto ao centro */}
              <View style={styles.cardInfo}>
                <Text style={styles.nomeReceita} numberOfLines={2}>
                  {item.nome}
                </Text>
                <View style={styles.tempoContainer}>
                  <Ionicons name="time-outline" size={14} color="#5e5e5e" />
                  <Text style={styles.tempo}> {item.prep_tempo_min} Min</Text>
                </View>
              </View>

              {/* Botão seta à direita */}
              <View style={styles.botaoSeta}>
                <Ionicons name="arrow-forward" size={18} color={cores.branco} />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.bege, padding: 16 },
  scrollConteudo: { flexGrow: 1, paddingBottom: 80 },

  // Saudação
  saudacaoContainer: { marginBottom: 16 },
  saudacaoLinha: { flexDirection: 'row', alignItems: 'center' },
  saudacao: { fontSize: 16, color: '#888' },
  nomeUtilizador: { fontSize: 26, fontWeight: 'bold', color: '#222' },

  // Tags de ingredientes
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

  // Limpar pesquisa
  limparTexto: { color: cores.laranja, marginBottom: 8, fontWeight: '600' },

  // Filtros de dieta
  filtrosContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filtroBotao: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 2,
  },
  filtroTexto: { fontWeight: '600', fontSize: 13 },

  // Cabeçalho da secção
  secaoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titulo: { fontSize: 20, fontWeight: 'bold', color: '#222' },
  verMais: { fontSize: 14, color: cores.verde, fontWeight: 'bold'},

  // Cards
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: cores.branco,
    borderRadius: 16,
    marginBottom: 22,
    overflow: 'hidden',
    elevation: 2,
    padding: 10,
  },
  imagem: {
    width: 90,
    height: 90,
    borderRadius: 12,
  },
  cardInfo: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  nomeReceita: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
    marginBottom: 6,
  },
  tempoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tempo: { fontSize: 13, color: '#5e5e5e' },
  botaoSeta: {
    backgroundColor: cores.laranja,
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  // Sem resultados
  semResultados: { textAlign: 'center', color: '#999', marginTop: 32, fontSize: 15 },
});