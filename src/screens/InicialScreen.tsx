import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const interLike = Platform.select({ ios: 'System', android: 'sans-serif' });
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const cores = {
  verde: '#37914B',
  laranja: '#FA9B2D',
  bege: '#FFF1CE',
  branco: '#FFFFFF',
  cinzaTexto: '#333',
};

export default function InicialScreen() {
  const navigation = useNavigation<NavProp>();

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/fundo_inicial.png')}
        style={styles.fundo}
        resizeMode="cover"
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <TouchableOpacity
          style={styles.maisTardeBotao}
          onPress={() => navigation.navigate('Tabs')}
        >
          <Text style={styles.maisTardeTexto}>Mais Tarde</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

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

  maisTardeBotao: {
   position: 'absolute',
    top: 70,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  maisTardeTexto: {
    fontFamily: interLike,
    color: cores.verde,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  rodape: {
    paddingHorizontal: 28,
    paddingBottom: 50,
  },
  titulo: {
    fontFamily: interLike,
    fontSize: 20,
    fontWeight: '700',
    color: cores.cinzaTexto,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 28,
    letterSpacing: -0.4,
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
    fontFamily: interLike,
    color: cores.branco,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  botaoCriarConta: {
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 8,
  },
  botaoCriarContaTexto: {
    fontFamily: interLike,
    color: cores.laranja,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});