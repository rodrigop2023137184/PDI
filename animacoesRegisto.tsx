import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabase';
import { RootStackParamList } from '../../App';
import AnimatedInput from '../components/AnimatedInput';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const cores = {
  verde:      '#37914B',
  laranja:    '#FA9B2D',
  branco:     '#FFFFFF',
  bege:       '#F5F0E1',
  cinzaTexto: '#333',
};

export default function RegistoScreen() {
  const navigation = useNavigation<NavProp>();

  const [displayName,      setDisplayName]      = useState('');
  const [email,            setEmail]            = useState('');
  const [password,         setPassword]         = useState('');
  const [confirmPassword,  setConfirmPassword]  = useState('');
  const [loading,          setLoading]          = useState(false);

  // ── Erros por campo (disparam shake) ─────────────
  const [nameError,    setNameError]    = useState(false);
  const [emailError,   setEmailError]   = useState(false);
  const [passError,    setPassError]    = useState(false);
  const [confirmError, setConfirmError] = useState(false);

  // ── Checkmark de sucesso ──────────────────────────
  const [showCheckmark, setShowCheckmark] = useState(false);
  const checkScale   = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;

  // ── Valores animados de entrada ───────────────────
  const headerAnim = useRef(new Animated.Value(0)).current;
  const formAnim   = useRef(new Animated.Value(0)).current;
  const bottomAnim = useRef(new Animated.Value(0)).current;

  const headerY = headerAnim.interpolate({ inputRange: [0,1], outputRange: [40, 0] });
  const formY   = formAnim.interpolate({ inputRange: [0,1], outputRange: [30, 0] });
  const bottomY = bottomAnim.interpolate({ inputRange: [0,1], outputRange: [30, 0] });

  /**
   * Animação 1 — Stagger de entrada
   */
  useEffect(() => {
    Animated.stagger(130, [
      Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(formAnim,   { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.timing(bottomAnim, { toValue: 1, duration: 380, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Fade-out da tela antes de navegar ─────────────
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

  /**
   * Animação 6 — Checkmark de sucesso
   * Pop scale + fade-in → aguarda 900ms → fade-out → resolve Promise
   */
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

  // ── Lógica de registo (inalterada) ────────────────
  async function registar() {
    // Validação com shake por campo em vez de Alert genérico
    let hasError = false;
    if (!displayName) {
      setNameError(false);
      requestAnimationFrame(() => setNameError(true));
      hasError = true;
    }
    if (!email) {
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

    if (password !== confirmPassword) {
      setPassError(false); setConfirmError(false);
      requestAnimationFrame(() => { setPassError(true); setConfirmError(true); });
      return;
    }
    if (password.length < 6) {
      setPassError(false);
      requestAnimationFrame(() => setPassError(true));
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });

    if (error) {
      setLoading(false);
      Alert.alert('Erro ao registar', error.message);
      return;
    }

    if (data.user) {
      const { error: erroInsert } = await supabase.from('users').insert({
        id: data.user.id,
        display_name: displayName,
      });
      if (erroInsert) console.warn('Falha ao criar perfil public.users:', erroInsert.message);
    }

    setLoading(false);

    // Animação 6 — checkmark antes do Alert
    await showSuccessCheckmark();
    Alert.alert('Conta criada', 'Confirma o email (se aplicável) e inicia sessão.');
    navigation.navigate('Login');
  }

  // ── Press feedback no botão ───────────────────────
  const buttonScale = useRef(new Animated.Value(1)).current;

  function onPressIn() {
    Animated.spring(buttonScale, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  }
  function onPressOut() {
    Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
  }

  return (
    <Animated.View style={{ flex: 1, opacity: screenOpacity, backgroundColor: cores.bege }}>

      {/* Fundo ilustrado — preservado do original */}
      <Image source={require('../../assets/fundo_registo.png')} style={styles.fundo} resizeMode="cover" />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/*
            Animação 1 — Grupo 1: Cabeçalho (wordmark + título)
            Entra com fade + slide de 40dp para cima
          */}
          <Animated.View style={[styles.cabecalho, { opacity: headerAnim, transform: [{ translateY: headerY }] }]}>
            <Text style={styles.wordmark}>KomiKalate</Text>
            <Text style={styles.titulo}>Regista-te</Text>
          </Animated.View>

          {/*
            Animação 1 — Grupo 2: Campos
            Animação 2 (floating label) e 3 (shake) dentro de AnimatedInput
          */}
          <Animated.View style={[styles.form, { opacity: formAnim, transform: [{ translateY: formY }] }]}>

            <AnimatedInput
              label="Nome de Utilizador"
              value={displayName}
              onChangeText={(t: string) => { setDisplayName(t); setNameError(false); }}
              error={nameError}
              autoCapitalize="words"
            />

            <AnimatedInput
              label="E-mail"
              value={email}
              onChangeText={(t: string) => { setEmail(t); setEmailError(false); }}
              error={emailError}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <AnimatedInput
              label="Palavra-passe"
              value={password}
              onChangeText={(t: string) => { setPassword(t); setPassError(false); }}
              error={passError}
              secureTextEntry
            />

            <AnimatedInput
              label="Confirma a Palavra-passe"
              value={confirmPassword}
              onChangeText={(t: string) => { setConfirmPassword(t); setConfirmError(false); }}
              error={confirmError}
              secureTextEntry
            />
          </Animated.View>

          {/* Animação 1 — Grupo 3: Botão + link */}
          <Animated.View style={[styles.bottomActions, { opacity: bottomAnim, transform: [{ translateY: bottomY }] }]}>

            {/* Animação 4 — Press feedback */}
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={[styles.botaoRegistar, loading && { opacity: 0.7 }]}
                onPress={registar}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                disabled={loading}
                activeOpacity={1}
              >
                {loading
                  ? <ActivityIndicator color={cores.branco} />
                  : <Text style={styles.botaoRegistarTexto}>Registar</Text>
                }
              </TouchableOpacity>
            </Animated.View>

            {/* Animação 5 — Fade-out antes de navegar */}
            <View style={styles.loginLinha}>
              <Text style={styles.loginTexto}>Já tens conta? </Text>
              <TouchableOpacity onPress={() => navigateWithFade('Login')}>
                <Text style={styles.loginLink}>Inicia sessão</Text>
              </TouchableOpacity>
            </View>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/*
        Animação 6 — Overlay do checkmark de sucesso
        Aparece após registo bem-sucedido, antes do Alert.
      */}
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
    top: 0, left: 0, right: 0, bottom: 0,
    width: '100%', height: '100%',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  cabecalho: {
    marginTop: 60,
    marginBottom: 20,
  },
  wordmark: {
    fontSize: 34,
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: cores.laranja,
    marginBottom: 4,
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: cores.verde,
  },
  form: { width: '100%' },
  bottomActions: { width: '100%' },
  botaoRegistar: {
    backgroundColor: cores.verde,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
    elevation: 2,
  },
  botaoRegistarTexto: { color: cores.branco, fontSize: 16, fontWeight: 'bold' },
  loginLinha: { flexDirection: 'row', justifyContent: 'center', marginTop: 18 },
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