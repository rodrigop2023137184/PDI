import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  Modal,
  Pressable,
} from 'react-native';
import { useAlert } from '../../componentes/AlertaCustom';
import {
  gerarVariacao,
  TipoVariacao,
  VariacaoReceita,
  ROTULO_VARIACAO,
} from '../../lib/ia';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { supabase } from '../../lib/supabase';
import { Receita, Ingrediente, ReceitaIngrediente } from '../../types';
import { RootStackParamList } from '../../App';

// ── Tipos ─────────────────────────────────────────────
type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DetalheReceita'>;
  route: RouteProp<RootStackParamList, 'DetalheReceita'>;
};

type IngredienteDetalhado = ReceitaIngrediente & { ingrediente: Ingrediente };

// ── Constantes ────────────────────────────────────────
const cores = {
  verde: '#37914B',
  laranja: '#FA9B2D',
  branco: '#FFFFFF',
  bege: '#FFF1CE',
};

const { width } = Dimensions.get('window');

// ── Componente ────────────────────────────────────────
export default function RecipeDetailScreen({ navigation, route }: Props) {
  const { receitaId } = route.params;
  const { showAlert } = useAlert();
  const [receita, setReceita] = useState<Receita | null>(null);
  const [ingredientesDetalhes, setIngredientesDetalhes] = useState<IngredienteDetalhado[]>([]);
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState<'ingredientes' | 'instrucoes'>('ingredientes');
  const [favorito, setFavorito] = useState(false);
  const [favoritoLoading, setFavoritoLoading] = useState(false);

  // Variação com IA
  const [modalVariacaoVisivel, setModalVariacaoVisivel] = useState(false);
  const [modalResultadoVisivel, setModalResultadoVisivel] = useState(false);
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoVariacao | null>(null);
  const [loadingVariacao, setLoadingVariacao] = useState(false);
  const [variacaoGerada, setVariacaoGerada] = useState<VariacaoReceita | null>(null);

  async function handleGerarVariacao(tipo: TipoVariacao) {
    if (!receita) return;

    // Pré-verifica sessão para evitar fazer a chamada ao servidor só para
    // receber 401 e dar uma mensagem mais simpática a convidados.
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setModalVariacaoVisivel(false);
      showAlert({
        titulo: 'Ups! Precisas de uma conta',
        mensagem:
          'A geração de variações por IA é uma funcionalidade exclusiva para utilizadores registados. Faz login ou cria conta para experimentar.',
        tipo: 'aviso',
      });
      return;
    }

    setTipoSelecionado(tipo);
    setLoadingVariacao(true);
    try {
      const resultado = await gerarVariacao(
        {
          nome: receita.nome,
          ingredientes: ingredientesDetalhes.map((i) => ({
            nome: i.ingrediente?.nome ?? 'ingrediente',
            quantidade: i.quantity,
          })),
          instrucoes: [...receita.instrucoes]
            .sort((a, b) => a.step - b.step)
            .map((p) => p.text),
        },
        tipo
      );
      setVariacaoGerada(resultado);
      setModalVariacaoVisivel(false);
      setModalResultadoVisivel(true);
    } catch (error) {
      const mensagem =
        error instanceof Error ? error.message : 'Erro desconhecido';
      showAlert({ titulo: 'Erro', mensagem, tipo: 'erro' });
    } finally {
      setLoadingVariacao(false);
    }
  }

  // Indicador laranja deslizante das abas
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [larguraInternaAbas, setLarguraInternaAbas] = useState(0);
  const larguraIndicador = larguraInternaAbas / 2;
  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, larguraIndicador],
  });

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: abaAtiva === 'ingredientes' ? 0 : 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [abaAtiva]);

  useEffect(() => {
    carregarReceita();
    verificarFavorito();
  }, [receitaId]);

  async function verificarFavorito() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setFavorito(false);
      return;
    }
    const { data } = await supabase
      .from('user_favoritos')
      .select('receitas_id')
      .eq('user_id', user.id)
      .eq('receitas_id', receitaId)
      .maybeSingle();
    setFavorito(!!data);
  }

  async function toggleFavorito() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showAlert({
        titulo: 'Inicia sessão',
        mensagem: 'Tens de iniciar sessão para guardar receitas favoritas.',
        tipo: 'aviso',
      });
      return;
    }
    if (favoritoLoading) return;

    setFavoritoLoading(true);
    const novoEstado = !favorito;
    setFavorito(novoEstado);

    if (novoEstado) {
      const { error } = await supabase
        .from('user_favoritos')
        .insert({ user_id: user.id, receitas_id: receitaId });
      if (error && !/duplicate key|already exists/i.test(error.message)) {
        setFavorito(false);
        showAlert({
          titulo: 'Erro',
          mensagem: 'Não foi possível adicionar aos favoritos.',
          tipo: 'erro',
        });
        console.warn('Erro ao adicionar favorito:', error.message);
      }
    } else {
      const { error } = await supabase
        .from('user_favoritos')
        .delete()
        .eq('user_id', user.id)
        .eq('receitas_id', receitaId);
      if (error) {
        setFavorito(true);
        showAlert({
          titulo: 'Erro',
          mensagem: 'Não foi possível remover dos favoritos.',
          tipo: 'erro',
        });
        console.warn('Erro ao remover favorito:', error.message);
      }
    }
    setFavoritoLoading(false);
  }

  async function carregarReceita() {
    try {
      // Buscar receita completa
      const { data, error } = await supabase
        .from('receitas')
        .select('*')
        .eq('id', receitaId)
        .single();

      if (error) throw error;

      // Normaliza colunas JSONB que podem vir null (receitas parciais ou
      // migradas sem dados) para que o resto do código possa assumir arrays.
      const receitaSegura: Receita = {
        ...(data as Receita),
        ingredientes: (data.ingredientes as ReceitaIngrediente[] | null) ?? [],
        instrucoes: (data.instrucoes as Receita['instrucoes'] | null) ?? [],
      };
      setReceita(receitaSegura);

      // Se a receita não tiver ingredientes, salta o passo do join.
      if (receitaSegura.ingredientes.length === 0) {
        setIngredientesDetalhes([]);
        return;
      }

      // Buscar detalhes dos ingredientes
      const ids = receitaSegura.ingredientes.map((i) => i.ingrediente_id);

      const { data: ingsData, error: ingsError } = await supabase
        .from('ingredientes')
        .select('id, nome, imagem_url')
        .in('id', ids);

      if (ingsError) throw ingsError;

      // Juntar quantity com os detalhes do ingrediente
      const joined: IngredienteDetalhado[] = receitaSegura.ingredientes.map((item) => ({
        ...item,
        ingrediente: (ingsData ?? []).find((i) => i.id === item.ingrediente_id) as Ingrediente,
      }));

      setIngredientesDetalhes(joined);
    } catch (error) {
      console.error('Erro ao carregar receita:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={cores.laranja} />
      </View>
    );
  }

  if (!receita) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: '#888' }}>Receita não encontrada.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollConteudo} overScrollMode="never">

        {/* Imagem de topo */}
        <View style={styles.imagemContainer}>
          <Image
            source={{ uri: receita.imagem_url ?? undefined }}
            style={styles.imagem}
          />

          {/* Botão voltar */}
          <TouchableOpacity
            style={styles.botaoVoltar}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={20} color="#333" />
          </TouchableOpacity>

          {/* Botão favorito */}
          <TouchableOpacity
            style={styles.botaoFavorito}
            onPress={toggleFavorito}
            disabled={favoritoLoading}
          >
            <Ionicons
              name={favorito ? 'heart' : 'heart-outline'}
              size={20}
              color={favorito ? cores.verde : '#333'}
            />
          </TouchableOpacity>
        </View>

        {/* Conteúdo principal */}
        <View style={styles.conteudo}>

          {/* Nome e tempo */}
          <View style={styles.cabecalho}>
            <Text style={styles.nome}>{receita.nome}</Text>
            <View style={styles.tempoBadge}>
              <Ionicons name="time-outline" size={14} color={cores.verde} />
              <Text style={styles.tempoTexto}> {receita.prep_tempo_min} Min</Text>
            </View>
          </View>

          {/* Valores nutricionais */}
          <View style={styles.nutricionaisGrid}>
            <View style={styles.nutriCard}>
              <MaterialCommunityIcons name="bread-slice-outline" size={24} color="orange" />
              <Text style={styles.nutriValor}>{receita.carbs_g}g H.Carb.</Text>
            </View>
            <View style={styles.nutriCard}>
              <Ionicons name="egg-outline" size={24} color="orange" />
              <Text style={styles.nutriValor}>{receita.proteinas_g}g proteína</Text>
            </View>
            <View style={styles.nutriCard}>
              <Ionicons name="flame-outline" size={24} color="orange" />
              <Text style={styles.nutriValor}>{receita.calorias} Kcal</Text>
            </View>
            <View style={styles.nutriCard}>
              <Ionicons name="pizza-outline" size={24} color="orange" />
              <Text style={styles.nutriValor}>{receita.fats_g}g gordura</Text>
            </View>
          </View>

          {/* Abas Ingredientes / Instruções */}
          <View
            style={styles.abasContainer}
            onLayout={(e) => setLarguraInternaAbas(e.nativeEvent.layout.width - 8)}
          >
            <Animated.View
              style={[
                styles.abaIndicador,
                { width: larguraIndicador, transform: [{ translateX }] },
              ]}
            />
            <TouchableOpacity
              style={styles.aba}
              onPress={() => setAbaAtiva('ingredientes')}
              activeOpacity={0.85}
            >
              <Text style={[styles.abaTexto, abaAtiva === 'ingredientes' && styles.abaTextoAtivo]}>
                Ingredientes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.aba}
              onPress={() => setAbaAtiva('instrucoes')}
              activeOpacity={0.85}
            >
              <Text style={[styles.abaTexto, abaAtiva === 'instrucoes' && styles.abaTextoAtivo]}>
                Instruções
              </Text>
            </TouchableOpacity>
          </View>

          {/* Conteúdo da aba ativa */}
          {abaAtiva === 'ingredientes' ? (
            <View>
              <Text style={styles.subTitulo}>
                {ingredientesDetalhes.length} Itens
              </Text>
              {ingredientesDetalhes.map((item, index) => (
                <View key={index} style={styles.ingredienteCard}>
                  <View style={styles.ingredienteIcone}>
                    {item.ingrediente?.imagem_url ? (
                      <Image
                        source={{ uri: item.ingrediente.imagem_url }}
                        style={styles.ingredienteImagem}
                      />
                    ) : (
                      <Text style={{ fontSize: 20 }}>🥗</Text>
                    )}
                  </View>
                  <Text style={styles.ingredienteNome}>{item.ingrediente?.nome}</Text>
                  <Text style={styles.ingredienteQtd}>{item.quantity}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View>
              {(!receita.instrucoes || receita.instrucoes.length === 0) ? (
                <Text style={{ color: '#888', textAlign: 'center', marginTop: 16 }}>
                  Sem instruções disponíveis.
                </Text>
              ) : (
                [...receita.instrucoes]
                  .sort((a, b) => a.step - b.step)
                  .map((inst) => (
                    <View key={inst.step} style={styles.instrucaoCard}>
                      <Text style={styles.instrucaoPassoTitulo}>{inst.step}º Passo</Text>
                      <Text style={styles.instrucaoTexto}>{inst.text}</Text>
                    </View>
                  ))
              )}
            </View>
          )}

          {/* Botão Gerar variação com IA */}
          <TouchableOpacity
            style={styles.botaoVariacao}
            onPress={() => setModalVariacaoVisivel(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="sparkles" size={18} color={cores.branco} />
            <Text style={styles.botaoVariacaoTexto}>  Gerar variação com IA</Text>
          </TouchableOpacity>

          {/* Receitas relacionadas */}
          <View style={styles.relacionadasHeader}>
            <Text style={styles.relacionadasTitulo}>Receitas Relacionadas</Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('ReceitasRelacionadas', {
                  receitaAtualId: receita.id,
                  ingredientesAtuais: receita.ingredientes.map((i) => i.ingrediente_id),
                  receitaAtualNome: receita.nome,
                })
              }
            >
              <Text style={styles.verMaisVerde}>Ver mais</Text>
            </TouchableOpacity>
          </View>
          <ReceitasRelacionadas
            ingredientesAtuais={receita.ingredientes.map((i) => i.ingrediente_id)}
            receitaAtualId={receita.id}
            navigation={navigation}
          />
        </View>
      </ScrollView>

      {/* Modal A — Escolher tipo de variação */}
      <Modal
        visible={modalVariacaoVisivel}
        animationType="slide"
        transparent
        onRequestClose={() => !loadingVariacao && setModalVariacaoVisivel(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => !loadingVariacao && setModalVariacaoVisivel(false)}
        >
          <Pressable
            style={styles.modalConteudo}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitulo}>Gerar variação</Text>
            <Text style={styles.modalSubtitulo}>
              Escolhe o tipo de variação que queres gerar a partir desta receita.
            </Text>

            <View style={styles.modalChipsContainer}>
              {(Object.keys(ROTULO_VARIACAO) as TipoVariacao[]).map((tipo) => {
                const ativo = tipoSelecionado === tipo && loadingVariacao;
                return (
                  <TouchableOpacity
                    key={tipo}
                    style={[styles.modalChip, ativo && styles.modalChipAtivo]}
                    onPress={() => handleGerarVariacao(tipo)}
                    disabled={loadingVariacao}
                    activeOpacity={0.8}
                  >
                    {ativo ? (
                      <View style={styles.modalChipLoadingLinha}>
                        <ActivityIndicator size="small" color={cores.branco} />
                        <Text style={[styles.modalChipTexto, styles.modalChipTextoAtivo]}>
                          {'  '}A pensar...
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.modalChipTexto}>{ROTULO_VARIACAO[tipo]}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal B — Resultado da variação */}
      <Modal
        visible={modalResultadoVisivel}
        animationType="slide"
        transparent
        onRequestClose={() => setModalResultadoVisivel(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalConteudo, { maxHeight: '85%' }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalResultadoHeader}>
              <Text style={styles.modalResultadoEtiqueta}>
                {tipoSelecionado ? ROTULO_VARIACAO[tipoSelecionado] : ''}
              </Text>
              <TouchableOpacity
                onPress={() => setModalResultadoVisivel(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>

            {variacaoGerada && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.variacaoNome}>{variacaoGerada.nome}</Text>
                <View style={styles.variacaoTempoLinha}>
                  <Ionicons name="time-outline" size={14} color={cores.verde} />
                  <Text style={styles.variacaoTempoTexto}>
                    {' '}{variacaoGerada.tempo_min} min
                  </Text>
                </View>

                {variacaoGerada.notas && (
                  <View style={styles.variacaoNotasCaixa}>
                    <Text style={styles.variacaoNotasTitulo}>Alterações</Text>
                    <Text style={styles.variacaoNotasTexto}>
                      {variacaoGerada.notas}
                    </Text>
                  </View>
                )}

                <Text style={styles.seccaoVariacaoTitulo}>Ingredientes</Text>
                {variacaoGerada.ingredientes.map((ing, i) => (
                  <Text key={i} style={styles.variacaoIngredienteLinha}>
                    • {ing.quantidade} {ing.nome}
                  </Text>
                ))}

                <Text style={[styles.seccaoVariacaoTitulo, { marginTop: 16 }]}>
                  Instruções
                </Text>
                {variacaoGerada.instrucoes.map((passo, i) => (
                  <View key={i} style={styles.variacaoPassoLinha}>
                    <Text style={styles.variacaoPassoNumero}>{i + 1}.</Text>
                    <Text style={styles.variacaoPassoTexto}>{passo}</Text>
                  </View>
                ))}

                <Text style={styles.variacaoAviso}>
                  Variação gerada por IA — verifica os passos antes de cozinhar.
                </Text>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Subcomponente: Receitas Relacionadas ──────────────
function ReceitasRelacionadas({
  ingredientesAtuais,
  receitaAtualId,
  navigation,
}: {
  ingredientesAtuais: string[];
  receitaAtualId: string;
  navigation: any;
}) {
  const [relacionadas, setRelacionadas] = useState<Receita[]>([]);

  useEffect(() => {
    async function carregar() {
      if (ingredientesAtuais.length === 0) {
        setRelacionadas([]);
        return;
      }

      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const idsValidos = ingredientesAtuais.filter((id) => UUID_REGEX.test(id));
      if (idsValidos.length === 0) {
        setRelacionadas([]);
        return;
      }

      // Filtra na BD: só receitas que partilham >= 1 ingrediente
      const orFilter = idsValidos
        .map((id) => `ingredientes.cs.[{"ingrediente_id":"${id}"}]`)
        .join(',');

      const { data, error } = await supabase
        .from('receitas')
        .select('id, nome, imagem_url, prep_tempo_min, dieta_type, ingredientes')
        .neq('id', receitaAtualId)
        .or(orFilter)
        .limit(50);

      if (error || !data) {
        setRelacionadas([]);
        return;
      }

      const idsAtuais = new Set(idsValidos);

      // Filtra as que partilham >= 1 ingrediente e ordena pelo nº de ingredientes em comum
      const filtradas = (data as (Receita & { ingredientes: ReceitaIngrediente[] })[])
        .map((r) => {
          const partilhados = (r.ingredientes ?? []).filter((i) =>
            idsAtuais.has(i.ingrediente_id)
          ).length;
          return { receita: r, partilhados };
        })
        .filter((x) => x.partilhados > 0)
        .sort((a, b) => b.partilhados - a.partilhados)
        .slice(0, 5)
        .map((x) => x.receita);

      setRelacionadas(filtradas);
    }
    carregar();
  }, [receitaAtualId]);

  if (relacionadas.length === 0) {
    return (
      <Text style={{ color: '#888', fontSize: 13, paddingVertical: 8 }}>
        Sem receitas relacionadas.
      </Text>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      overScrollMode="never"
      contentContainerStyle={styles.relacionadasScroll}
    >
      {relacionadas.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.relacionadaCard}
          onPress={() => navigation.replace('DetalheReceita', { receitaId: item.id })}
        >
          <Image
            source={{ uri: item.imagem_url ?? undefined }}
            style={styles.relacionadaImagem}
          />
          <Text style={styles.relacionadaNome} numberOfLines={2}>
            {item.nome}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ── Estilos ───────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.bege },
  scrollConteudo: { paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Imagem
  imagemContainer: { width: '100%', height: 280, position: 'relative' },
  imagem: { width: '100%', height: '100%' },
  botaoVoltar: {
    position: 'absolute',
    top: 48,
    left: 16,
    backgroundColor: cores.branco,
    borderRadius: 20,
    padding: 8,
    elevation: 3,
  },
  botaoFavorito: {
    position: 'absolute',
    top: 48,
    right: 16,
    backgroundColor: cores.branco,
    borderRadius: 20,
    padding: 8,
    elevation: 3,
  },

  // Conteúdo
  conteudo: {
    backgroundColor: cores.bege,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    padding: 20,
  },

  // Cabeçalho
  cabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  nome: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    flex: 1,
    marginRight: 12,
  },
  tempoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: cores.branco,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    elevation: 2,
  },
  tempoTexto: { fontSize: 13, color: cores.verde, fontWeight: '600' },

  // Descrição
  descricao: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 16 },
  verMaisLaranja: { color: cores.laranja, fontWeight: '600' },

  // Nutricionais
  nutricionaisGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  nutriCard: {
    width: '47%',
    backgroundColor: cores.branco,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    elevation: 2,
  },
  nutriIcone: { fontSize: 20 },
  nutriValor: { fontSize: 13, fontWeight: '600', color: '#444' },

  // Abas
  abasContainer: {
    flexDirection: 'row',
    backgroundColor: cores.branco,
    borderRadius: 25,
    padding: 4,
    marginBottom: 16,
    elevation: 2,
    position: 'relative',
  },
  abaIndicador: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    backgroundColor: cores.laranja,
    borderRadius: 22,
  },
  aba: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 22,
    alignItems: 'center',
  },
  abaTexto: { fontSize: 14, fontWeight: '600', color: '#888' },
  abaTextoAtivo: { color: cores.branco },

  // Ingredientes
  subTitulo: { fontSize: 13, color: '#888', marginBottom: 12 },
  ingredienteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: cores.branco,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    elevation: 2,
  },
  ingredienteIcone: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: cores.bege,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ingredienteImagem: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  ingredienteNome: { flex: 1, fontSize: 15, fontWeight: '600', color: '#333' },
  ingredienteQtd: { fontSize: 13, color: '#888' },

  // Instruções
  instrucaoCard: {
    backgroundColor: cores.branco,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  instrucaoPassoTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  instrucaoTexto: { fontSize: 14, color: '#444', lineHeight: 22 },

  // Relacionadas
  relacionadasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  relacionadasTitulo: { fontSize: 18, fontWeight: 'bold', color: '#222' },
  verMaisVerde: { fontSize: 14, color: cores.verde, fontWeight: 'bold' },
  relacionadasScroll: { paddingVertical: 6, paddingHorizontal: 2 },
  relacionadaCard: {
    width: 110,
    marginRight: 12,
    backgroundColor: cores.branco,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  relacionadaImagem: { width: '100%', height: 80 },
  relacionadaNome: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    padding: 8,
  },

  // Botão Gerar variação
  botaoVariacao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.laranja,
    borderRadius: 30,
    paddingVertical: 14,
    marginTop: 8,
    elevation: 3,
  },
  botaoVariacaoTexto: {
    color: cores.branco,
    fontSize: 15,
    fontWeight: 'bold',
  },

  // Modal — backdrop e contentor base
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
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CCC',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 6,
  },
  modalSubtitulo: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
    lineHeight: 18,
  },

  // Modal A — chips de tipo de variação
  modalChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  modalChip: {
    backgroundColor: cores.branco,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    elevation: 1,
  },
  modalChipAtivo: {
    backgroundColor: cores.laranja,
  },
  modalChipTexto: {
    color: '#444',
    fontSize: 14,
    fontWeight: '600',
  },
  modalChipTextoAtivo: {
    color: cores.branco,
  },
  modalChipLoadingLinha: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Modal B — resultado da variação
  modalResultadoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalResultadoEtiqueta: {
    fontSize: 12,
    fontWeight: '700',
    color: cores.laranja,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  variacaoNome: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 6,
  },
  variacaoTempoLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  variacaoTempoTexto: {
    fontSize: 13,
    color: cores.verde,
    fontWeight: '600',
  },
  variacaoNotasCaixa: {
    backgroundColor: cores.branco,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: cores.laranja,
  },
  variacaoNotasTitulo: {
    fontSize: 12,
    fontWeight: '700',
    color: cores.laranja,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  variacaoNotasTexto: {
    fontSize: 13,
    color: '#444',
    lineHeight: 19,
  },
  seccaoVariacaoTitulo: {
    fontSize: 13,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  variacaoIngredienteLinha: {
    fontSize: 14,
    color: '#444',
    marginBottom: 4,
    lineHeight: 20,
  },
  variacaoPassoLinha: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  variacaoPassoNumero: {
    fontSize: 14,
    fontWeight: '700',
    color: cores.laranja,
    width: 24,
  },
  variacaoPassoTexto: {
    flex: 1,
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  variacaoAviso: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
    fontStyle: 'italic',
    paddingHorizontal: 16,
  },
});