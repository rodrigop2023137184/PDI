import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const cores = {
  verde: '#37914B',
  laranja: '#FA9B2D',
  bege: '#F5F0E1',
  branco: '#FFFFFF',
  cinzaTexto: '#333',
};

export default function InicialScreen() {
  const navigation = useNavigation<NavProp>();

  return (
    <View style={styles.container}>
      {/* Fundo ilustrado — preenche o ecrã todo */}
      <Image
        source={require('../../assets/fundo_inicial.png')}
        style={styles.fundo}
        resizeMode="cover"
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Botão "Mais Tarde" */}
        <TouchableOpacity
          style={styles.maisTardeBotao}
          onPress={() => navigation.navigate('Tabs')}
        >
          <Text style={styles.maisTardeTexto}>Mais Tarde</Text>
        </TouchableOpacity>

        {/* Espaço vazio em cima — o fundo já tem o logo e as decorações */}
        <View style={{ flex: 1 }} />

        {/* Rodapé — título e botões */}
        <View style={styles.rodape}>
          <Text style={styles.titulo}>
            Transforma ingredientes em{'\n'}momentos inesquecíveis
          </Text>

          <TouchableOpacity
            style={styles.botaoLogin}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.botaoLoginTexto}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.botaoCriarConta}
            onPress={() => navigation.navigate('Registo')}
          >
            <Text style={styles.botaoCriarContaTexto}>Criar Nova Conta</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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
  safeArea: {
    flex: 1,
  },

  // "Mais Tarde"
  maisTardeBotao: {
    position: 'absolute',
    top: 30,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  maisTardeTexto: {
    color: cores.verde,
    fontSize: 15,
    fontWeight: '700',
  },

  // Rodapé
  rodape: {
    paddingHorizontal: 28,
    paddingBottom: 140,
  },
  titulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: cores.cinzaTexto,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 28,
  },
  botaoLogin: {
    backgroundColor: cores.verde,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  botaoLoginTexto: {
    color: cores.branco,
    fontSize: 17,
    fontWeight: 'bold',
  },
  botaoCriarConta: {
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 8,
  },
  botaoCriarContaTexto: {
    color: cores.laranja,
    fontSize: 15,
    fontWeight: '700',
  },
});
