import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Dimensions, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

export default function MapScreen() {
  const navigation = useNavigation();
  const [image, setImage] = useState(null);
  const [points, setPoints] = useState([]);
  const [measurement, setMeasurement] = useState(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Se requieren permisos para acceder a la galería.');
      }
    })();
  }, []);

  const handleImageClick = (e) => {
    if (points.length >= 2) return;

    const x = e.nativeEvent.locationX / zoom;
    const y = e.nativeEvent.locationY / zoom;
    setPoints([...points, [x, y]]);
  };

  const handleFileChange = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Asegúrate de usar esta opción actualizada
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri); // Guarda la URI de la imagen
      }
    } catch (error) {
      console.error('Error al seleccionar la imagen:', error);
    }
  };

  const handleCameraClick = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri); // Guarda la URI de la imagen
      }
    } catch (error) {
      console.error('Error al tomar la foto:', error);
    }
  };

  useEffect(() => {
    if (points.length === 2) {
      const [x1, y1] = points[0];
      const [x2, y2] = points[1];
      const dist = Math.hypot(x2 - x1, y2 - y1);
      setMeasurement(Math.round(dist));
    } else {
      setMeasurement(null);
    }
  }, [points]);

  const resetMeasurement = () => {
    setPoints([]);
    setMeasurement(null);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#06b6d4', '#3b82f6']} style={StyleSheet.absoluteFill} />

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Icon name="arrow-left" size={24} color="#fff" />
      </TouchableOpacity>

      <View style={styles.imageContainer}>
        {image ? (
          <TouchableOpacity onPress={handleImageClick} style={styles.imageWrapper}>
            <Image
              source={{ uri: image }}
              style={[styles.image, { transform: [{ scale: zoom }] }]}
              resizeMode="contain"
            />
            {points.map(([x, y], index) => (
              <View
                key={index}
                style={[styles.point, { left: x * zoom - 12, top: y * zoom - 12 }]}
              >
                <Icon name="map-marker" size={16} color="#1E3A8A" />
              </View>
            ))}
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Carga o toma una imagen para comenzar</Text>
          </View>
        )}
      </View>

      {measurement !== null && (
        <View style={styles.measurement}>
          <Text style={styles.measurementText}>Medida: {measurement} píxeles</Text>
        </View>
      )}

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={handleFileChange}>
          <Icon name="upload" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={handleCameraClick}>
          <Icon name="camera" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setZoom(Math.min(zoom + 0.1, 3))}
        >
          <Icon name="magnify-plus" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setZoom(Math.max(zoom - 0.1, 0.5))}
        >
          <Icon name="magnify-minus" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={resetMeasurement}>
          <Icon name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>MediCélula</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Tus estilos existentes aquí
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: '5%',
    left: '5%',
    zIndex: 10,
  },
  imageContainer: {
    width: '90%',
    height: '60%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  point: {
    position: 'absolute',
    width: 24,
    height: 24,
    backgroundColor: '#FBBF24',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
  },
  measurement: {
    position: 'absolute',
    bottom: '20%',
    left: '50%',
    transform: [{ translateX: -width * 0.25 }],
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10,
    borderRadius: 10,
  },
  measurementText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  controls: {
    position: 'absolute',
    bottom: '5%',
    left: '50%',
    transform: [{ translateX: -width * 0.4 }],
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
  },
  controlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10,
    borderRadius: 10,
  },
  title: {
    position: 'absolute',
    top: '5%',
    left: '50%',
    transform: [{ translateX: -width * 0.25 }],
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
