import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabase';
import { RootStackParamList } from '../../App';

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
  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    const emailNormalizado = email.trim().toLowerCase();

    if (!emailNormalizado || !password) {
      Alert.alert('Campos em falta', 'Preenche o email e a palavra-passe.');
      return;
    }

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
      Alert.alert('Email em falta', 'Introduz o teu email no campo acima primeiro.');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(emailNormalizado);
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
    <View style={styles.container}>
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
          {/* Logo central por cima do fundo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Formulário */}
          <View style={styles.form}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={styles.input}
              placeholder="joao@gmail.com"
              placeholderTextColor="#BBB"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.label}>Palavra-passe</Text>
            <TextInput
              ref={passwordRef}
              style={styles.input}
              placeholder="........"
              placeholderTextColor="#BBB"
              secureTextEntry
              autoComplete="password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity onPress={handleResetPassword}>
              <Text style={styles.esqueceu}>Esqueceu-se da palavra-passe?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.botaoEntrar, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={cores.branco} />
              ) : (
                <Text style={styles.botaoEntrarTexto}>Entrar</Text>
              )}
            </TouchableOpacity>

            <View style={styles.registoLinha}>
              <Text style={styles.registoTexto}>Não tens conta? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Registo')}>
                <Text style={styles.registoLink}>Regista-te</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.bege,
  },
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
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: cores.cinzaTexto,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: cores.branco,
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 14,
    color: cores.cinzaTexto,
    elevation: 1,
  },
  esqueceu: {
    color: cores.laranja,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 10,
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
