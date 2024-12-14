import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, Dimensions, StyleSheet, Modal, Alert, ScrollView, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');

export default function MapScreen() {
  const navigation = useNavigation();

  const [image, setImage] = useState(null);
  const [originalImageSize, setOriginalImageSize] = useState({ width: 1, height: 1 });
  const [points, setPoints] = useState([]);
  const [measurement, setMeasurement] = useState(null);

  const [zoom, setZoom] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });

  const [isDragging, setIsDragging] = useState(false);
  const [lastPanPosition, setLastPanPosition] = useState({ x: 0, y: 0 });

  const [showImageFullScreen, setShowImageFullScreen] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [scale, setScale] = useState(null);
  const [measurements, setMeasurements] = useState([]);
  const [scaleModalVisible, setScaleModalVisible] = useState(false);
  const [tempScaleValue, setTempScaleValue] = useState('');
  const [historyModalVisible, setHistoryModalVisible] = useState(false);

  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Se requieren permisos para acceder a la galería.');
      }
    })();
  }, []);

  // Cada vez que tengamos imagen y tamaño contenedor, recalculamos zoom base.
  useEffect(() => {
    if (image && originalImageSize.width > 0 && originalImageSize.height > 0 && containerSize.width > 0 && containerSize.height > 0) {
      const baseZoom = Math.min(
        containerSize.width / originalImageSize.width,
        containerSize.height / originalImageSize.height
      );
      setZoom(baseZoom);
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
        });
      }
    } catch (error) {
      console.error('Error al tomar la foto:', error);
    }
  };

  const handleImageClick = (e) => {
    if (!image || points.length >= 2) return;

    const { locationX, locationY } = e.nativeEvent; 
    const imgX = (locationX - panPosition.x) / zoom;
    const imgY = (locationY - panPosition.y) / zoom;

    const normX = imgX / originalImageSize.width;
    const normY = imgY / originalImageSize.height;

    if (normX >= 0 && normX <= 1 && normY >= 0 && normY <= 1) {
      setPoints([...points, [normX, normY]]);
    }
  };

  useEffect(() => {
    if (points.length === 2) {
      const [normX1, normY1] = points[0];
      const [normX2, normY2] = points[1];
      const x1 = normX1 * originalImageSize.width;
      const y1 = normY1 * originalImageSize.height;
      const x2 = normX2 * originalImageSize.width;
      const y2 = normY2 * originalImageSize.height;

      const dist = Math.hypot(x2 - x1, y2 - y1);
      setMeasurement(dist);
      setMeasurements([...measurements, { id: Date.now().toString(), distance: dist }]);
    } else {
      setMeasurement(null);
    }
  }, [points]);

  const handleTouchStart = (e) => {
    if (e.nativeEvent.touches.length === 1) {
      setIsDragging(true);
      setLastPanPosition({ x: e.nativeEvent.pageX, y: e.nativeEvent.pageY });
    }
  };

  const handleTouchMove = (e) => {
    if (isDragging && e.nativeEvent.touches.length === 1) {
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

  const resetMeasurement = () => {
    setPoints([]);
    setMeasurement(null);
    setMeasurements([]);
  };

  const configureScale = () => {
    setTempScaleValue('');
    setScaleModalVisible(true);
  };

  const getPointPosition = (normX, normY) => {
    const posX = normX * originalImageSize.width * zoom + panPosition.x;
    const posY = normY * originalImageSize.height * zoom + panPosition.y;
    return { posX, posY };
  };

  const getLineStyle = () => {
    if (points.length < 2) return null;
    const [normX1, normY1] = points[0];
    const [normX2, normY2] = points[1];
    const { posX: x1, posY: y1 } = getPointPosition(normX1, normY1);
    const { posX: x2, posY: y2 } = getPointPosition(normX2, normY2);

    const lineLength = Math.hypot(x2 - x1, y2 - y1);
    const angle = Math.atan2(y2 - y1, x2 - x1);

    return {
      left: x1,
      top: y1,
      width: lineLength,
      transform: [{ rotate: `${angle}rad` }],
    };
  };

  const displayedMeasurement = measurement !== null
    ? scale
      ? (measurement * scale).toFixed(2)
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
            <TouchableOpacity onPress={handleImageClick} activeOpacity={1}>
              <Image
                source={{ uri: image }}
                style={{
                  width: originalImageSize.width * zoom,
                  height: originalImageSize.height * zoom,
                  transform: [
                    { translateX: panPosition.x },
                    { translateY: panPosition.y },
                  ]
                }}
                resizeMode="cover"
              />
              {points.length === 2 && (
                <View style={[styles.measurementLine, getLineStyle()]}>
                  <Text style={styles.measurementLineText}>
                    {displayedMeasurement} {scale ? 'unidades' : 'pixeles'}
                  </Text>
                </View>
              )}
              {points.map(([normX, normY], index) => {
                const { posX, posY } = getPointPosition(normX, normY);
                return (
                  <View
                    key={index}
                    style={[
                      styles.point,
                      {
                        left: posX - 12,
                        top: posY - 12,
                      },
                    ]}
                  >
                    <Icon name="map-marker" size={24} color="#FBBF24" />
                  </View>
                );
              })}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Carga o toma una imagen para comenzar</Text>
          </View>
        )}
        {image && (
          <TouchableOpacity
            style={styles.fullscreenButton}
            onPress={() => setShowImageFullScreen(true)}
          >
            <Icon name="fullscreen" size={24} color="#fff" />
          </TouchableOpacity>
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
              <TouchableOpacity style={styles.dropdownItem} onPress={() => setHistoryModalVisible(true)}>
                <Icon name="history" size={20} color="#fff" />
                <Text style={styles.dropdownItemText}>Ver Historial</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dropdownItem} onPress={resetMeasurement}>
                <Icon name="refresh" size={20} color="#fff" />
                <Text style={styles.dropdownItemText}>Reiniciar Medición</Text>
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
        <TouchableOpacity style={styles.bottomButton} onPress={() => setHistoryModalVisible(true)}>
          <Icon name="history" size={24} color="#fff" />
          <Text style={styles.bottomButtonText}>Ver historial</Text>
        </TouchableOpacity>
      </View>

      {points.length > 0 && (
        <TouchableOpacity style={styles.resetButton} onPress={resetMeasurement}>
          <Text style={styles.resetButtonText}>Reiniciar Puntos</Text>
        </TouchableOpacity>
      )}

      <View style={styles.zoomControls}>
        <TouchableOpacity style={styles.zoomButton} onPress={() => setZoom(Math.min(zoom + 0.1, 3))}>
          <Icon name="magnify-plus" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.zoomButton} onPress={() => setZoom(Math.max(zoom - 0.1, 0.5))}>
          <Icon name="magnify-minus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>MediCélula</Text>

      <Modal visible={showImageFullScreen} transparent={true}>
        <View style={styles.fullScreenModal}>
          <TouchableOpacity
            style={styles.closeFullScreenButton}
            onPress={() => setShowImageFullScreen(false)}
          >
            <Icon name="close" size={30} color="#fff" />
          </TouchableOpacity>

          <View 
            style={styles.imageContainer}
            onLayout={(e) => {
              const { width: cw, height: ch } = e.nativeEvent.layout;
              setContainerSize({ width: cw, height: ch });
              // Con el useEffect ya establecido, se recalcula baseZoom si cambia el layout.
            }}
          >
            <View
              style={styles.imageWrapper}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <TouchableOpacity onPress={handleImageClick} activeOpacity={1}>
                <Image
                  source={{ uri: image }}
                  style={{
                    width: originalImageSize.width * zoom,
                    height: originalImageSize.height * zoom,
                    transform: [
                      { translateX: panPosition.x },
                      { translateY: panPosition.y },
                    ]
                  }}
                  resizeMode="cover"
                />
                {points.length === 2 && (
                  <View style={[styles.measurementLine, getLineStyle()]}>
                    <Text style={styles.measurementLineText}>
                      {displayedMeasurement} {scale ? 'unidades' : 'pixeles'}
                    </Text>
                  </View>
                )}
                {points.map(([normX, normY], index) => {
                  const { posX, posY } = getPointPosition(normX, normY);
                  return (
                    <View
                      key={index}
                      style={[
                        styles.point,
                        {
                          left: posX - 12,
                          top: posY - 12,
                        },
                      ]}
                    >
                      <Icon name="map-marker" size={24} color="#FBBF24" />
                    </View>
                  );
                })}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fullScreenControls}>
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
        </View>
      </Modal>

      <Modal visible={scaleModalVisible} transparent={true}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Configurar Escala</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ingresa la escala (e.g., micrómetros por píxel)"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
              value={tempScaleValue}
              onChangeText={setTempScaleValue}
            />
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  const value = parseFloat(tempScaleValue);
                  if (!isNaN(value)) {
                    setScale(value);
                    Alert.alert('Escala configurada', `Escala establecida en ${value}`);
                    setScaleModalVisible(false);
                  } else {
                    Alert.alert('Valor inválido', 'Por favor ingresa un número válido');
                  }
                }}
              >
                <Text style={styles.modalButtonText}>Aceptar</Text>
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

      <Modal visible={historyModalVisible} transparent={true}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Historial de Mediciones</Text>
            <ScrollView style={styles.historyList}>
              {measurements.map((m) => (
                <View key={m.id} style={styles.historyItem}>
                  <Text style={styles.historyItemText}>
                    Medida: {scale ? (m.distance * scale).toFixed(2) : m.distance.toFixed(2)} {scale ? 'unidades' : 'píxeles'}
                  </Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: '#2196F3' }]}
              onPress={() => setHistoryModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // ... los mismos estilos que antes
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
    width: 24,
    height: 24,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  measurementLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#FBBF24',
    zIndex: 5,
    transformOrigin: 'left',
  },
  measurementLineText: {
    position: 'absolute',
    color: '#FBBF24',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 4,
    borderRadius: 4,
    fontSize: 12,
    top: -20,
    left: '50%',
    transform: [{ translateX: -25 }],
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
  fullscreenButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 5,
    borderRadius: 20,
  },
  fullScreenModal: {
    flex: 1,
    backgroundColor: 'black',
  },
  closeFullScreenButton: {
    position: 'absolute',
    top: '5%',
    right: '5%',
    zIndex: 10,
  },
  fullScreenControls: {
    position: 'absolute',
    bottom: '10%',
    left: '50%',
    transform: [{ translateX: -width * 0.25 }],
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '50%',
  },
  controlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10,
    borderRadius: 10,
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
    color: '#000'
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    color: '#000',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalButton: {
    backgroundColor: '#06b6d4',
    padding: 10,
    borderRadius: 5,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  historyList: {
    maxHeight: 150,
  },
  historyItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 5,
    padding: 10,
    marginBottom: 5,
  },
  historyItemText: {
    color: '#000',
  },
  resetButton: {
    position: 'absolute',
    bottom: '19%',
    left: '50%',
    transform: [{ translateX: -width * 0.25 }],
    backgroundColor: '#FBBF24',
    padding: 12,
    borderRadius: 12,
    zIndex: 1,
    width: width * 0.5,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#1E3A8A',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
