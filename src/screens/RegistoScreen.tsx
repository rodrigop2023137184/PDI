import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  Animated,
} from 'react-native';
// Aproximação à Anton usando fontes do sistema (sem importar):
// iOS  → Impact (sans-serif condensada, muito pesada — quase idêntica à Anton)
// Android → sans-serif-condensed (com weight 900 dá um look condensed black)
const antonLike = Platform.select({ ios: 'Impact', android: 'sans-serif-condensed' });
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabase';
import { RootStackParamList } from '../../App';
import AnimatedInput from '../animacoes/AnimatedInput';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const cores = {
  verde: '#37914B',
  laranja: '#FA9B2D',
  branco: '#FFFFFF',
  bege: '#FFF1CE',
  cinzaTexto: '#333',
};

export default function RegistoScreen() {
  const navigation = useNavigation<NavProp>();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Erros por campo (disparam shake) ─────────────
  const [nameError, setNameError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passError, setPassError] = useState(false);
  const [confirmError, setConfirmError] = useState(false);

  // ── Checkmark de sucesso ──────────────────────────
  const [showCheckmark, setShowCheckmark] = useState(false);
  const checkScale = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;

  // ── Stagger de entrada ────────────────────────────
  const headerAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;
  const bottomAnim = useRef(new Animated.Value(0)).current;

  const headerY = headerAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });
  const formY = formAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] });
  const bottomY = bottomAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] });

  useEffect(() => {
    Animated.stagger(130, [
      Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(formAnim, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.timing(bottomAnim, { toValue: 1, duration: 380, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Fade-out antes de navegar ─────────────────────
  const screenOpacity = useRef(new Animated.Value(1)).current;

  function navigateWithFade(screen: keyof RootStackParamList) {
    Animated.timing(screenOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      screenOpacity.setValue(1);
      navigation.navigate(screen as any);
    });
  }

  // ── Checkmark de sucesso ──────────────────────────
  function showSuccessCheckmark(): Promise<void> {
    return new Promise((resolve) => {
      setShowCheckmark(true);
      checkScale.setValue(0);
      checkOpacity.setValue(0);

      Animated.sequence([
        Animated.parallel([
          Animated.timing(checkOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.spring(checkScale, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 12 }),
        ]),
        Animated.delay(900),
        Animated.timing(checkOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        setShowCheckmark(false);
        resolve();
      });
    });
  }

  // ── Press feedback no botão ───────────────────────
  const buttonScale = useRef(new Animated.Value(1)).current;
  function onPressIn() { Animated.spring(buttonScale, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 4 }).start(); }
  function onPressOut() { Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start(); }

  async function registar() {
    const nome = displayName.trim();
    const emailNormalizado = email.trim().toLowerCase();

    // Validação com shake por campo
    let hasError = false;
    if (!nome) {
      setNameError(false);
      requestAnimationFrame(() => setNameError(true));
      hasError = true;
    }
    if (!emailNormalizado) {
      setEmailError(false);
      requestAnimationFrame(() => setEmailError(true));
      hasError = true;
    }
    if (!password) {
      setPassError(false);
      requestAnimationFrame(() => setPassError(true));
      hasError = true;
    }
    if (!confirmPassword) {
      setConfirmError(false);
      requestAnimationFrame(() => setConfirmError(true));
      hasError = true;
    }
    if (hasError) return;

    if (nome.length < 2) {
      setNameError(false);
      requestAnimationFrame(() => setNameError(true));
      Alert.alert('Nome inválido', 'O nome deve ter pelo menos 2 caracteres.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado)) {
      setEmailError(false);
      requestAnimationFrame(() => setEmailError(true));
      Alert.alert('Email inválido', 'Verifica o formato do email.');
      return;
    }
    if (password !== confirmPassword) {
      setPassError(false); setConfirmError(false);
      requestAnimationFrame(() => { setPassError(true); setConfirmError(true); });
      Alert.alert('Palavras-passe diferentes', 'A confirmação não corresponde.');
      return;
    }
    if (password.length < 6) {
      setPassError(false);
      requestAnimationFrame(() => setPassError(true));
      Alert.alert('Palavra-passe fraca', 'A palavra-passe tem de ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: emailNormalizado,
      password,
      options: { data: { display_name: nome } },
    });

    if (error) {
      setLoading(false);
      const msg = /already registered|already exists/i.test(error.message)
        ? 'Já existe uma conta com este email.'
        : /email rate limit exceeded/i.test(error.message)
        ? 'Demasiados pedidos de registo. Tenta novamente dentro de uma hora.'
        : error.message;
      Alert.alert('Erro ao registar', msg);
      return;
    }

    // Se o utilizador foi criado E há sessão imediata (email confirmation off),
    // tentamos garantir o perfil em public.users.
    if (data.user && data.session) {
      const { error: erroInsert } = await supabase.from('users').insert({
        id: data.user.id,
        display_name: nome,
      });
      if (erroInsert && !/duplicate key|already exists/i.test(erroInsert.message)) {
        console.warn('Falha ao criar perfil public.users:', erroInsert.message);
      }
      setLoading(false);
      await showSuccessCheckmark();
      return;
    }

    // Sem sessão imediata → email confirmation está ativa.
    setLoading(false);
    await showSuccessCheckmark();
    Alert.alert(
      'Confirma o teu email',
      'Enviámos-te um link de confirmação. Confirma o email antes de iniciar sessão.',
      [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
    );
  }

  return (
    <Animated.View style={{ flex: 1, opacity: screenOpacity, backgroundColor: cores.bege }}>
      {/* Fundo ilustrado — preenche o ecrã todo */}
      <Image
        source={require('../../assets/fundo_registo.png')}
        style={styles.fundo}
        resizeMode="cover"
      />

      {/* Botão voltar */}
      <TouchableOpacity
        style={styles.botaoVoltar}
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name="chevron-back" size={28} color={cores.cinzaTexto} />
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Grupo 1 — Cabeçalho */}
          <Animated.View style={[styles.cabecalho, { opacity: headerAnim, transform: [{ translateY: headerY }] }]}>
            <Text style={styles.wordmark}>KomiKalate</Text>
            <Text style={styles.titulo}>Regista-te</Text>
          </Animated.View>

          {/* Grupo 2 — Campos */}
          <Animated.View style={[styles.form, { opacity: formAnim, transform: [{ translateY: formY }] }]}>
            <AnimatedInput
              label="Nome de Utilizador"
              value={displayName}
              onChangeText={(t: string) => { setDisplayName(t); setNameError(false); }}
              error={nameError}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
            />

            <AnimatedInput
              label="E-mail"
              value={email}
              onChangeText={(t: string) => { setEmail(t); setEmailError(false); }}
              error={emailError}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
            />

            <AnimatedInput
              label="Palavra-passe"
              value={password}
              onChangeText={(t: string) => { setPassword(t); setPassError(false); }}
              error={passError}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
            />

            <AnimatedInput
              label="Confirma a Palavra-passe"
              value={confirmPassword}
              onChangeText={(t: string) => { setConfirmPassword(t); setConfirmError(false); }}
              error={confirmError}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="done"
              onSubmitEditing={registar}
            />
          </Animated.View>

          {/* Grupo 3 — Botão + link */}
          <Animated.View style={[styles.bottomActions, { opacity: bottomAnim, transform: [{ translateY: bottomY }] }]}>
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={[styles.botaoRegistar, loading && { opacity: 0.7 }]}
                onPress={registar}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                disabled={loading}
                activeOpacity={1}
              >
                {loading ? (
                  <ActivityIndicator color={cores.branco} />
                ) : (
                  <Text style={styles.botaoRegistarTexto}>Registar</Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.loginLinha}>
              <Text style={styles.loginTexto}>Já tens conta? </Text>
              <TouchableOpacity onPress={() => navigateWithFade('Login')}>
                <Text style={styles.loginLink}>Inicia sessão</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Overlay do checkmark de sucesso */}
      {showCheckmark && (
        <View style={styles.checkmarkOverlay} pointerEvents="none">
          <Animated.View style={[styles.checkmarkContainer, { opacity: checkOpacity, transform: [{ scale: checkScale }] }]}>
            <Ionicons name="checkmark-circle" size={96} color={cores.verde} />
            <Text style={styles.checkmarkTexto}>Conta criada!</Text>
          </Animated.View>
        </View>
      )}
    </Animated.View>
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
  botaoVoltar: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 10,
    padding: 4,
  },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingBottom: 40,
  },

  // Cabeçalho — wordmark + título
  cabecalho: {
    marginTop: 60,
    marginBottom: 20,
  },
  wordmark: {
    fontFamily: antonLike,
    fontSize: 42,
    fontWeight: '900',
    color: cores.laranja,
    marginBottom: 4,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: cores.verde,
  },

  // Formulário
  form: { width: '100%' },
  bottomActions: { width: '100%' },

  // Botão
  botaoRegistar: {
    backgroundColor: cores.verde,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
    elevation: 2,
  },
  botaoRegistarTexto: {
    color: cores.branco,
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginLinha: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
  },
  loginTexto: { color: cores.cinzaTexto, fontSize: 14 },
  loginLink: { color: cores.verde, fontSize: 14, fontWeight: 'bold' },

  // Checkmark overlay
  checkmarkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245, 240, 225, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  checkmarkContainer: { alignItems: 'center', gap: 12 },
  checkmarkTexto: { fontSize: 20, fontWeight: '700', color: cores.verde },
});