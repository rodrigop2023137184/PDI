import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { supabase } from '../../lib/supabase';

const cores = {
  verde: '#37914B',
  laranja: '#FA9B2D',
  branco: '#FFFFFF',
  bege: '#F5F0E1',
  cinzaTexto: '#333',
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function entrar() {
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Decorações de fundo — substituir por imagens reais */}
        <Text style={[styles.decor, styles.decorFrango]}>🍗</Text>
        <Text style={[styles.decor, styles.decorOvo]}>🍳</Text>
        <Text style={[styles.decor, styles.decorLimao]}>🍋</Text>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCirculo}>
            <Text style={styles.logoEmoji}>👨‍🍳</Text>
            <Text style={styles.logoTexto}>KOMIKALATE</Text>
          </View>
        </View>

        {/* Formulário */}
        <View style={styles.formulario}>
          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            placeholder="joao@gmail.com"
            placeholderTextColor="#BBB"
            autoCapitalize="none"
            keyboardType="email-address"
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
            onPress={entrar}
            disabled={loading}
          >
            <Text style={styles.botaoEntrarTexto}>
              {loading ? 'A entrar...' : 'Entrar'}
            </Text>
          </TouchableOpacity>

          <View style={styles.registoLinha}>
            <Text style={styles.registoTexto}>Não tens conta? </Text>
            <TouchableOpacity onPress={() => { /* TODO: navegar para registo */ }}>
              <Text style={styles.registoLink}>Regista-te</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.bege },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 60, paddingBottom: 40 },

  // Decorações
  decor: { position: 'absolute', fontSize: 44 },
  decorFrango: { top: 110, left: 10, transform: [{ rotate: '-20deg' }] },
  decorOvo: { top: 40, right: 10 },
  decorLimao: { top: 150, right: 20 },

  // Logo
  logoContainer: { alignItems: 'center', marginTop: 10, marginBottom: 40 },
  logoCirculo: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: cores.branco,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  logoEmoji: { fontSize: 48 },
  logoTexto: {
    fontSize: 14,
    fontWeight: 'bold',
    color: cores.laranja,
    marginTop: 4,
    letterSpacing: 1,
  },

  // Formulário
  formulario: { width: '100%' },
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
