import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { Receita, ReceitaIngrediente } from '../../types';
import { RootStackParamList } from '../../App';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'ReceitasRelacionadas'>;
type RouteProps = RouteProp<RootStackParamList, 'ReceitasRelacionadas'>;

const cores = {
  verde: '#37914B',
  laranja: '#FA9B2D',
  branco: '#FFFFFF',
  bege: '#FFF1CE',
};

export default function ReceitasRelacionadasScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { receitaAtualId, ingredientesAtuais, receitaAtualNome } = route.params;

  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [loading, setLoading] = useState(true);

  // Refs para animar apenas os items novos uma única vez
  const animsRef = useRef<Map<string, Animated.Value>>(new Map());
  const animadosRef = useRef<Set<string>>(new Set());

  function obterAnim(id: string) {
    if (!animsRef.current.has(id)) {
      animsRef.current.set(id, new Animated.Value(0));
    }
    return animsRef.current.get(id)!;
  }

  useEffect(() => {
    async function carregar() {
      if (ingredientesAtuais.length === 0) {
        setReceitas([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('receitas')
        .select('id, nome, imagem_url, prep_tempo_min, dieta_type, ingredientes')
        .neq('id', receitaAtualId);

      if (error || !data) {
        setReceitas([]);
        setLoading(false);
        return;
      }

      const idsAtuais = new Set(ingredientesAtuais);

      const filtradas = (data as (Receita & { ingredientes: ReceitaIngrediente[] })[])
        .map((r) => {
          const partilhados = (r.ingredientes ?? []).filter((i) =>
            idsAtuais.has(i.ingrediente_id)
          ).length;
          return { receita: r, partilhados };
        })
        .filter((x) => x.partilhados > 0)
        .sort((a, b) => b.partilhados - a.partilhados)
        .map((x) => x.receita);

      setReceitas(filtradas);
      setLoading(false);
    }
    carregar();
  }, [receitaAtualId, ingredientesAtuais]);

  // Anima os items novos com stagger
  useEffect(() => {
    const aAnimar: Animated.Value[] = [];
    receitas.forEach((r) => {
      if (!animadosRef.current.has(r.id)) {
        animadosRef.current.add(r.id);
        aAnimar.push(obterAnim(r.id));
      }
    });
    if (aAnimar.length > 0) {
      Animated.stagger(
        40,
        aAnimar.map((anim) =>
          Animated.timing(anim, {
            toValue: 1,
            duration: 360,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          })
        )
      ).start();
    }
  }, [receitas]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={28} color="#222" />
        </TouchableOpacity>
        <Text style={styles.titulo} numberOfLines={1}>Receitas relacionadas</Text>
        <View style={{ width: 28 }} />
      </View>

      {receitaAtualNome ? (
        <Text style={styles.subtitulo} numberOfLines={1}>
          com "{receitaAtualNome}"
        </Text>
      ) : null}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={cores.verde} />
        </View>
      ) : receitas.length === 0 ? (
        <Text style={styles.semResultados}>
          Nenhuma receita relacionada encontrada.
        </Text>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollConteudo}>
          <View style={styles.grelha}>
            {receitas.map((receita) => {
              const anim = obterAnim(receita.id);
              const translateY = anim.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              });
              return (
                <Animated.View
                  key={receita.id}
                  style={[styles.cardWrapper, { opacity: anim, transform: [{ translateY }] }]}
                >
                  <TouchableOpacity
                    style={styles.card}
                    onPress={() => navigation.replace('DetalheReceita', { receitaId: receita.id })}
                  >
                    <Image
                      source={{ uri: receita.imagem_url ?? undefined }}
                      style={styles.imagem}
                    />
                    <Text style={styles.nomeReceita} numberOfLines={2}>
                      {receita.nome}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.bege },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 8,
  },
  titulo: { fontSize: 20, fontWeight: 'bold', color: '#222' },
  subtitulo: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  scrollConteudo: { padding: 16, paddingBottom: 40 },
  grelha: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cardWrapper: { width: '47%', marginBottom: 4 },
  card: {
    backgroundColor: cores.branco,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
  },
  imagem: { width: '100%', height: 130 },
  nomeReceita: { fontSize: 13, fontWeight: '700', color: '#222', padding: 10 },
  semResultados: {
    textAlign: 'center',
    color: '#999',
    marginTop: 48,
    fontSize: 15,
    paddingHorizontal: 32,
  },
});
