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
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { Receita } from '../../types';
import { RootStackParamList } from '../../App';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const cores = {
  verde: '#37914B',
  laranja: '#FA9B2D',
  branco: '#FFFFFF',
  bege: '#FFF1CE',
};

const TAMANHO_PAGINA = 10;

export default function TodasReceitasScreen() {
  const navigation = useNavigation<NavProp>();
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [loadingInicial, setLoadingInicial] = useState(true);
  const [loadingMais, setLoadingMais] = useState(false);
  const [temMais, setTemMais] = useState(true);

  // Refs partilhadas pelas animações dos cards.
  // - animsRef:  guarda o Animated.Value de cada receita (por id)
  // - animadosRef: ids cuja animação já disparou — evita re-animar items existentes
  const animsRef = useRef<Map<string, Animated.Value>>(new Map());
  const animadosRef = useRef<Set<string>>(new Set());
  // Guards para evitar disparos duplicados do onScroll
  const aCarregarRef = useRef(false);
  const temMaisRef = useRef(true);

  function obterAnim(id: string) {
    if (!animsRef.current.has(id)) {
      animsRef.current.set(id, new Animated.Value(0));
    }
    return animsRef.current.get(id)!;
  }

  async function carregarMais() {
    if (aCarregarRef.current || !temMaisRef.current) return;
    aCarregarRef.current = true;
    setLoadingMais(true);

    const inicio = receitas.length;
    const fim = inicio + TAMANHO_PAGINA - 1;

    try {
      const { data, error } = await supabase
        .from('receitas')
        .select('id, nome, imagem_url, prep_tempo_min, dieta_type')
        .order('data_criacao', { ascending: false })
        .range(inicio, fim);

      if (error) throw error;

      const novas = (data as Receita[]) ?? [];
      if (novas.length > 0) {
        setReceitas((prev) => [...prev, ...novas]);
      }
      if (novas.length < TAMANHO_PAGINA) {
        temMaisRef.current = false;
        setTemMais(false);
      }
    } catch (error) {
      console.error('Erro ao carregar receitas:', error);
    } finally {
      aCarregarRef.current = false;
      setLoadingMais(false);
      setLoadingInicial(false);
    }
  }

  useEffect(() => {
    carregarMais();
  }, []);

  // Anima apenas os items novos sempre que a lista cresce
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
        70,
        aAnimar.map((anim) =>
          Animated.timing(anim, {
            toValue: 1,
            duration: 380,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          })
        )
      ).start();
    }
  }, [receitas]);

  if (loadingInicial && receitas.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={cores.verde} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Decoração de fundo — linhas verdes subtis */}
      <Image
        source={require('../../assets/linha_verde1.png')}
        style={styles.linhaDecoTopo}
        resizeMode="contain"
      />
      <Image
        source={require('../../assets/linha_verde2.png')}
        style={styles.linhaDecoMeio}
        resizeMode="contain"
      />
      <Image
        source={require('../../assets/linha_verde3.png')}
        style={styles.linhaDecoBaixo}
        resizeMode="contain"
      />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={28} color="#222" />
        </TouchableOpacity>
        <Text style={styles.titulo}>Todas as receitas</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollConteudo}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const distanciaDoFundo =
            contentSize.height - (layoutMeasurement.height + contentOffset.y);
          if (distanciaDoFundo < 200) {
            carregarMais();
          }
        }}
        scrollEventThrottle={200}
      >
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
                  onPress={() => navigation.navigate('DetalheReceita', { receitaId: receita.id })}
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

        {loadingMais && (
          <View style={styles.rodape}>
            <ActivityIndicator size="small" color={cores.verde} />
          </View>
        )}

        {!temMais && receitas.length > 0 && (
          <Text style={styles.fim}>— Não há mais receitas —</Text>
        )}

        {receitas.length === 0 && !loadingInicial && (
          <Text style={styles.semResultados}>Nenhuma receita encontrada.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.bege },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: cores.bege,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
  },
  titulo: { fontSize: 20, fontWeight: 'bold', color: '#222' },
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
  rodape: { paddingVertical: 20 },
  fim: { textAlign: 'center', color: '#999', paddingVertical: 20, fontSize: 13 },
  semResultados: { textAlign: 'center', color: '#999', marginTop: 32, fontSize: 15 },

  // Decoração de fundo — linhas verdes subtis (não interceptam toques)
  linhaDecoTopo: {
    position: 'absolute',
    top: 70,
    left: -90,
    width: 380,
    height: 380,
    opacity: 0.18,
    pointerEvents: 'none',
  },
  linhaDecoMeio: {
    position: 'absolute',
    top: '32%',
    right: -120,
    width: 460,
    height: 360,
    opacity: 0.15,
    pointerEvents: 'none',
  },
  linhaDecoBaixo: {
    position: 'absolute',
    bottom: 50,
    left: 10,
    width: 180,
    height: 180,
    opacity: 0.22,
    pointerEvents: 'none',
  },
});
