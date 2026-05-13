import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { Receita } from '../../types';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAlert } from '../../componentes/AlertaCustom';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const cores = {
  verde: '#37914B',
  laranja: '#FA9B2D',
  branco: '#FFFFFF',
  bege: '#FFF1CE',
};

export default function ProfileScreen() {
  const navigation = useNavigation<NavProp>();
  const { showAlert } = useAlert();
  const [nomeUtilizador, setNomeUtilizador] = useState<string | null>(null);
  const [favoritos, setFavoritos] = useState<Receita[]>([]);
  const [loading, setLoading] = useState(true);
  const [logado, setLogado] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      carregarPerfil();
    });

    return () => subscription.unsubscribe();
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarPerfil();
    }, [])
  );

  async function carregarPerfil() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLogado(false);
        setNomeUtilizador(null);
        setFavoritos([]);
        setLoading(false);
        return;
      }

      setLogado(true);

      const { data: perfil } = await supabase
        .from('users')
        .select('display_name')
        .eq('id', user.id)
        .maybeSingle();

      if (perfil?.display_name && perfil.display_name.trim() !== '') {
        setNomeUtilizador(perfil.display_name);
      } else {
        setNomeUtilizador('Utilizador');
      }

      const { data: favData, error } = await supabase
        .from('user_favoritos')
        .select('receitas_id, receita:receitas(id, nome, imagem_url, prep_tempo_min, dieta_type)')
        .eq('user_id', user.id);

      if (!error && favData) {
        const receitasFav = favData
          .map((f: any) => f.receita)
          .filter(Boolean) as Receita[];
        setFavoritos(receitasFav);
      } else {
        setFavoritos([]);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  }

  // Animações stagger dos cards de favoritos: cada novo array gera valores 0→1
  const animacoesItens = useMemo(
    () => favoritos.map(() => new Animated.Value(0)),
    [favoritos]
  );

  useEffect(() => {
    if (animacoesItens.length === 0) return;
    Animated.stagger(
      70,
      animacoesItens.map((anim) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })
      )
    ).start();
  }, [animacoesItens]);

  async function removerFavorito(receitaId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const favoritosAnteriores = favoritos;
    setFavoritos((prev) => prev.filter((r) => r.id !== receitaId));

    const { error } = await supabase
      .from('user_favoritos')
      .delete()
      .eq('user_id', user.id)
      .eq('receitas_id', receitaId);

    if (error) {
      setFavoritos(favoritosAnteriores);
      showAlert({
        titulo: 'Erro',
        mensagem: 'Não foi possível remover dos favoritos.',
        tipo: 'erro',
      });
      console.warn('Erro ao remover favorito:', error.message);
    }
  }

  async function handleLogout() {
    showAlert({
      titulo: 'Terminar sessão',
      mensagem: 'Tens a certeza que queres sair?',
      tipo: 'aviso',
      botoes: [
        { label: 'Cancelar', estilo: 'cancelar' },
        {
          label: 'Sair',
          estilo: 'destrutivo',
          onPress: async () => {
            await supabase.auth.signOut();
            // O onAuthStateChange em App.tsx deteta SIGNED_OUT e troca para
            // AuthNavigator automaticamente.
          },
        },
      ],
    });
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={cores.verde} />
      </View>
    );
  }

  if (!logado) {
    return (
      <View style={styles.anonContainer}>
        <Ionicons name="person-circle-outline" size={90} color="#ccc" />
        <Text style={styles.anonTitulo}>Ainda não tens conta?</Text>
        <Text style={styles.anonSubtitulo}>
          Inicia sessão para guardar as tuas receitas favoritas e personalizar a tua experiência.
        </Text>
        <TouchableOpacity
          style={styles.botaoIniciarSessao}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.botaoIniciarSessaoTexto}>Iniciar Sessão</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.botaoCriarConta}
          onPress={() => navigation.navigate('Registo')}
        >
          <Text style={styles.botaoCriarContaTexto}>Criar Nova Conta</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollConteudo} overScrollMode="never">
      <View style={styles.cartaoPerfil}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle" size={56} color={cores.verde} />
        </View>
        <Text style={styles.nomeTexto}>{nomeUtilizador}</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.botaoLogout}>
          <Ionicons name="log-out-outline" size={24} color="#888" />
        </TouchableOpacity>
      </View>

      <Text style={styles.tituloSecao}>Favoritos</Text>

      {favoritos.length === 0 ? (
        <Text style={styles.semFavoritos}>Ainda não tens receitas favoritas.</Text>
      ) : (
        <View style={styles.grelha}>
          {favoritos.map((receita, index) => {
            const anim = animacoesItens[index];
            const translateY = anim
              ? anim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] })
              : 0;
            return (
              <Animated.View
                key={receita.id}
                style={[styles.cardFavWrapper, { opacity: anim ?? 1, transform: [{ translateY }] }]}
              >
                <TouchableOpacity
                  style={styles.cardFav}
                  onPress={() => navigation.navigate('DetalheReceita', { receitaId: receita.id })}
                >
                  <Image source={{ uri: receita.imagem_url ?? undefined }} style={styles.imagemFav} />
                  <TouchableOpacity
                    style={styles.iconeFav}
                    onPress={() => removerFavorito(receita.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="heart" size={18} color={cores.verde} />
                  </TouchableOpacity>
                  <Text style={styles.nomeReceita} numberOfLines={2}>{receita.nome}</Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.bege },
  scrollConteudo: { padding: 16, paddingBottom: 90 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: cores.bege },
  anonContainer: {
    flex: 1,
    backgroundColor: cores.bege,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  anonTitulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 8,
    textAlign: 'center',
  },
  anonSubtitulo: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  botaoIniciarSessao: {
    backgroundColor: cores.verde,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    elevation: 2,
    width: '100%',
    alignItems: 'center',
  },
  botaoIniciarSessaoTexto: { color: cores.branco, fontSize: 16, fontWeight: '700' },
  botaoCriarConta: { paddingVertical: 12, width: '100%', alignItems: 'center' },
  botaoCriarContaTexto: { color: cores.verde, fontSize: 15, fontWeight: '600' },
  cartaoPerfil: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: cores.branco,
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    marginBottom: 24,
    elevation: 2,
  },
  avatarContainer: { marginRight: 12 },
  nomeTexto: { flex: 1, fontSize: 20, fontWeight: 'bold', color: '#222' },
  botaoLogout: { padding: 4 },
  tituloSecao: { fontSize: 22, fontWeight: 'bold', color: '#222', marginBottom: 16 },
  semFavoritos: { textAlign: 'center', color: '#999', marginTop: 32, fontSize: 15 },
  grelha: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cardFavWrapper: { width: '47%', marginBottom: 4 },
  cardFav: {
    backgroundColor: cores.branco,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
  },
  imagemFav: { width: '100%', height: 130 },
  iconeFav: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: cores.branco,
    borderRadius: 20,
    padding: 4,
    elevation: 3,
  },
  nomeReceita: { fontSize: 13, fontWeight: '700', color: '#222', padding: 10 },
});