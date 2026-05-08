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
import { supabase } from '../../lib/supabase';
import AnimatedInput from '../animacoes/AnimatedInput';

const cores = {
  verde: '#37914B',
  laranja: '#FA9B2D',
  bege: '#FFF1CE',
  branco: '#FFFFFF',
  cinzaTexto: '#333',
};

type Props = {
  onConcluido: () => void;
};

export default function RecuperarPasswordScreen({ onConcluido }: Props) {
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [confirmarError, setConfirmarError] = useState(false);

  // Stagger de entrada
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

  const buttonScale = useRef(new Animated.Value(1)).current;
  function onPressIn() { Animated.spring(buttonScale, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 4 }).start(); }
  function onPressOut() { Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start(); }

  async function handleSubmit() {
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
        Alert.alert('Palavra-passe curta', 'A palavra-passe deve ter pelo menos 6 caracteres.');
      } else if (password !== confirmar) {
        Alert.alert('Não coincidem', 'As palavras-passe introduzidas não são iguais.');
      }
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setLoading(false);
      Alert.alert('Erro', error.message);
      return;
    }

    // Termina a sessão de recovery e devolve o user ao login
    await supabase.auth.signOut();
    setLoading(false);
    Alert.alert(
      'Palavra-passe alterada',
      'A tua palavra-passe foi atualizada. Inicia sessão com a nova palavra-passe.',
      [{ text: 'OK', onPress: onConcluido }]
    );
  }

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
            <Text style={styles.titulo}>Nova palavra-passe</Text>
          </Animated.View>

          <Animated.View style={[styles.form, { opacity: formAnim, transform: [{ translateY: formY }] }]}>
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
              onSubmitEditing={handleSubmit}
            />
          </Animated.View>

          <Animated.View style={[styles.bottomActions, { opacity: bottomAnim, transform: [{ translateY: bottomY }] }]}>
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={[styles.botaoEntrar, loading && { opacity: 0.7 }]}
                onPress={handleSubmit}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                disabled={loading}
                activeOpacity={1}
              >
                {loading ? (
                  <ActivityIndicator color={cores.branco} />
                ) : (
                  <Text style={styles.botaoEntrarTexto}>Atualizar palavra-passe</Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity onPress={async () => { await supabase.auth.signOut(); onConcluido(); }}>
              <Text style={styles.cancelar}>Cancelar</Text>
            </TouchableOpacity>
          </Animated.View>
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
    marginBottom: 60,
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
