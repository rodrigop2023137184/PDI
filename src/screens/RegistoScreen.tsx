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
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabase';
import { RootStackParamList } from '../../App';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const cores = {
  verde: '#37914B',
  laranja: '#FA9B2D',
  branco: '#FFFFFF',
  bege: '#F5F0E1',
  cinzaTexto: '#333',
};

export default function RegistoScreen() {
  const navigation = useNavigation<NavProp>();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function registar() {
    if (!displayName || !email || !password || !confirmPassword) {
      Alert.alert('Campos em falta', 'Preenche todos os campos.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Palavras-passe diferentes', 'A confirmação não corresponde.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Palavra-passe fraca', 'A palavra-passe tem de ter pelo menos 6 caracteres.');
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
      if (erroInsert) {
        console.warn('Falha ao criar perfil public.users:', erroInsert.message);
      }
    }

    setLoading(false);
    Alert.alert('Conta criada', 'Confirma o email (se aplicável) e inicia sessão.');
    navigation.navigate('Login');
  }

  return (
    <View style={styles.container}>
      {/* Fundo ilustrado — preenche o ecrã todo */}
      <Image
        source={require('../../assets/fundo_registo.png')}
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
          {/* Cabeçalho */}
          <View style={styles.cabecalho}>
            <Text style={styles.wordmark}>KomiKalate</Text>
            <Text style={styles.titulo}>Regista-te</Text>
          </View>

          {/* Formulário */}
          <View style={styles.form}>
            <Text style={styles.label}>Nome de Utilizador</Text>
            <TextInput
              style={styles.input}
              placeholder="João Texeira"
              placeholderTextColor="#BBB"
              value={displayName}
              onChangeText={setDisplayName}
            />

            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={styles.input}
              placeholder="joao@gmail.com"
              placeholderTextColor="#BBB"
              autoCapitalize="none"
              keyboardType="email-address"
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

            <Text style={styles.label}>Confirma a Palavra-passe</Text>
            <TextInput
              style={styles.input}
              placeholder="........"
              placeholderTextColor="#BBB"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <TouchableOpacity
              style={[styles.botaoRegistar, loading && { opacity: 0.7 }]}
              onPress={registar}
              disabled={loading}
            >
              <Text style={styles.botaoRegistarTexto}>
                {loading ? 'A criar conta...' : 'Registar'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.loginLinha}>
                        <Text style={styles.loginTexto}>Já tens conta? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                          <Text style={styles.loginLink}>Inicia sessão</Text>
                        </TouchableOpacity>
            </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.bege },

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

  // Cabeçalho — wordmark + título
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

  // Formulário
  form: { width: '100%' },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: cores.cinzaTexto,
    marginBottom: 8,
    marginTop: 20,
  },
  input: {
    backgroundColor: cores.branco,
    borderRadius: 25,
    paddingHorizontal: 22,
    paddingVertical: 20,
    fontSize: 16,
    color: cores.cinzaTexto,
    elevation: 1,
  },

  entrarLink: {
    color: cores.laranja,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 10,
  },

  // Botão
  botaoRegistar: {
    backgroundColor: cores.verde,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
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
});
