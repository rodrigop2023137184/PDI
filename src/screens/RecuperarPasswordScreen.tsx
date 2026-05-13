import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import AnimatedInput from '../animacoes/AnimatedInput';
import { useAlert } from '../../componentes/AlertaCustom';

const cores = {
  verde: '#37914B',
  laranja: '#FA9B2D',
  bege: '#FFF1CE',
  branco: '#FFFFFF',
  cinzaTexto: '#333',
};

type Passo = 'enviando' | 'codigo' | 'password';

type Props = {
  email: string;
  onConcluido: () => void;
};

export default function RecuperarPasswordScreen({ email, onConcluido }: Props) {
  const { showAlert } = useAlert();
  const [passo, setPasso] = useState<Passo>('enviando');

  const [codigo, setCodigo] = useState('');
  const [codigoError, setCodigoError] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [confirmarError, setConfirmarError] = useState(false);

  const [loading, setLoading] = useState(false);

  
  const logoAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;
  const bottomAnim = useRef(new Animated.Value(0)).current;
  const logoY = logoAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });
  const formY = formAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] });
  const bottomY = bottomAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] });

  useEffect(() => {
    Animated.stagger(130, [
      Animated.timing(logoAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(formAnim, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.timing(bottomAnim, { toValue: 1, duration: 380, useNativeDriver: true }),
    ]).start();
  }, []);

  //Envio inicial do código 
  const envioIniciado = useRef(false);
  useEffect(() => {
    if (envioIniciado.current) return;
    envioIniciado.current = true;
    (async () => {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        const msg = /rate/i.test(error.message)
          ? 'Aguarda um momento antes de pedir um novo código. Tenta de novo em cerca de 1 minuto.'
          : error.message;
        showAlert({
          titulo: 'Não foi possível enviar',
          mensagem: msg,
          tipo: 'erro',
          botoes: [{ label: 'Voltar', onPress: onConcluido }],
        });
        return;
      }
      setPasso('codigo');
    })();
  }, []);

  const buttonScale = useRef(new Animated.Value(1)).current;
  function onPressIn() { Animated.spring(buttonScale, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 4 }).start(); }
  function onPressOut() { Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start(); }

  // verificar código 
  async function handleVerificarCodigo() {
    const token = codigo.trim();
    if (!/^\d{6,10}$/.test(token)) {
      setCodigoError(false);
      requestAnimationFrame(() => setCodigoError(true));
      showAlert({
        titulo: 'Código inválido',
        mensagem: 'Introduz o código numérico que recebeste por email.',
        tipo: 'aviso',
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'recovery',
    });
    setLoading(false);

    if (error) {
      setCodigoError(false);
      requestAnimationFrame(() => setCodigoError(true));
      const msg = /expired/i.test(error.message)
        ? 'Este código expirou. Volta a iniciar a recuperação.'
        : /invalid|wrong/i.test(error.message)
        ? 'O código está incorreto. Verifica o email e tenta de novo.'
        : error.message;
      showAlert({ titulo: 'Não foi possível verificar', mensagem: msg, tipo: 'erro' });
      return;
    }

    setPasso('password');
  }

  // definir nova password
  async function handleAtualizarPassword() {
    if (loading) return;
    let hasError = false;
    if (!password || password.length < 6) {
      setPasswordError(false);
      requestAnimationFrame(() => setPasswordError(true));
      hasError = true;
    }
    if (password !== confirmar) {
      setConfirmarError(false);
      requestAnimationFrame(() => setConfirmarError(true));
      hasError = true;
    }
    if (hasError) {
      if (password && password.length < 6) {
        showAlert({
          titulo: 'Palavra-passe curta',
          mensagem: 'A palavra-passe deve ter pelo menos 6 caracteres.',
          tipo: 'aviso',
        });
      } else if (password !== confirmar) {
        showAlert({
          titulo: 'Não coincidem',
          mensagem: 'As palavras-passe introduzidas não são iguais.',
          tipo: 'aviso',
        });
      }
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setLoading(false);
      showAlert({ titulo: 'Erro', mensagem: error.message, tipo: 'erro' });
      return;
    }
    setLoading(false);

    showAlert({
      titulo: 'Palavra-passe alterada',
      mensagem:
        'A tua palavra-passe foi atualizada. Inicia sessão com a nova palavra-passe.',
      tipo: 'sucesso',
      botoes: [{ label: 'OK', onPress: onConcluido }],
    });
  }

  // ── Render ────────────────────────────────────────
  const isCodigo = passo === 'codigo';
  const isPassword = passo === 'password';
  const isEnviando = passo === 'enviando';

  const titulo = isCodigo
    ? 'Verificar email'
    : isPassword
    ? 'Nova palavra-passe'
    : 'A enviar código…';

  const subtitulo = isCodigo
    ? `Introduz o código que enviámos para ${email}.`
    : isPassword
    ? 'Escolhe uma nova palavra-passe.'
    : '';

  return (
    <View style={{ flex: 1, backgroundColor: cores.bege }}>
      <Image
        source={require('../../assets/fundo_login.png')}
        style={styles.fundo}
        resizeMode="cover"
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.logoContainer, { opacity: logoAnim, transform: [{ translateY: logoY }] }]}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.titulo}>{titulo}</Text>
            {subtitulo ? <Text style={styles.subtitulo}>{subtitulo}</Text> : null}
          </Animated.View>

          {isEnviando ? (
            <View style={styles.enviandoBox}>
              <ActivityIndicator size="large" color={cores.verde} />
            </View>
          ) : (
            <Animated.View style={[styles.form, { opacity: formAnim, transform: [{ translateY: formY }] }]}>
              {isCodigo && (
                <AnimatedInput
                  label="Código de verificação"
                  value={codigo}
                  onChangeText={(t: string) => { setCodigo(t.replace(/\D/g, '')); setCodigoError(false); }}
                  error={codigoError}
                  keyboardType="number-pad"
                  maxLength={10}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleVerificarCodigo}
                />
              )}

              {isPassword && (
                <>
                  <AnimatedInput
                    label="Nova palavra-passe"
                    value={password}
                    onChangeText={(t: string) => { setPassword(t); setPasswordError(false); }}
                    error={passwordError}
                    secureTextEntry
                    autoComplete="password-new"
                    textContentType="newPassword"
                    returnKeyType="next"
                  />
                  <AnimatedInput
                    label="Confirmar palavra-passe"
                    value={confirmar}
                    onChangeText={(t: string) => { setConfirmar(t); setConfirmarError(false); }}
                    error={confirmarError}
                    secureTextEntry
                    autoComplete="password-new"
                    textContentType="newPassword"
                    returnKeyType="done"
                    onSubmitEditing={handleAtualizarPassword}
                  />
                </>
              )}
            </Animated.View>
          )}

          {!isEnviando && (
            <Animated.View style={[styles.bottomActions, { opacity: bottomAnim, transform: [{ translateY: bottomY }] }]}>
              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity
                  style={[styles.botaoEntrar, loading && { opacity: 0.7 }]}
                  onPress={isCodigo ? handleVerificarCodigo : handleAtualizarPassword}
                  onPressIn={onPressIn}
                  onPressOut={onPressOut}
                  disabled={loading}
                  activeOpacity={1}
                >
                  {loading ? (
                    <ActivityIndicator color={cores.branco} />
                  ) : (
                    <Text style={styles.botaoEntrarTexto}>
                      {isCodigo ? 'Verificar' : 'Atualizar palavra-passe'}
                    </Text>
                  )}
                </TouchableOpacity>
              </Animated.View>

              <TouchableOpacity onPress={onConcluido} disabled={loading}>
                <Text style={styles.cancelar}>Cancelar</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  fundo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 40,
  },
  logo: {
    width: 130,
    height: 130,
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: cores.cinzaTexto,
    marginTop: 16,
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 14,
    color: cores.cinzaTexto,
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  enviandoBox: {
    alignItems: 'center',
    marginTop: 40,
  },
  form: { width: '100%' },
  bottomActions: { width: '100%', marginTop: 8 },
  botaoEntrar: {
    backgroundColor: cores.verde,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
    elevation: 2,
  },
  botaoEntrarTexto: {
    color: cores.branco,
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelar: {
    color: cores.laranja,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 18,
  },
});
