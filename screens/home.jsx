import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Image } from 'react-native';
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

      {/* Logo en el borde superior */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/UCT.png')}
          style={styles.logo}
        />
      </View>

      <Animated.View 
        entering={FadeInDown.duration(800)}
        style={styles.content}
      >
        <Text style={styles.title}>Análisis Celular</Text>
        <Text style={styles.subtitle}>Sistema de medición y análisis de estructuras celulares de alta precisión</Text>

        <View style={styles.features}>
          <Feature iconName="microscope" title="Análisis Preciso" description="Mediciones exactas de estructuras celulares" />
          <Feature iconName="book" title="Tutorial Interactivo" description="Guía paso a paso del proceso de medición" />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('MapScreen')}
          >
            <Text style={styles.buttonText}>Iniciar Análisis</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buttonOutline}
            onPress={() => navigation.navigate('TutorialScreen')}
          >
            <Text style={styles.buttonText}>Ver Tutorial</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Text style={styles.footer}>© 2025 Universidad Católica de Temuco - Financiado por el PID</Text>
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
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff',
    marginBottom: 10,
  },
  highlight: {
    color: '#FBBF24',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#fff',
    marginBottom: 20,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  featureItem: {
    alignItems: 'center',
    marginHorizontal: 1,
    marginBottom: 1,
    width: 100, 
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
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  featureDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 16,
    width: '100%',
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  button: {
    backgroundColor: '#FFB81C',
    borderColor: '#fff',
    borderWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    marginBottom: 12,
    marginRight: 12,
    minWidth: '40%',
    alignItems: 'center',
  },
  buttonOutline: {
    borderColor: '#fff',
    backgroundColor: '#FFB81C',
    borderWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    marginBottom: 12,
    minWidth: '40%',
    alignItems: 'center',
  },
  logoContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  logo: {
    width: 200,
    height: 50,
    resizeMode: 'contain',
  },
});