import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabase';
import { RootStackParamList } from '../../App';
import AnimatedInput from '../components/AnimatedInput';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const cores = { verde: '#37914B', laranja: '#FA9B2D', bege: '#F5F0E1', branco: '#FFFFFF', cinzaTexto: '#333' };

export default function LoginScreen() {
  const navigation = useNavigation<NavProp>();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [emailError,    setEmailError]    = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  // ── Stagger de entrada ────────────────────────────
  const logoAnim   = useRef(new Animated.Value(0)).current;
  const formAnim   = useRef(new Animated.Value(0)).current;
  const bottomAnim = useRef(new Animated.Value(0)).current;
  const logoY   = logoAnim.interpolate({ inputRange: [0,1], outputRange: [40, 0] });
  const formY   = formAnim.interpolate({ inputRange: [0,1], outputRange: [30, 0] });
  const bottomY = bottomAnim.interpolate({ inputRange: [0,1], outputRange: [30, 0] });

  useEffect(() => {
    Animated.stagger(130, [
      Animated.timing(logoAnim,   { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(formAnim,   { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.timing(bottomAnim, { toValue: 1, duration: 380, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Fade-out antes de navegar ─────────────────────
  const screenOpacity = useRef(new Animated.Value(1)).current;
  function navigateWithFade(screen: keyof RootStackParamList) {
    Animated.timing(screenOpacity, { toValue: 0, duration: 200, useNativeDriver: true })
      .start(() => { screenOpacity.setValue(1); navigation.navigate(screen as any); });
  }

  // ── Login (inalterado) ────────────────────────────
  async function handleLogin() {
    let hasError = false;
    if (!email)    { setEmailError(false);    requestAnimationFrame(() => setEmailError(true));    hasError = true; }
    if (!password) { setPasswordError(false); requestAnimationFrame(() => setPasswordError(true)); hasError = true; }
    if (hasError) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) Alert.alert('Erro ao entrar', error.message);
  }

  // ── Press feedback ────────────────────────────────
  const buttonScale = useRef(new Animated.Value(1)).current;
  function onPressIn()  { Animated.spring(buttonScale, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 4 }).start(); }
  function onPressOut() { Animated.spring(buttonScale, { toValue: 1,    useNativeDriver: true, speed: 30, bounciness: 6 }).start(); }

  return (
    <Animated.View style={{ flex: 1, opacity: screenOpacity, backgroundColor: cores.bege }}>
      <Image source={require('../../assets/fundo_login.png')} style={styles.fundo} resizeMode="cover" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Grupo 1 — Logo */}
          <Animated.View style={[styles.logoContainer, { opacity: logoAnim, transform: [{ translateY: logoY }] }]}>
            <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          </Animated.View>

          {/* Grupo 2 — Campos */}
          <Animated.View style={[styles.form, { opacity: formAnim, transform: [{ translateY: formY }] }]}>
            <AnimatedInput
              label="E-mail" value={email}
              onChangeText={(t: string) => { setEmail(t); setEmailError(false); }}
              error={emailError} keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
            />
            <AnimatedInput
              label="Palavra-passe" value={password}
              onChangeText={(t: string) => { setPassword(t); setPasswordError(false); }}
              error={passwordError} secureTextEntry
            />
            <TouchableOpacity onPress={() => {}}>
              <Text style={styles.esqueceu}>Esqueceu-se da palavra-passe?</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Grupo 3 — Botão + link */}
          <Animated.View style={[styles.bottomActions, { opacity: bottomAnim, transform: [{ translateY: bottomY }] }]}>
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={[styles.botaoEntrar, loading && { opacity: 0.7 }]}
                onPress={handleLogin} onPressIn={onPressIn} onPressOut={onPressOut}
                disabled={loading} activeOpacity={1}
              >
                {loading ? <ActivityIndicator color={cores.branco} /> : <Text style={styles.botaoEntrarTexto}>Entrar</Text>}
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
  fundo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingBottom: 40 },
  logoContainer: { alignItems: 'center', marginTop: 80, marginBottom: 100 },
  logo: { width: 150, height: 150 },
  form: { width: '100%' },
  bottomActions: { width: '100%', marginTop: 8 },
  esqueceu: { color: '#FA9B2D', fontSize: 13, fontWeight: '600', marginTop: 12, marginBottom: 4 },
  botaoEntrar: { backgroundColor: '#37914B', borderRadius: 30, paddingVertical: 16, alignItems: 'center', marginTop: 28, elevation: 2 },
  botaoEntrarTexto: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  registoLinha: { flexDirection: 'row', justifyContent: 'center', marginTop: 18 },
  registoTexto: { color: '#333', fontSize: 14 },
  registoLink: { color: '#37914B', fontSize: 14, fontWeight: 'bold' },
});
