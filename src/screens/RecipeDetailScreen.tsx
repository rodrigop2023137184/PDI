import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
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
  bege: '#F5F0E1',
};

const { width } = Dimensions.get('window');

// ── Componente ────────────────────────────────────────
export default function RecipeDetailScreen({ navigation, route }: Props) {
  const { receitaId } = route.params;
  const [receita, setReceita] = useState<Receita | null>(null);
  const [ingredientesDetalhes, setIngredientesDetalhes] = useState<IngredienteDetalhado[]>([]);
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState<'ingredientes' | 'instrucoes'>('ingredientes');
  const [favorito, setFavorito] = useState(false);

  useEffect(() => {
    carregarReceita();
  }, []);

  async function carregarReceita() {
    try {
      // Buscar receita completa
      const { data, error } = await supabase
        .from('receitas')
        .select('*')
        .eq('id', receitaId)
        .single();

      if (error) throw error;
      setReceita(data as Receita);

      // Buscar detalhes dos ingredientes
      const ids = (data.ingredientes as ReceitaIngrediente[]).map(i => i.ingrediente_id);

      const { data: ingsData, error: ingsError } = await supabase
        .from('ingredientes')
        .select('id, nome, imagem_url')
        .in('id', ids);

      if (ingsError) throw ingsError;

      // Juntar quantity com os detalhes do ingrediente
      const joined: IngredienteDetalhado[] = (data.ingredientes as ReceitaIngrediente[]).map(item => ({
        ...item,
        ingrediente: (ingsData ?? []).find(i => i.id === item.ingrediente_id) as Ingrediente,
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
      <ScrollView contentContainerStyle={styles.scrollConteudo}>

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
            onPress={() => setFavorito(!favorito)}
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
          <View style={styles.abasContainer}>
            <TouchableOpacity
              style={[styles.aba, abaAtiva === 'ingredientes' && styles.abaAtiva]}
              onPress={() => setAbaAtiva('ingredientes')}
            >
              <Text style={[styles.abaTexto, abaAtiva === 'ingredientes' && styles.abaTextoAtivo]}>
                Ingredientes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.aba, abaAtiva === 'instrucoes' && styles.abaAtiva]}
              onPress={() => setAbaAtiva('instrucoes')}
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
                      <Text style={styles.instrucaoPassoTitulo}>Step {inst.step}</Text>
                      <Text style={styles.instrucaoTexto}>{inst.text}</Text>
                    </View>
                  ))
              )}
            </View>
          )}

          {/* Receitas relacionadas */}
          <View style={styles.relacionadasHeader}>
            <Text style={styles.relacionadasTitulo}>Receitas Relacionadas</Text>
            <TouchableOpacity>
              <Text style={styles.verMaisVerde}>Ver mais</Text>
            </TouchableOpacity>
          </View>
          <ReceitasRelacionadas
            dietaType={receita.dieta_type}
            receitaAtualId={receita.id}
            navigation={navigation}
          />
        </View>
      </ScrollView>
    </View>
  );
}

// ── Subcomponente: Receitas Relacionadas ──────────────
function ReceitasRelacionadas({
  dietaType,
  receitaAtualId,
  navigation,
}: {
  dietaType: string | null;
  receitaAtualId: string;
  navigation: any;
}) {
  const [relacionadas, setRelacionadas] = useState<Receita[]>([]);

  useEffect(() => {
    async function carregar() {
      let query = supabase
        .from('receitas')
        .select('id, nome, imagem_url, prep_tempo_min')
        .neq('id', receitaAtualId)
        .limit(5);

      if (dietaType) query = query.eq('dieta_type', dietaType);

      const { data } = await query;
      setRelacionadas((data as Receita[]) ?? []);
    }
    carregar();
  }, []);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
  },
  aba: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 22,
    alignItems: 'center',
  },
  abaAtiva: { backgroundColor: cores.laranja },
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
});