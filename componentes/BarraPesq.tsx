import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
interface BarraPesqProps {
  valor: string;
  onMudar: (texto: string) => void;
  onPesquisar: () => void;
  onFiltros?: () => void;
  onAdicionar?: () => void;
}

const cores = {
  verde: '#37914B',
  laranja: '#FA9B2D',
  branco: '#FFFFFF',
};

export default function BarraPesq({ valor, onMudar, onPesquisar, onFiltros, onAdicionar }: BarraPesqProps) {
  return (
    <View style={styles.container}>

      <TouchableOpacity style={styles.botaoPesquisa} onPress={onPesquisar}>
        <Ionicons name="search" size={20} color={cores.verde} />
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Pesquisar receitas..."
        placeholderTextColor="#999"
        value={valor}
        onChangeText={onMudar}
        onSubmitEditing={onPesquisar}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        keyboardType="default"
        autoComplete="off"
        spellCheck={false}
      />

      {onAdicionar && (
        <TouchableOpacity style={styles.botaoAdicionar} onPress={onAdicionar}>
          <Ionicons name="add-circle-outline" size={20} color={cores.verde} />
       </TouchableOpacity>
      )}

      {onFiltros && (
        <TouchableOpacity style={styles.botaoFiltros} onPress={onFiltros}>
          <Ionicons name="options-outline" size={20} color={cores.laranja} />
        </TouchableOpacity>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingHorizontal: 10,
    elevation: 3,
    marginBottom: 12,
  },
  botaoPesquisa: {
    padding: 8,
    marginRight: 4,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
  },
  botaoFiltros: {
    padding: 8,
    marginLeft: 4,
  },
  botaoAdicionar: {
  padding: 8,
  marginLeft: 4,
},
});