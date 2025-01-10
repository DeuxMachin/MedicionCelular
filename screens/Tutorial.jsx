import React, { useState, useRef } from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions, 
  Image, 
  ImageBackground 
} from 'react-native'
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
// Obtener las dimensiones de la pantalla
const { width, height } = Dimensions.get('window')

// Definición de los pasos del tutorial con imágenes
const tutorialSteps = [
  {
    title: "Bienvenido a MediCélula",
    content: "Esta aplicación te permite realizar mediciones precisas en imágenes celulares. Comencemos con este breve tutorial para aprender todas sus funciones.",
    image: require('../assets/1.jpg'),
  },
  {
    title: "Cargar una imagen",
    content: "Selecciona 'Subir imagen' para elegir una foto de tu galería o usa la cámara para capturar una nueva imagen del microscopio.",
    image: require('../assets/2.png'),
  },
  {
    title: "Usar el zoom",
    content: "Utiliza los botones + y - para acercar o alejar la imagen. Esto te ayudará a seleccionar puntos con mayor precisión.",
    image: require('../assets/3.jpg'),
  },
  {
    title: "Marcar puntos",
    content: "Mediante los botones de zoom se recomienda acercarse lo mas posible a la zona que conocemos, luego pulsamos los botones que se marcan para luego de eso marcar donde queremos que se ubique el punnto, realizar lo mismo con el otro punto.",
    image: require('../assets/3.jpg'),
  },
  {
    title: "Escalar las medidas",
    content: "Seleccionamos el boton de escala para poder ingresar nuestra distancia conocida o automatizarlo.",
    image: require('../assets/4.jpg'),
  },
  {
    title: "Escalar las mediciones",
    content: "SI conocemos la distancia de los dos puntos ingresamos los datos que se solicita pero en el caso hipotetico de que no conozcamos la distancia deberemos marcar los dos puntos al borde superior e inferiror de nuestra imagen para luego seleccionar el boton de Automatizar.",
    image: require('../assets/5.jpg'),
  },
  {
    title: "Confirmamos la escala",
    content: "Se realiza la modificacion correspondiente.",
    image: require('../assets/5.1.jpg'),
  },
  {
    title: "Guardar medidas",
    content: "Podemos marcar cualquier punto para luego seleccionar la opcion de guardar, ingresamos un nombre que queramos darle a esa medida seleccionada para luego verla.",
    image: require('../assets/5.3.jpg'),
  },
  {
    title: "Ver mediciones",
    content: "Guardada las mediciones seleccionamos el boton de ver y nos redireccionara a la siguiente zona que mostrara todos los puntos que hayamos guardados, si seleccionamos el ojo de cualquier medida tomada nos redireccionara a esta mostrando todo los datos importantes.",
    image: require('../assets/6.jpg'),
  },
  {
    title: "Visualizacion de medidas",
    content: "Nos mostrara las medidas que almacenamos.",
    image: require('../assets/7.jpg'),
  },
  
]

export default function TutorialScreen({ navigation }) {
  const [currentStep, setCurrentStep] = useState(0)
  const scrollViewRef = useRef(null)

  const handleScroll = (event) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / width)
    setCurrentStep(slide)
  }

  const goToMap = () => {
    navigation.navigate('MapScreen')
  }

  const goToPrevious = () => {
    if (currentStep > 0) {
      scrollViewRef.current.scrollTo({ x: (currentStep - 1) * width, animated: true })
      setCurrentStep(currentStep - 1)
    }
  }

  const goToNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      scrollViewRef.current.scrollTo({ x: (currentStep + 1) * width, animated: true })
      setCurrentStep(currentStep + 1)
    }
  }

  return (
    <ImageBackground 
      source={require('../assets/background.jpg')} 
      style={styles.background}
      resizeMode="cover"
    >
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Icon name="arrow-left" size={24} color="#fff" />
      </TouchableOpacity>

      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Tutorial</Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {tutorialSteps.map((step, index) => (
          <View key={index} style={styles.slide}>
            <View style={styles.imageContainer}>
              <Image source={step.image} style={styles.stepImage} resizeMode="contain" />
            </View>
            <Text style={styles.title}>{step.title}</Text>
            <Text style={styles.description}>{step.content}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dotsContainer}>
        {tutorialSteps.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentStep === index && styles.activeDot
            ]}
          />
        ))}
      </View>

      <View style={styles.navigationButtons}>
        {currentStep > 0 ? (
          <TouchableOpacity style={styles.navButton} onPress={goToPrevious}>
            <Icon name="chevron-left" size={30} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View /> // Empty view for spacing
        )}
        {currentStep < tutorialSteps.length - 1 ? (
          <TouchableOpacity style={styles.navButton} onPress={goToNext}>
            <Icon name="chevron-right" size={30} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.startButton} onPress={goToMap}>
            <Text style={styles.startButtonText}>Comenzar</Text>
          </TouchableOpacity>
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 50, // Ajusta según la altura de la barra de estado
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80, // Padding superior para evitar el botón de back
    paddingBottom: 60, // Padding inferior para evitar la paginación
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: width * 0.8,
    height: height * 0.4,
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  stepImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  description: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    paddingHorizontal: 20,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginTop: 10,
  },
  navButton: {
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 25,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  finalButton: {
    backgroundColor: '#FFB81C',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  finalButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  navButtonPlaceholder: {
    width: 140, // Ancho equivalente al botón para mantener el espacio
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#fff',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 40,
    width: '100%',
  },
  startButton: {
    backgroundColor: '#06b6d4',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  pagination: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    alignSelf: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: '#06b6d4',
  },
  inactiveDot: {
    backgroundColor: '#ccc',
  },
  headerContainer: {
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
})