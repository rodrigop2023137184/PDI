import { useRef } from 'react';
import { Animated } from 'react-native';

const SHAKE_DISTANCE = 8;
const SHAKE_DURATION = 40;

export function useShakeAnimation() {
  const translateX = useRef(new Animated.Value(0)).current;

  function triggerShake() {
    translateX.setValue(0);
    Animated.sequence([
      Animated.timing(translateX, { toValue: -SHAKE_DISTANCE, duration: SHAKE_DURATION, useNativeDriver: true }),
      Animated.timing(translateX, { toValue:  SHAKE_DISTANCE, duration: SHAKE_DURATION, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: -SHAKE_DISTANCE, duration: SHAKE_DURATION, useNativeDriver: true }),
      Animated.timing(translateX, { toValue:  SHAKE_DISTANCE, duration: SHAKE_DURATION, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: -SHAKE_DISTANCE, duration: SHAKE_DURATION, useNativeDriver: true }),
      Animated.timing(translateX, { toValue:  SHAKE_DISTANCE, duration: SHAKE_DURATION, useNativeDriver: true }),
      Animated.timing(translateX, { toValue:  0,              duration: SHAKE_DURATION, useNativeDriver: true }),
    ]).start();
  }

  const shakeStyle = { transform: [{ translateX }] };
  return { shakeStyle, triggerShake };
}