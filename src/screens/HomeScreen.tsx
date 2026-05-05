import React, { useEffect, useRef, useState } from 'react';
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
  Modal,
  Pressable,
  Animated,
  PanResponder,
  Easing,
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
  bege: '#FFF1CE',
};

const filtros = [
  { label: 'Vegetariana', valor: 'vegetariana' },
  { label: 'Vegan', valor: 'vegan' },
  { label: 'Omnívora', valor: 'omnivora' },
];

const opcoesDieta = [
  { label: 'Vegetariana', valor: 'vegetariana' },
  { label: 'Vegan', valor: 'vegan' },
  { label: 'Omnívora', valor: 'omnivora' },
];

const LIMITE_ALTA_PROTEINA = 20;
const LIMITE_BAIXA_GORDURA = 10;

const opcoesTempo = [
  { label: '≤ 15 min', valor: 15 },
  { label: '≤ 30 min', valor: 30 },
  { label: '≤ 60 min', valor: 60 },
];

const opcoesCalorias = [
  { label: '≤ 300 kcal', valor: 300 },
  { label: '≤ 500 kcal', valor: 500 },
  { label: '≤ 800 kcal', valor: 800 },
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
  const [modalFiltrosVisivel, setModalFiltrosVisivel] = useState(false);
  const [filtroTempoMax, setFiltroTempoMax] = useState<number | null>(null);
  const [filtroCaloriasMax, setFiltroCaloriasMax] = useState<number | null>(null);
  const [filtroDietaModal, setFiltroDietaModal] = useState<string | null>(null);
  const [filtroAltoProteina, setFiltroAltoProteina] = useState(false);
  const [filtroBaixoGordura, setFiltroBaixoGordura] = useState(false);
  const [nomeUtilizador, setNomeUtilizador] = useState<string>('Convidado');

  const translateY = useRef(new Animated.Value(0)).current;

  function fecharModalFiltros() {
    Animated.timing(translateY, {
      toValue: 700,
      duration: 320,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        translateY.setValue(0);
        setModalFiltrosVisivel(false);
      }
    });
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 4,
      onPanResponderGrant: () => {
        translateY.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        } else {
          translateY.setValue(gestureState.dy / 4);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120 || gestureState.vy > 0.8) {
          fecharModalFiltros();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            tension: 70,
            friction: 12,
            velocity: gestureState.vy,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  type FiltrosOpts = {
    dietType?: string | null;
    tempoMax?: number | null;
    caloriasMax?: number | null;
    altoProteina?: boolean;
    baixoGordura?: boolean;
  };

  async function carregarReceitas(opts: FiltrosOpts = {}) {
    const dietType = opts.dietType ?? filtroAtivo;
    const tempoMax = opts.tempoMax !== undefined ? opts.tempoMax : filtroTempoMax;
    const caloriasMax = opts.caloriasMax !== undefined ? opts.caloriasMax : filtroCaloriasMax;
    const altoProteina = opts.altoProteina !== undefined ? opts.altoProteina : filtroAltoProteina;
    const baixoGordura = opts.baixoGordura !== undefined ? opts.baixoGordura : filtroBaixoGordura;

    setLoading(true);
    try {
      let query = supabase
        .from('receitas')
        .select('id, nome, imagem_url, prep_tempo_min, dieta_type');

      if (dietType) query = query.eq('dieta_type', dietType);
      if (tempoMax) query = query.lte('prep_tempo_min', tempoMax);
      if (caloriasMax) query = query.lte('calorias', caloriasMax);
      if (altoProteina) query = query.gte('proteinas_g', LIMITE_ALTA_PROTEINA);
      if (baixoGordura) query = query.lte('fats_g', LIMITE_BAIXA_GORDURA);

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

  function abrirModalFiltros() {
    setFiltroDietaModal(filtroAtivo);
    setModalFiltrosVisivel(true);
  }

  function aplicarFiltrosModal() {
  setFiltroAtivo(filtroDietaModal);
  setModalFiltrosVisivel(false);
  limparPesquisa();
  carregarReceitas({
    dietType: filtroDietaModal,
    tempoMax: filtroTempoMax,
    caloriasMax: filtroCaloriasMax,
    altoProteina: filtroAltoProteina,
    baixoGordura: filtroBaixoGordura,
  });
}

  function limparFiltrosModal() {
    setFiltroDietaModal(null);
    setFiltroTempoMax(null);
    setFiltroCaloriasMax(null);
    setFiltroAltoProteina(false);
    setFiltroBaixoGordura(false);
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

      // Passo 1 — ir buscar os IDs dos ingredientes pelo nome (case-insensitive, um por um)
      const resultadosIngs = await Promise.all(
        listaFinal.map(nome =>
          supabase
            .from('ingredientes')
            .select('id, nome')
            .ilike('nome', nome)
            .maybeSingle()
        )
      );

      // Se algum ingrediente não foi encontrado → sem resultados
      const faltaAlgum = resultadosIngs.some(r => !r.data);
      if (faltaAlgum) {
        setResultados([]);
        setPesquisando(false);
        return;
      }

      const ids = resultadosIngs.map(r => r.data!.id);

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

  useEffect(() => {
    async function carregarNomeUtilizador() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setNomeUtilizador('Convidado');
        return;
      }
      const { data: perfil } = await supabase
        .from('users')
        .select('display_name')
        .eq('id', user.id)
        .maybeSingle();

      const nome = perfil?.display_name?.trim();
      setNomeUtilizador(nome && nome.length > 0 ? nome : 'Utilizador');
    }

    carregarNomeUtilizador();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      carregarNomeUtilizador();
    });

    return () => subscription.unsubscribe();
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
        <Text style={styles.nomeUtilizador}>{nomeUtilizador}</Text>
      </View>

      {/* Barra de pesquisa */}
      <BarraPesq
        valor={pesquisa}
        onMudar={setPesquisa}
        onPesquisar={pesquisarReceitas}
        onAdicionar={adicionarIngrediente}
        onFiltros={abrirModalFiltros}
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
              carregarReceitas({ dietType: novoFiltro });
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
            onRefresh={() => carregarReceitas()}
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

      {/* Modal de filtros */}
      <Modal
        visible={modalFiltrosVisivel}
        animationType="slide"
        transparent
        onRequestClose={fecharModalFiltros}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={fecharModalFiltros}
        >
          <Animated.View
            style={[styles.modalConteudo, { transform: [{ translateY }] }]}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >

            {/* Zona de arrasto — handle + header */}
            <View {...panResponder.panHandlers}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitulo}>Filtros</Text>
                <TouchableOpacity onPress={limparFiltrosModal}>
                  <Text style={styles.modalLimpar}>Limpar</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Dieta */}
              <Text style={styles.modalSecaoTitulo}>Tipo de dieta</Text>
              <View style={styles.modalChipsContainer}>
                {opcoesDieta.map((op) => {
                  const ativo = filtroDietaModal === op.valor;
                  return (
                    <TouchableOpacity
                      key={op.valor}
                      style={[styles.modalChip, ativo && styles.modalChipAtivo]}
                      onPress={() => setFiltroDietaModal(ativo ? null : op.valor)}
                    >
                      <Text style={[styles.modalChipTexto, ativo && styles.modalChipTextoAtivo]}>
                        {op.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Tempo */}
              <Text style={styles.modalSecaoTitulo}>Tempo de preparação</Text>
              <View style={styles.modalChipsContainer}>
                {opcoesTempo.map((op) => {
                  const ativo = filtroTempoMax === op.valor;
                  return (
                    <TouchableOpacity
                      key={op.valor}
                      style={[styles.modalChip, ativo && styles.modalChipAtivo]}
                      onPress={() => setFiltroTempoMax(ativo ? null : op.valor)}
                    >
                      <Text style={[styles.modalChipTexto, ativo && styles.modalChipTextoAtivo]}>
                        {op.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Calorias */}
              <Text style={styles.modalSecaoTitulo}>Calorias</Text>
              <View style={styles.modalChipsContainer}>
                {opcoesCalorias.map((op) => {
                  const ativo = filtroCaloriasMax === op.valor;
                  return (
                    <TouchableOpacity
                      key={op.valor}
                      style={[styles.modalChip, ativo && styles.modalChipAtivo]}
                      onPress={() => setFiltroCaloriasMax(ativo ? null : op.valor)}
                    >
                      <Text style={[styles.modalChipTexto, ativo && styles.modalChipTextoAtivo]}>
                        {op.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Outros */}
              <Text style={styles.modalSecaoTitulo}>Outros</Text>
              <View style={styles.modalChipsContainer}>
                <TouchableOpacity
                  style={[styles.modalChip, filtroAltoProteina && styles.modalChipAtivo]}
                  onPress={() => setFiltroAltoProteina((v) => !v)}
                >
                  <Text style={[styles.modalChipTexto, filtroAltoProteina && styles.modalChipTextoAtivo]}>
                    Alto em proteína
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalChip, filtroBaixoGordura && styles.modalChipAtivo]}
                  onPress={() => setFiltroBaixoGordura((v) => !v)}
                >
                  <Text style={[styles.modalChipTexto, filtroBaixoGordura && styles.modalChipTextoAtivo]}>
                    Baixo em gordura
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Botão aplicar */}
            <TouchableOpacity style={styles.modalBotaoAplicar} onPress={aplicarFiltrosModal}>
              <Text style={styles.modalBotaoAplicarTexto}>Aplicar filtros</Text>
            </TouchableOpacity>

          </Animated.View>
        </Pressable>
      </Modal>
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

  // Modal de filtros
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalConteudo: {
    backgroundColor: cores.bege,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    maxHeight: '80%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CCC',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitulo: { fontSize: 20, fontWeight: 'bold', color: '#222' },
  modalLimpar: { fontSize: 14, color: cores.laranja, fontWeight: '600' },
  modalSecaoTitulo: {
    fontSize: 15,
    fontWeight: '600',
    color: '#444',
    marginTop: 12,
    marginBottom: 10,
  },
  modalChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalChip: {
    backgroundColor: cores.branco,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    elevation: 1,
  },
  modalChipAtivo: { backgroundColor: cores.laranja },
  modalChipTexto: { color: '#666', fontSize: 13, fontWeight: '600' },
  modalChipTextoAtivo: { color: cores.branco },
  modalBotaoAplicar: {
    backgroundColor: cores.verde,
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
    elevation: 2,
  },
  modalBotaoAplicarTexto: {
    color: cores.branco,
    fontSize: 15,
    fontWeight: 'bold',
  },
});