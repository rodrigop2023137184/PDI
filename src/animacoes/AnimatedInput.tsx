import React, { useRef, useEffect, useState } from 'react';
import { View, TextInput, Animated, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { useShakeAnimation } from '../hooks/useShakeAnimation';

const cores = { verde: '#37914B', branco: '#FFFFFF' };

interface AnimatedInputProps extends TextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: boolean;
  containerStyle?: ViewStyle;
}

export default function AnimatedInput({
  label, value, onChangeText, error = false, containerStyle,
  secureTextEntry, keyboardType, autoCapitalize, autoCorrect, ...rest
}: AnimatedInputProps) {
  const [focused, setFocused] = useState(false);
  const progress = useRef(new Animated.Value(value ? 1 : 0)).current;

  function animateTo(toValue: number) {
    Animated.timing(progress, { toValue, duration: 180, useNativeDriver: false }).start();
  }

  function handleFocus() { setFocused(true); animateTo(1); }
  function handleBlur()  { setFocused(false); if (!value) animateTo(0); }

  useEffect(() => {
    if (value) animateTo(1);
    else if (!focused) animateTo(0);
  }, [value]);

  const labelTranslateY = progress.interpolate({ inputRange: [0,1], outputRange: [0, -42] });
  const labelFontSize   = progress.interpolate({ inputRange: [0,1], outputRange: [15, 15] });
  const labelColor      = progress.interpolate({ inputRange: [0,1], outputRange: ['#BBBBBB', cores.verde] });

  const { shakeStyle, triggerShake } = useShakeAnimation();
  useEffect(() => { if (error) triggerShake(); }, [error]);

  return (
    <Animated.View style={[styles.wrapper, containerStyle, shakeStyle]}>
      <View style={[styles.inputBox, { borderColor: focused ? cores.verde : 'transparent', borderWidth: focused ? 2 : 0 }]}>
        <Animated.Text
          style={[styles.label, { transform: [{ translateY: labelTranslateY }], fontSize: labelFontSize, color: labelColor }]}
          pointerEvents="none"
        >
          {label}
        </Animated.Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          placeholderTextColor="transparent"
          {...rest}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginTop: 28 },
  inputBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 18,
    elevation: 1,
    overflow: 'visible',
  },
  label: { position: 'absolute', left: 22, top: 18, fontWeight: '500' },
  input: { fontSize: 15, color: '#333', padding: 0, margin: 0 },
});