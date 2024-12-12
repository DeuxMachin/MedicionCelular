import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  FadeIn,
  FadeInDown,
  useSharedValue,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const AnimatedBackground = () => {
  const particles = Array.from({ length: 10 }).map((_, i) => {
    const size = Math.random() * 80 + 40;
    const particleStyle = useAnimatedStyle(() => ({
      position: 'absolute',
      width: size,
      height: size,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: size / 2,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      transform: [
        {
          translateX: withRepeat(
            withSequence(
              withTiming(Math.random() * 100 - 50, { duration: Math.random() * 10000 + 10000 }),
              withTiming(Math.random() * 100 - 50, { duration: Math.random() * 10000 + 10000 })
            ),
            -1,
            true
          ),
        },
        {
          translateY: withRepeat(
            withSequence(
              withTiming(Math.random() * 100 - 50, { duration: Math.random() * 10000 + 10000 }),
              withTiming(Math.random() * 100 - 50, { duration: Math.random() * 10000 + 10000 })
            ),
            -1,
            true
          ),
        },
      ],
    }));

    return <Animated.View key={i} style={particleStyle} />;
  });

  return <>{particles}</>;
};

const Feature = ({ iconName, title, description }) => {
  return (
    <Animated.View 
      entering={FadeIn.delay(300)}
      style={styles.featureItem}
    >
      <View style={styles.iconContainer}>
        <Icon name={iconName} size={32} color="#FBBF24" />
      </View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </Animated.View>
  );
};

export default function HomeScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#06b6d4', '#3b82f6']}
        style={StyleSheet.absoluteFill}
      />
      
      <AnimatedBackground />

      <Animated.View 
        entering={FadeInDown.duration(800)}
        style={styles.content}
      >
        <Text style={styles.title}>Bienvenido a <Text style={styles.highlight}>MediCélula</Text></Text>
        <Text style={styles.subtitle}>Analiza y visualiza estructuras celulares con precisión.</Text>

        <View style={styles.features}>
          <Feature iconName="microscope" title="Medición Precisa" description="Mide estructuras celulares con exactitud." />
          <Feature iconName="flash" title="Análisis Rápido" description="Procesa imágenes microscópicas rápidamente." />
          <Feature iconName="chart-bar" title="Visualización Clara" description="Genera gráficos detallados de tus análisis." />
        </View>

        <TouchableOpacity 
          onPress={() => navigation.navigate('MapScreen')}
          style={styles.buttonContainer}
        >
          <Text style={styles.buttonText}>Comenzar</Text>
        </TouchableOpacity>
      </Animated.View>

      <Text style={styles.footer}>© 2024 MediCélula. Todos los derechos reservados.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    paddingHorizontal: 16,
  },
  content: {
    zIndex: 10,
    alignItems: 'center',
    maxWidth: 800,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  highlight: {
    color: '#FBBF24',
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  featureItem: {
    alignItems: 'center',
    marginHorizontal: 8,
    marginBottom: 16,
    width: width * 0.4, // Ajustar el ancho de las tarjetas
  },
  iconContainer: {
    width: 64,
    height: 64,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  featureDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  buttonContainer: {
    backgroundColor: '#FBBF24',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: {
    color: '#1E3A8A',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
});