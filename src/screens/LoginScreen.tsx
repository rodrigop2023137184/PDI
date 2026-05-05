import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabase';
import { RootStackParamList } from '../../App';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const cores = {
  verde: '#37914B',
  laranja: '#FA9B2D',
  bege: '#F5F0E1',
  branco: '#FFFFFF',
  cinzaTexto: '#333',
};

export default function LoginScreen() {
  const navigation = useNavigation<NavProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Campos em falta', 'Preenche o email e a palavra-passe.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) Alert.alert('Erro ao entrar', error.message);
  }

  return (
    <View style={styles.container}>
      {/* Fundo ilustrado — preenche o ecrã todo */}
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
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.label}>Palavra-passe</Text>
            <TextInput
              style={styles.input}
              placeholder="........"
              placeholderTextColor="#BBB"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity onPress={() => { /* TODO: recuperar password */ }}>
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
