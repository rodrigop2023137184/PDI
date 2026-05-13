// Alert custom estilizado — substituto do Alert.alert nativo.
//
// Uso:
//   const { showAlert } = useAlert();
//   showAlert({ titulo: 'Erro', mensagem: '...', tipo: 'erro' });
//
//   showAlert({
//     titulo: 'Terminar sessão',
//     mensagem: 'Tens a certeza?',
//     tipo: 'aviso',
//     botoes: [
//       { label: 'Cancelar', estilo: 'cancelar' },
//       { label: 'Sair', estilo: 'destrutivo', onPress: () => signOut() },
//     ],
//   });

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const cores = {
  verde: '#37914B',
  laranja: '#FA9B2D',
  vermelho: '#E54B4B',
  azul: '#3B82F6',
  branco: '#FFFFFF',
};

type TipoAlerta = 'erro' | 'aviso' | 'sucesso' | 'info';
type EstiloBotao = 'primario' | 'destrutivo' | 'cancelar';
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export type Botao = {
  label: string;
  onPress?: () => void;
  estilo?: EstiloBotao;
};

export type AlertaOpcoes = {
  titulo: string;
  mensagem: string;
  tipo?: TipoAlerta;
  botoes?: Botao[];
};

type AlertContextValue = {
  showAlert: (opts: AlertaOpcoes) => void;
};

const AlertContext = createContext<AlertContextValue | null>(null);

export function useAlert(): AlertContextValue {
  const ctx = useContext(AlertContext);
  if (!ctx) {
    throw new Error('useAlert tem de ser usado dentro de <AlertProvider>');
  }
  return ctx;
}

const tipoConfig: Record<TipoAlerta, { icone: IoniconName; cor: string }> = {
  erro: { icone: 'alert-circle', cor: cores.vermelho },
  aviso: { icone: 'warning', cor: cores.laranja },
  sucesso: { icone: 'checkmark-circle', cor: cores.verde },
  info: { icone: 'information-circle', cor: cores.azul },
};

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [opcoes, setOpcoes] = useState<AlertaOpcoes | null>(null);
  const opacidade = useRef(new Animated.Value(0)).current;
  const escala = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (!opcoes) return;
    opacidade.setValue(0);
    escala.setValue(0.9);
    Animated.parallel([
      Animated.timing(opacidade, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.spring(escala, {
        toValue: 1,
        tension: 70,
        friction: 9,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opcoes]);

  function showAlert(opts: AlertaOpcoes) {
    setOpcoes(opts);
  }

  function fechar(callback?: () => void) {
    Animated.timing(opacidade, {
      toValue: 0,
      duration: 140,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setOpcoes(null);
        callback?.();
      }
    });
  }

  const tipo = opcoes?.tipo ?? 'info';
  const config = tipoConfig[tipo];
  const botoes: Botao[] =
    opcoes?.botoes ?? [{ label: 'OK', estilo: 'primario' }];

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <Modal
        visible={!!opcoes}
        transparent
        animationType="none"
        onRequestClose={() => fechar()}
      >
        <Animated.View style={[styles.backdrop, { opacity: opacidade }]}>
          <Animated.View
            style={[styles.card, { transform: [{ scale: escala }] }]}
          >
            <View
              style={[
                styles.iconeWrapper,
                { backgroundColor: config.cor + '22' },
              ]}
            >
              <Ionicons name={config.icone} size={40} color={config.cor} />
            </View>

            <Text style={styles.titulo}>{opcoes?.titulo}</Text>
            <Text style={styles.mensagem}>{opcoes?.mensagem}</Text>

            <View
              style={[
                styles.botoesContainer,
                botoes.length > 1 && styles.botoesRow,
              ]}
            >
              {botoes.map((btn, idx) => {
                const estilo = btn.estilo ?? 'primario';
                const botaoStyle =
                  estilo === 'destrutivo'
                    ? styles.botaoDestrutivo
                    : estilo === 'cancelar'
                    ? styles.botaoCancelar
                    : styles.botaoPrimario;
                const textoStyle =
                  estilo === 'cancelar'
                    ? styles.botaoTextoCancelar
                    : styles.botaoTexto;
                return (
                  <TouchableOpacity
                    key={`${btn.label}-${idx}`}
                    style={[
                      styles.botao,
                      botaoStyle,
                      botoes.length > 1 && { flex: 1 },
                    ]}
                    onPress={() => fechar(btn.onPress)}
                    activeOpacity={0.85}
                  >
                    <Text style={textoStyle}>{btn.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </AlertContext.Provider>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  card: {
    backgroundColor: cores.branco,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  iconeWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  titulo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    textAlign: 'center',
    marginBottom: 8,
  },
  mensagem: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  botoesContainer: {
    width: '100%',
    gap: 8,
  },
  botoesRow: {
    flexDirection: 'row',
  },
  botao: {
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 140,
    alignItems: 'center',
  },
  botaoPrimario: {
    backgroundColor: cores.verde,
    elevation: 2,
  },
  botaoDestrutivo: {
    backgroundColor: cores.vermelho,
    elevation: 2,
  },
  botaoCancelar: {
    backgroundColor: 'transparent',
  },
  botaoTexto: {
    color: cores.branco,
    fontSize: 15,
    fontWeight: 'bold',
  },
  botaoTextoCancelar: {
    color: '#666',
    fontSize: 15,
    fontWeight: '600',
  },
});
