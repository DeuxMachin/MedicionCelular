import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Dimensions, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');

export default function MapScreen() {
  const navigation = useNavigation();
  const [image, setImage] = useState(null);
  const [points, setPoints] = useState([]);
  const [measurement, setMeasurement] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [zoom, setZoom] = useState(1);
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  const handleImageClick = (e) => {
    if (points.length >= 2) return;

    const rect = imageRef.current?.getBoundingClientRect();
    const container = containerRef.current?.getBoundingClientRect();
    if (rect && container) {
      const x = (e.nativeEvent.locationX - rect.left + container.left) / zoom;
      const y = (e.nativeEvent.locationY - rect.top + container.top) / zoom;
      setPoints([...points, [x, y]]);
    }
  };

  const handleFileChange = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, // No permite recortar la imagen
      quality: 1,
    });

    if (!result.cancelled) {
      setImage(result.uri);
    }
  };

  const handleCameraClick = async () => {
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: false, // No permite recortar la imagen
      quality: 1,
    });

    if (!result.cancelled) {
      setImage(result.uri);
    }
  };

  useEffect(() => {
    if (points.length === 2) {
      const [x1, y1] = points[0];
      const [x2, y2] = points[1];
      const dist = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
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
      <LinearGradient
        colors={['#06b6d4', '#3b82f6']}
        style={StyleSheet.absoluteFill}
      />

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Icon name="arrow-left" size={24} color="#fff" />
      </TouchableOpacity>

      <View style={styles.imageContainer} ref={containerRef}>
        {image ? (
          <TouchableOpacity onPress={handleImageClick} style={styles.imageWrapper}>
            <Image
              ref={imageRef}
              source={{ uri: image }}
              style={[styles.image, { transform: [{ scale: zoom }] }]}
              resizeMode="contain"
            />
            {points.map(([x, y], index) => (
              <Animated.View
                key={index}
                style={[styles.point, { left: x * zoom - 12, top: y * zoom - 12 }]}
              >
                <Icon name="map-marker" size={16} color="#1E3A8A" />
              </Animated.View>
            ))}
            {points.length === 2 && (
              <Animated.View style={styles.lineContainer}>
                <Animated.View
                  style={[
                    styles.line,
                    {
                      left: points[0][0] * zoom,
                      top: points[0][1] * zoom,
                      width: Math.abs(points[1][0] - points[0][0]) * zoom,
                      height: Math.abs(points[1][1] - points[0][1]) * zoom,
                    },
                  ]}
                />
              </Animated.View>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Carga o toma una imagen para comenzar</Text>
          </View>
        )}
      </View>

      {measurement !== null && (
        <Animated.View style={styles.measurement}>
          <Text style={styles.measurementText}>Medida: {measurement} píxeles</Text>
        </Animated.View>
      )}

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={() => setShowUpload(true)}>
          <Icon name="upload" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={handleCameraClick}>
          <Icon name="camera" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={() => setZoom(Math.min(zoom + 0.1, 3))}>
          <Icon name="magnify-plus" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={() => setZoom(Math.max(zoom - 0.1, 0.5))}>
          <Icon name="magnify-minus" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={resetMeasurement}>
          <Icon name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {showUpload && (
        <View style={styles.uploadOverlay}>
          <View style={styles.uploadContainer}>
            <Text style={styles.uploadTitle}>Subir imagen</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowUpload(false)}>
              <Icon name="close" size={24} color="#1E3A8A" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.uploadButton} onPress={handleFileChange}>
              <Text style={styles.uploadButtonText}>Seleccionar archivo</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Text style={styles.title}>MediCélula</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
  lineContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  line: {
    position: 'absolute',
    backgroundColor: 'yellow',
    height: 2,
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
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadContainer: {
    width: '80%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  uploadButton: {
    backgroundColor: '#1E3A8A',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
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