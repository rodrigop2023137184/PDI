import React, { useEffect, useRef, useState } from 'react';
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
import AnimatedInput from '../animacoes/AnimatedInput';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const cores = {
  verde: '#37914B',
  laranja: '#FA9B2D',
  bege: '#FFF1CE',
  branco: '#FFFFFF',
  cinzaTexto: '#333',
};

export default function LoginScreen() {
  const navigation = useNavigation<NavProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  // ── Stagger de entrada ────────────────────────────
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

  // ── Fade-out antes de navegar ─────────────────────
  const screenOpacity = useRef(new Animated.Value(1)).current;
  function navigateWithFade(screen: keyof RootStackParamList) {
    Animated.timing(screenOpacity, { toValue: 0, duration: 200, useNativeDriver: true })
      .start(() => { screenOpacity.setValue(1); navigation.navigate(screen as any); });
  }

  // ── Press feedback ────────────────────────────────
  const buttonScale = useRef(new Animated.Value(1)).current;
  function onPressIn() { Animated.spring(buttonScale, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 4 }).start(); }
  function onPressOut() { Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start(); }

  async function handleLogin() {
    const emailNormalizado = email.trim().toLowerCase();

    let hasError = false;
    if (!emailNormalizado) { setEmailError(false); requestAnimationFrame(() => setEmailError(true)); hasError = true; }
    if (!password) { setPasswordError(false); requestAnimationFrame(() => setPasswordError(true)); hasError = true; }
    if (hasError) return;

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: emailNormalizado,
      password,
    });
    setLoading(false);

    if (error) {
      // Uniformizar resposta para evitar enumeração de contas.
      const msg = /Invalid login credentials/i.test(error.message)
        ? 'Email ou palavra-passe incorretos.'
        : /Email not confirmed/i.test(error.message)
        ? 'Confirma o teu email antes de iniciares sessão.'
        : error.message;
      Alert.alert('Erro ao entrar', msg);
      return;
    }
    // Sucesso → onAuthStateChange dispara em App.tsx e o stack troca para Tabs automaticamente.
  }

  async function handleResetPassword() {
    const emailNormalizado = email.trim().toLowerCase();
    if (!emailNormalizado || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado)) {
      setEmailError(false);
      requestAnimationFrame(() => setEmailError(true));
      Alert.alert('Email em falta', 'Introduz o teu email no campo acima primeiro.');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(emailNormalizado, {
      redirectTo: 'komikalate://reset-password',
    });
    if (error) {
      Alert.alert('Erro', error.message);
      return;
    }
    Alert.alert(
      'Email enviado',
      'Verifica a tua caixa de correio e segue as instruções para redefinir a palavra-passe.'
    );
  }

  return (
    <Animated.View style={{ flex: 1, opacity: screenOpacity, backgroundColor: cores.bege }}>
      {/* Fundo ilustrado — preenche o ecrã todo */}
      <Image
        source={require('../../assets/fundo_login.png')}
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
          {/* Grupo 1 — Logo */}
          <Animated.View style={[styles.logoContainer, { opacity: logoAnim, transform: [{ translateY: logoY }] }]}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Grupo 2 — Campos */}
          <Animated.View style={[styles.form, { opacity: formAnim, transform: [{ translateY: formY }] }]}>
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
              onChangeText={(t: string) => { setPassword(t); setPasswordError(false); }}
              error={passwordError}
              secureTextEntry
              autoComplete="password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />

            <TouchableOpacity onPress={handleResetPassword}>
              <Text style={styles.esqueceu}>Esqueceu-se da palavra-passe?</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Grupo 3 — Botão + link */}
          <Animated.View style={[styles.bottomActions, { opacity: bottomAnim, transform: [{ translateY: bottomY }] }]}>
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={[styles.botaoEntrar, loading && { opacity: 0.7 }]}
                onPress={handleLogin}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                disabled={loading}
                activeOpacity={1}
              >
                {loading ? (
                  <ActivityIndicator color={cores.branco} />
                ) : (
                  <Text style={styles.botaoEntrarTexto}>Entrar</Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.registoLinha}>
              <Text style={styles.registoTexto}>Não tens conta? </Text>
              <TouchableOpacity onPress={() => navigateWithFade('Registo')}>
                <Text style={styles.registoLink}>Regista-te</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
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

  // Logo
  logoContainer: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 100,
  },
  logo: {
    width: 150,
    height: 150,
  },

  // Formulário
  form: { width: '100%' },
  bottomActions: { width: '100%', marginTop: 8 },
  esqueceu: {
    color: cores.laranja,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },

  // Botão
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

  // Registo
  registoLinha: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
  },
  registoTexto: { color: cores.cinzaTexto, fontSize: 14 },
  registoLink: { color: cores.verde, fontSize: 14, fontWeight: 'bold' },
});