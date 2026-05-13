import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { sugerirReceitas, ReceitaIA } from '../../lib/ia';
import { supabase } from '../../lib/supabase';
import { RootStackParamList } from '../../App';
import { useAlert } from '../../componentes/AlertaCustom';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const cores = {
  verde: '#37914B',
  laranja: '#FA9B2D',
  branco: '#FFFFFF',
  bege: '#FFF1CE',
  cinzaTexto: '#333',
};

export default function SugestaoIAScreen() {
  const navigation = useNavigation<NavProp>();
  const { showAlert } = useAlert();
  const [texto, setTexto] = useState('');
  const [loading, setLoading] = useState(false);
  const [receitas, setReceitas] = useState<ReceitaIA[]>([]);
  const [expandida, setExpandida] = useState<number | null>(null);
  const animsRef = useRef<Map<string, Animated.Value>>(new Map());
  const animadosRef = useRef<Set<string>>(new Set());

  function obterAnim(chave: string) {
    if (!animsRef.current.has(chave)) {
      animsRef.current.set(chave, new Animated.Value(0));
    }
    return animsRef.current.get(chave)!;
  }

  useEffect(() => {
    const aAnimar: Animated.Value[] = [];
    receitas.forEach((r, i) => {
      const chave = `${i}-${r.nome}`;
      if (!animadosRef.current.has(chave)) {
        animadosRef.current.add(chave);
        aAnimar.push(obterAnim(chave));
      }
    });
    if (aAnimar.length > 0) {
      Animated.stagger(
        90,
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

  async function handleSugerir() {
    const ingredientes = texto
      .split(/[,\n]/)
      .map((i) => i.trim())
      .filter((i) => i.length > 0);

    if (ingredientes.length === 0) {
      showAlert({
        titulo: 'Lista vazia',
        mensagem: 'Escreve pelo menos um ingrediente para receberes sugestões.',
        tipo: 'aviso',
      });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      showAlert({
        titulo: 'Ups! Precisas de uma conta',
        mensagem:
          'A sugestão por IA é uma funcionalidade exclusiva para utilizadores registados. Faz login ou cria conta para experimentar.',
        tipo: 'aviso',
      });
      return;
    }

    setLoading(true);
    setReceitas([]);
    animsRef.current.clear();
    animadosRef.current.clear();

    try {
      const resultado = await sugerirReceitas(ingredientes);
      setReceitas(resultado);
      if (resultado.length === 0) {
        showAlert({
          titulo: 'Sem sugestões',
          mensagem:
            'A IA não conseguiu sugerir receitas com esses ingredientes. Tenta adicionar mais ingredientes.',
          tipo: 'info',
        });
      }
    } catch (error) {
      const mensagem =
        error instanceof Error ? error.message : 'Erro desconhecido';
      showAlert({ titulo: 'Erro', mensagem, tipo: 'erro' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={28} color="#222" />
        </TouchableOpacity>
        <View style={styles.tituloContainer}>
          <Ionicons name="sparkles" size={18} color={cores.laranja} />
          <Text style={styles.titulo}>Sugerir com IA</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollConteudo}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.subtitulo}>
            Diz-me que ingredientes tens em casa e eu sugiro-te receitas.
          </Text>

          <TextInput
            style={styles.input}
            value={texto}
            onChangeText={setTexto}
            placeholder="Ex: ovos, farinha, leite, açúcar, manteiga"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            editable={!loading}
            textAlignVertical="top"
          />

          <Text style={styles.dica}>
            Separa os ingredientes por vírgula ou linha
          </Text>

          <TouchableOpacity
            style={[styles.botao, loading && { opacity: 0.7 }]}
            onPress={handleSugerir}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <View style={styles.loadingLinha}>
                <ActivityIndicator color={cores.branco} />
                <Text style={styles.botaoTexto}>  A pensar...</Text>
              </View>
            ) : (
              <>
                <Ionicons name="sparkles" size={18} color={cores.branco} />
                <Text style={styles.botaoTexto}>  Sugerir receitas</Text>
              </>
            )}
          </TouchableOpacity>

          {receitas.length > 0 && (
            <Text style={styles.tituloResultados}>
              {receitas.length === 1
                ? 'Sugestão para ti'
                : `${receitas.length} sugestões para ti`}
            </Text>
          )}

          {receitas.map((receita, index) => {
            const chave = `${index}-${receita.nome}`;
            const anim = obterAnim(chave);
            const translateY = anim.interpolate({
              inputRange: [0, 1],
              outputRange: [30, 0],
            });
            const aberta = expandida === index;
            return (
              <Animated.View
                key={chave}
                style={[
                  styles.card,
                  { opacity: anim, transform: [{ translateY }] },
                ]}
              >
                <TouchableOpacity
                  style={styles.cardHeader}
                  onPress={() => setExpandida(aberta ? null : index)}
                  activeOpacity={0.8}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardNome}>{receita.nome}</Text>
                    <View style={styles.tempoLinha}>
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color={cores.verde}
                      />
                      <Text style={styles.tempoTexto}>
                        {' '}
                        {receita.tempo_min} min
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name={aberta ? 'chevron-up' : 'chevron-down'}
                    size={22}
                    color="#888"
                  />
                </TouchableOpacity>

                {aberta && (
                  <View style={styles.cardCorpo}>
                    <Text style={styles.seccaoTitulo}>Ingredientes</Text>
                    {receita.ingredientes.map((ing, i) => (
                      <Text key={i} style={styles.ingredienteLinha}>
                        • {ing.quantidade} {ing.nome}
                      </Text>
                    ))}

                    <Text style={[styles.seccaoTitulo, { marginTop: 12 }]}>
                      Instruções
                    </Text>
                    {receita.instrucoes.map((passo, i) => (
                      <View key={i} style={styles.passoLinha}>
                        <Text style={styles.passoNumero}>{i + 1}.</Text>
                        <Text style={styles.passoTexto}>{passo}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </Animated.View>
            );
          })}

          {!loading && receitas.length > 0 && (
            <Text style={styles.aviso}>
              Receitas geradas por IA — verifica sempre os passos antes de cozinhar.
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.bege },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
  },
  tituloContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  titulo: { fontSize: 20, fontWeight: 'bold', color: '#222' },
  scrollConteudo: { padding: 16, paddingBottom: 40 },
  subtitulo: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  input: {
    backgroundColor: cores.branco,
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: cores.cinzaTexto,
    minHeight: 110,
    elevation: 2,
  },
  dica: {
    fontSize: 12,
    color: '#888',
    marginTop: 6,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  botao: {
    backgroundColor: cores.laranja,
    borderRadius: 30,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  botaoTexto: {
    color: cores.branco,
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingLinha: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tituloResultados: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 28,
    marginBottom: 12,
  },
  card: {
    backgroundColor: cores.branco,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  cardNome: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginBottom: 4,
  },
  tempoLinha: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tempoTexto: { fontSize: 13, color: cores.verde, fontWeight: '600' },
  cardCorpo: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0E8D0',
    paddingTop: 12,
  },
  seccaoTitulo: {
    fontSize: 13,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  ingredienteLinha: {
    fontSize: 14,
    color: '#444',
    marginBottom: 4,
    lineHeight: 20,
  },
  passoLinha: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  passoNumero: {
    fontSize: 14,
    fontWeight: '700',
    color: cores.laranja,
    width: 24,
  },
  passoTexto: {
    flex: 1,
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  aviso: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
    paddingHorizontal: 16,
  },
});
