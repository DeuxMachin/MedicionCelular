import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  StyleSheet,
  Modal,
  Alert,
  ScrollView,
  TextInput,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');

// Define pointSize outside the component
const pointSize = 30;

export default function MapScreen() {
  const navigation = useNavigation();

  const [image, setImage] = useState(null);
  const [originalImageSize, setOriginalImageSize] = useState({ width: 1, height: 1 });
  const [points, setPoints] = useState([]);
  const [measurement, setMeasurement] = useState(null);

  const [zoom, setZoom] = useState(1);
  const [baseZoom, setBaseZoom] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });

  const [isDragging, setIsDragging] = useState(false);
  const [lastPanPosition, setLastPanPosition] = useState({ x: 0, y: 0 });

  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [scaleModalVisible, setScaleModalVisible] = useState(false);
  const [knownDistance, setKnownDistance] = useState('');
  const [unit, setUnit] = useState('');

  const [scaleFactor, setScaleFactor] = useState(null);

  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const [isLocked, setIsLocked] = useState(false);
  const lockAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Se requieren permisos para acceder a la galería.');
      }
    })();
  }, []);

  useEffect(() => {
    if (
      image &&
      originalImageSize.width > 0 &&
      originalImageSize.height > 0 &&
      containerSize.width > 0 &&
      containerSize.height > 0
    ) {
      const calculatedBaseZoom = Math.min(
        containerSize.width / originalImageSize.width,
        containerSize.height / originalImageSize.height
      );
      setBaseZoom(calculatedBaseZoom);
      setZoom(calculatedBaseZoom);
      setPanPosition({ x: 0, y: 0 });
    }
  }, [image, originalImageSize, containerSize]);

  const handleFileChange = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setImage(asset.uri);
        Image.getSize(asset.uri, (w, h) => {
          setOriginalImageSize({ width: w, height: h });
          setPoints([]);
          setMeasurement(null);
          setScaleFactor(null);
        });
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
        const asset = result.assets[0];
        setImage(asset.uri);
        Image.getSize(asset.uri, (w, h) => {
          setOriginalImageSize({ width: w, height: h });
          setPoints([]);
          setMeasurement(null);
          setScaleFactor(null);
        });
      }
    } catch (error) {
      console.error('Error al tomar la foto:', error);
    }
  };

  const handleImageClick = (e) => {
    if (!image || isLocked) return;

    if (points.length >= 2) {
      Alert.alert('Límite de puntos', 'Solo puedes marcar dos puntos.');
      return;
    }

    // Get touch coordinates relative to the image
    const { locationX, locationY } = e.nativeEvent;

    // Normalize the coordinates based on the original image size
    const normX = locationX / originalImageSize.width;
    const normY = locationY / originalImageSize.height;

    // Ensure the touch is within the image bounds
    if (normX >= 0 && normX <= 1 && normY >= 0 && normY <= 1) {
      setPoints([...points, [normX, normY]]);
    }
  };

  useEffect(() => {
    if (points.length >= 2) {
      const [x1, y1] = getImageCoordinates(points[points.length - 2]);
      const [x2, y2] = getImageCoordinates(points[points.length - 1]);
      const dist = Math.hypot(x2 - x1, y2 - y1);
      setMeasurement(dist);
    }
  }, [points]);

  const getImageCoordinates = ([normX, normY]) => {
    const x = normX * originalImageSize.width;
    const y = normY * originalImageSize.height;
    return [x, y];
  };

  const handleTouchStart = (e) => {
    if (e.nativeEvent.touches.length === 1 && !isLocked) {
      setIsDragging(true);
      setLastPanPosition({ x: e.nativeEvent.pageX, y: e.nativeEvent.pageY });
    }
  };

  const handleTouchMove = (e) => {
    if (isDragging && e.nativeEvent.touches.length === 1 && !isLocked) {
      const deltaX = e.nativeEvent.pageX - lastPanPosition.x;
      const deltaY = e.nativeEvent.pageY - lastPanPosition.y;
      setPanPosition({
        x: panPosition.x + deltaX,
        y: panPosition.y + deltaY,
      });
      setLastPanPosition({ x: e.nativeEvent.pageX, y: e.nativeEvent.pageY });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const resetImagePosition = () => {
    setZoom(baseZoom);
    setPanPosition({ x: 0, y: 0 });
    setPoints([]);
    setMeasurement(null);
  };

  const configureScale = () => {
    if (points.length < 2) {
      Alert.alert('Atención', 'Seleccione dos puntos para calibrar la escala.');
      return;
    }
    setScaleModalVisible(true);
    setKnownDistance('');
    setUnit('');
  };

  const getPointPosition = (normX, normY) => {
    const posX = normX * originalImageSize.width;
    const posY = normY * originalImageSize.height;
    return { posX, posY };
  };

  const getLineStyle = () => {
    if (points.length < 2) return null;
    const [startPoint, endPoint] = points.slice(-2);

    const x1 = startPoint[0] * originalImageSize.width;
    const y1 = startPoint[1] * originalImageSize.height;
    const x2 = endPoint[0] * originalImageSize.width;
    const y2 = endPoint[1] * originalImageSize.height;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);

    return {
      position: 'absolute',
      left: x1,
      top: y1,
      width: distance,
      height: 2,
      backgroundColor: '#FBBF24',
      transform: [{ rotate: `${angle}rad` }],
      transformOrigin: 'top left',
    };
  };

  const undoLastPoint = () => {
    if (points.length > 0) {
      setPoints(points.slice(0, -1));
      setMeasurement(null);
    }
  };

  const displayedMeasurement =
    measurement !== null
      ? scaleFactor
        ? (measurement * scaleFactor).toFixed(2)
        : measurement.toFixed(2)
      : null;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#06b6d4', '#3b82f6']} style={StyleSheet.absoluteFill} />

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Icon name="arrow-left" size={24} color="#fff" />
      </TouchableOpacity>

      <View
        style={styles.imageContainer}
        onLayout={(e) => {
          const { width: cw, height: ch } = e.nativeEvent.layout;
          setContainerSize({ width: cw, height: ch });
        }}
      >
        {image ? (
          <View
            style={styles.imageWrapper}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <Animated.View
              style={{
                width: originalImageSize.width,
                height: originalImageSize.height,
                transform: [
                  { translateX: panPosition.x },
                  { translateY: panPosition.y },
                  { scale: zoom },
                ],
              }}
            >
              <TouchableOpacity onPress={handleImageClick} activeOpacity={1}>
                <View>
                  <Image
                    source={{ uri: image }}
                    style={{
                      width: originalImageSize.width,
                      height: originalImageSize.height,
                    }}
                    resizeMode="contain"
                  />
                  {points.map(([normX, normY], index) => {
                    const { posX, posY } = getPointPosition(normX, normY);
                    return (
                      <View
                        key={index}
                        style={[
                          styles.point,
                          {
                            left: posX - pointSize / 2,
                            top: posY - pointSize,
                          },
                        ]}
                      >
                        <Icon name="map-marker" size={pointSize} color="#FBBF24" />
                      </View>
                    );
                  })}
                  {points.length >= 2 && (
                    <View style={getLineStyle()}>
                      <Text style={styles.measurementLineText}>
                        {displayedMeasurement} {scaleFactor ? unit : 'pixeles'}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Carga o toma una imagen para comenzar</Text>
          </View>
        )}
        {/* Botones de bloqueo y eliminación */}
        {image && (
          <>
            <TouchableOpacity
              style={styles.lockButton}
              onPress={() => {
                Animated.sequence([
                  Animated.timing(lockAnimation, {
                    toValue: isLocked ? 0 : 1,
                    duration: 300,
                    useNativeDriver: true,
                  }),
                ]).start();
                setIsLocked(!isLocked);
              }}
            >
              <Animated.View
                style={{
                  transform: [
                    {
                      rotate: lockAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                }}
              >
                <Icon name={isLocked ? 'lock' : 'lock-open'} size={24} color="#fff" />
              </Animated.View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => {
                Alert.alert('Eliminar Imagen', '¿Estás seguro de que deseas eliminar la imagen?', [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Eliminar', style: 'destructive', onPress: () => setImage(null) },
                ]);
              }}
            >
              <Icon name="delete" size={24} color="#fff" />
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.optionsMenuContainer}>
        <TouchableOpacity
          style={styles.optionsButton}
          onPress={() => setShowOptionsMenu(!showOptionsMenu)}
        >
          <Icon name="menu" size={24} color="#fff" />
        </TouchableOpacity>
        {showOptionsMenu && (
          <View style={styles.dropdownMenu}>
            <ScrollView>
              <TouchableOpacity style={styles.dropdownItem} onPress={handleFileChange}>
                <Icon name="upload" size={20} color="#fff" />
                <Text style={styles.dropdownItemText}>Subir Imagen</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dropdownItem} onPress={handleCameraClick}>
                <Icon name="camera" size={20} color="#fff" />
                <Text style={styles.dropdownItemText}>Tomar Foto</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dropdownItem} onPress={resetImagePosition}>
                <Icon name="refresh" size={20} color="#fff" />
                <Text style={styles.dropdownItemText}>Reiniciar Ubicación</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
      </View>

      <View style={styles.bottomButtonsContainer}>
        <TouchableOpacity style={styles.bottomButton} onPress={configureScale}>
          <Icon name="tune" size={24} color="#fff" />
          <Text style={styles.bottomButtonText}>Configurar Escala</Text>
        </TouchableOpacity>
      </View>

      {/* Botón "Deshacer" */}
      {points.length > 0 && (
        <TouchableOpacity style={styles.undoButton} onPress={undoLastPoint}>
          <Icon name="undo" size={24} color="#fff" />
          <Text style={styles.undoButtonText}>Deshacer</Text>
        </TouchableOpacity>
      )}

      <View style={styles.zoomControls}>
        <TouchableOpacity
          style={styles.zoomButton}
          onPress={() => setZoom(Math.min(zoom + 0.1, 3))}
        >
          <Icon name="magnify-plus" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.zoomButton}
          onPress={() => setZoom(Math.max(zoom - 0.1, baseZoom))}
        >
          <Icon name="magnify-minus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>MediCélula</Text>

      <Modal
        animationType="slide"
        transparent={true}
        visible={scaleModalVisible}
        onRequestClose={() => setScaleModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Configurar Escala</Text>
            <Text style={styles.modalLabel}>Distancia conocida:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ingrese la distancia conocida"
              keyboardType="numeric"
              value={knownDistance}
              onChangeText={setKnownDistance}
            />
            <Text style={styles.modalLabel}>Unidad de medida:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ingrese la unidad de medida (e.g., μm)"
              value={unit}
              onChangeText={setUnit}
            />
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  const distanceValue = parseFloat(knownDistance);
                  if (isNaN(distanceValue) || !unit) {
                    Alert.alert(
                      'Entrada inválida',
                      'Por favor ingrese una distancia válida y una unidad de medida.'
                    );
                    return;
                  }
                  if (measurement === null) {
                    Alert.alert(
                      'Sin medición',
                      'Debe tener dos puntos marcados para calibrar la escala.'
                    );
                    return;
                  }
                  const newScaleFactor = distanceValue / measurement;
                  setScaleFactor(newScaleFactor);
                  setScaleModalVisible(false);
                  Alert.alert('Escala configurada', `1 píxel = ${newScaleFactor.toFixed(4)} ${unit}`);
                }}
              >
                <Text style={styles.modalButtonText}>Guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: 'red' }]}
                onPress={() => setScaleModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // ... estilos existentes
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backButton: {
    position: 'absolute',
    top: '5%',
    left: '5%',
    zIndex: 10,
  },
  imageContainer: {
    marginTop: '25%',
    width: '95%',
    height: '60%',
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    // Contenedor vacío para manejar gestos
  },
  point: {
    position: 'absolute',
    width: pointSize,
    height: pointSize,
    justifyContent: 'center',
    alignItems: 'center',
  },
  measurementLineText: {
    position: 'absolute',
    color: '#FBBF24',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 4,
    borderRadius: 4,
    fontSize: 12,
    top: -25,
    left: '50%',
    transform: [{ translateX: -pointSize / 2 }],
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
  },
  optionsMenuContainer: {
    position: 'absolute',
    top: '5%',
    right: '5%',
    zIndex: 10,
  },
  optionsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10,
    borderRadius: 10,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 50,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 10,
    padding: 5,
    width: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  dropdownItemText: {
    color: '#fff',
    marginLeft: 10,
  },
  bottomButtonsContainer: {
    position: 'absolute',
    bottom: '5%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  bottomButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomButtonText: {
    color: '#fff',
    marginLeft: 5,
  },
  title: {
    position: 'absolute',
    top: '5%',
    alignSelf: 'center',
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  zoomControls: {
    position: 'absolute',
    bottom: '12%',
    left: '50%',
    transform: [{ translateX: -width * 0.25 }],
    flexDirection: 'row',
    justifyContent: 'center',
    width: width * 0.5,
    gap: 20,
  },
  zoomButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 12,
    borderRadius: 12,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  undoButton: {
    position: 'absolute',
    bottom: '15%',
    left: '5%',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  undoButtonText: {
    color: '#fff',
    marginLeft: 5,
    fontSize: 16,
  },
  deleteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,0,0,0.6)',
    padding: 5,
    borderRadius: 20,
  },
  lockButton: {
    position: 'absolute',
    top: 10,
    left: 10, // Opuesto al botón de eliminar
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 5,
    borderRadius: 20,
    zIndex: 10,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#000',
  },
  modalLabel: {
    fontSize: 16,
    color: '#000',
    marginTop: 10,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    color: '#000',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  modalButton: {
    backgroundColor: '#06b6d4',
    padding: 10,
    borderRadius: 5,
    width: '40%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});
