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
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');
const pointSize = 20; // Increased from 15 to 20 for better visibility

const libraryImages = [
  {
    source: require('../assets/Traquea4x.png'),
    label: 'Traquea 4x',
  },
  {
    source: require('../assets/Traquea100x.png'),
    label: 'Traquea 100x',
  },
  {
    source: require('../assets/CortezaRenal10x.png'),
    label: 'Corteza Renal 10x',
  },
  {
    source: require('../assets/FrotisSanguineo40x.png'),
    label: 'Frotis Sanguineo 40x',
  },
];

export default function MapScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const isViewOnly = route.params?.isViewOnly;

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
  const lockAnimation = useRef(new Animated.Value(0)).current;

  // Almacena cuál punto se está marcando (1 o 2)
  const [selectedPoint, setSelectedPoint] = useState(null);

  // Historial de etiquetas
  const [savedPoints, setSavedPoints] = useState([]);

  const [selectedLens, setSelectedLens] = useState('10x');
  const lensOptions = [
    { value: '4x', label: '4x', fieldDiameter: 4.5 },
    { value: '10x', label: '10x', fieldDiameter: 1.8 },
    { value: '40x', label: '40x', fieldDiameter: 0.45 },
    { value: '100x', label: '100x', fieldDiameter: 0.18 },
  ];

  const [libraryModalVisible, setLibraryModalVisible] = useState(false);
  const [selectedLibraryImage, setSelectedLibraryImage] = useState(null);

  // Add new state for save modal
  const [isSaveModalVisible, setSaveModalVisible] = useState(false);
  const [labelInput, setLabelInput] = useState('');

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

  useEffect(() => {
    if (route.params?.savedPointsToView) {
      setPoints([]);
      setMeasurement(null);
      const { coordinates } = route.params.savedPointsToView;
      setPoints([[coordinates[0], coordinates[1]]]);
    }
  }, [route.params?.savedPointsToView]);

  useEffect(() => {
    if (route.params?.labelToView) {
      const { labelToView } = route.params;
      Image.getSize(labelToView.imageUri, (w, h) => {
        setOriginalImageSize({ width: w, height: h });
        setPoints(labelToView.points);
        // Preserve scale and measurements
        if (labelToView.scaleFactor) {
          setScaleFactor(labelToView.scaleFactor);
          setUnit(labelToView.unit);
        }
        if (labelToView.measurement) {
          setMeasurement(labelToView.measurement);
        }
        setImage(labelToView.imageUri);
      });
    }
  }, [route.params?.labelToView]);

  const handleFileChange = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];
        Image.getSize(asset.uri, (w, h) => {
          setOriginalImageSize({ width: w, height: h });
          setPoints([]);
          setMeasurement(null);
          setScaleFactor(null);
          setSavedPoints([]);
          setImage(asset.uri);
        });
      }
    } catch (error) {
      console.error(error);
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
          setSavedPoints([]);
        });
      }
    } catch (error) {
      console.error('Error al tomar la foto:', error);
    }
  };

  // Marca punto 1 o 2 según selectedPoint
  const handleImageClick = (e) => {
    if (!image || selectedPoint === null) return; // If no modo de marcado

    const { locationX, locationY } = e.nativeEvent;
    const normX = locationX / originalImageSize.width;
    const normY = locationY / originalImageSize.height;

    // Actualiza el array de puntos
    const newPoints = [...points];
    if (selectedPoint === 1) {
      newPoints[0] = [normX, normY];
    } else {
      newPoints[1] = [normX, normY];
    }
    setPoints(newPoints.slice(0, 2)); // solo 2 puntos
    setSelectedPoint(null); // Deshabilita modo de marcado
  };

  // Calcula distancia cada vez que haya 2 puntos
  useEffect(() => {
    if (points[0] && points[1]) {
      const [x1, y1] = getImageCoordinates(points[0]);
      const [x2, y2] = getImageCoordinates(points[1]);
      const dist = Math.hypot(x2 - x1);
      setMeasurement(dist);
    }
  }, [points]);

  const getImageCoordinates = ([normX, normY]) => {
    const x = normX * originalImageSize.width;
    const y = normY * originalImageSize.height;
    return [x, y];
  };

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

  const resetImagePosition = () => {
    setZoom(baseZoom);
    setPanPosition({ x: 0, y: 0 });
    setPoints([]);
    setMeasurement(null);
  };

  const handleScale = () => {
    setScaleModalVisible(true);
  };

  const handleAutomatizar = () => {
    if (!points[0] || !points[1]) {
      Alert.alert('Error', 'Necesitas marcar dos puntos en los bordes del círculo.');
      return;
    }
  
    // Obtener coordenadas de los puntos marcados
    const [x1, y1] = getImageCoordinates(points[0]);
    const [x2, y2] = getImageCoordinates(points[1]);
  
    // Calcular la distancia en píxeles entre los puntos
    const distanceInPixels = Math.hypot(x2 - x1, y2 - y1);
  
    // Diámetro conocido del campo de visión (20mm)
    const knownDiameterInMm = 20;
  
    // Calcular la escala (mm/pixel)
    const calculatedScale = knownDiameterInMm / distanceInPixels;
  
    // Convertir a micrómetros para mayor precisión
    const scaleInMicrometers = calculatedScale * 1000; // 1mm = 1000µm
  
    // Actualizar los estados
    setScaleFactor(scaleInMicrometers);
    setUnit('µm');
    setKnownDistance(knownDiameterInMm.toString());
  
    // Mostrar confirmación al usuario
    Alert.alert(
      'Escala Configurada',
      `Se ha configurado la escala automáticamente:\n1 píxel = ${scaleInMicrometers.toFixed(4)} µm`,
      [
        {
          text: 'Aceptar',
          onPress: () => setScaleModalVisible(false)
        }
      ]
    );
  };

  const getPointPosition = (normX, normY) => {
    const posX = normX * originalImageSize.width;
    const posY = normY * originalImageSize.height;
    return { posX, posY };
  };

  const getLineStyle = () => {
    if (!points[0] || !points[1]) return null;
    const x1 = points[0][0] * originalImageSize.width;
    const y1 = points[0][1] * originalImageSize.height;
    const x2 = points[1][0] * originalImageSize.width;
    const y2 = points[1][1] * originalImageSize.height;
  
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
  
    return [
      // Outer line (border)
      {
        position: 'absolute',
        left: x1,
        top: y1,
        width: distance,
        height: 3,
        backgroundColor: '#000000',
        transform: [{ rotate: `${angle}rad` }],
        transformOrigin: 'top left',
        zIndex: 1,
      },

    ];
  };

  const displayedMeasurement =
    measurement !== null
      ? scaleFactor
        ? (measurement * scaleFactor).toFixed(2)
        : measurement.toFixed(2)
      : null;

  // Update savePoints function
  const savePoints = () => {
    if (!points[0] || !points[1]) {
      Alert.alert('Error', 'Necesitas marcar dos puntos para guardar');
      return;
    }
    setSaveModalVisible(true);
  };

  // Add save handler
  const handleSave = () => {
    if (!labelInput.trim()) {
      Alert.alert('Error', 'La etiqueta no puede estar vacía');
      return;
    }
  
    const newLabel = {
      label: labelInput.trim(),
      points: [...points],
      imageUri: image,
      scaleFactor,
      unit,
      measurement
    };
  
    setSavedPoints([...savedPoints, newLabel]);
    setPoints([]);
    setMeasurement(null);
    setLabelInput('');
    setSaveModalVisible(false);
  
    Alert.alert('Éxito', `Puntos guardados con la etiqueta "${labelInput}"`);
  };

  const handleViewSavedPoints = () => {
    navigation.navigate('SavedPointsScreen', {
      savedPoints,
      originalImageSize,
      onUpdatePoints: (updatedPoints) => {
        setSavedPoints(updatedPoints);
      }
    });
  };

  const handleUpdatePoints = (updatedPoints) => {
    setSavedPoints(updatedPoints);
  };

  // Update point style calculation
  const getPointStyle = (x, y, index) => {
    const scaledPointSize = pointSize / zoom;
    return {
      position: 'absolute',
      left: x * originalImageSize.width - scaledPointSize / 2,
      top: y * originalImageSize.height - scaledPointSize / 2,
      width: scaledPointSize,
      height: scaledPointSize,
      borderRadius: scaledPointSize / 2,
      backgroundColor: 'transparent',
      borderWidth: 3 / zoom,
      borderColor: index === selectedPoint - 1 ? '#ff3333' : '#00ff00',
      justifyContent: 'center',
      alignItems: 'center',
    };
  };

  // Update label style
  const getLabelStyle = (x, y) => {
    const scaledFontSize = 14 / zoom;
    return {
      position: 'absolute',
      left: x * originalImageSize.width + (pointSize / zoom),
      top: y * originalImageSize.height - (pointSize / zoom),
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      padding: 5 / zoom,
      borderRadius: 4 / zoom,
      zIndex: 2,
    };
  };

  // Add helper function to handle library image selection
  const handleLibraryImageConfirm = async () => {
    if (selectedLibraryImage) {
      try {
        const imageAsset = Image.resolveAssetSource(selectedLibraryImage.source);
        
        // Set image dimensions first
        setOriginalImageSize({
          width: imageAsset.width,
          height: imageAsset.height
        });
        
        // Set the image URI
        setImage(imageAsset.uri);
        
        // Reset other states
        setPoints([]);
        setMeasurement(null);
        setScaleFactor(null);
        setSavedPoints([]);
        
        // Close modal
        setLibraryModalVisible(false);
        setSelectedLibraryImage(null);
      } catch (error) {
        console.error('Error loading library image:', error);
      }
    }
  };

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
              <Animated.View
                style={[
                  {
                    width: '100%',
                    alignItems: 'center',
                    backgroundColor: 'white',
                    borderRadius: 8,
                    overflow: 'hidden',
                    marginTop: 10
                  }
                ]}
              >
                <TouchableOpacity onPress={handleImageClick} activeOpacity={1}>
                  <Image
                    source={{ uri: image }}
                    style={{
                      width: '100%',
                      height: undefined,
                      aspectRatio: originalImageSize.width / originalImageSize.height,
                      borderRadius: 8
                    }}
                    resizeMode="contain"
                  />
                </TouchableOpacity>

                {/* Points and line outside image */}
                {points.map((point, index) => (
                  <View key={index} style={getPointStyle(point[0], point[1], index)}>
                    <View style={{
                      width: (pointSize / 3) / zoom,
                      height: (pointSize / 3) / zoom,
                      borderRadius: (pointSize / 3) / zoom,
                      backgroundColor: index === selectedPoint - 1 ? '#ff3333' : '#00ff00',
                    }} />
                  </View>
                ))}
                {points[0] && points[1] && getLineStyle().map((style, index) => (
                  <View key={index} style={style} />
                ))}
              </Animated.View>
            </Animated.View>
          </View>
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Carga o toma una imagen para comenzar</Text>
          </View>
        )}
        
      </View>

      {/* Menú lateral */}
      {!isViewOnly && (
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
                <TouchableOpacity style={styles.dropdownItem} onPress={() => setLibraryModalVisible(true)}>
                <Icon name="book" size={20} color="#fff" />
              <Text style={styles.dropdownItemText}>Biblioteca</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}
        </View>
      )}

      {/* Botones inferiores */}
      {!isViewOnly && (
        <View style={styles.bottomButtonsContainer}>
          <TouchableOpacity style={styles.bottomButton} onPress={handleScale}>
            <Icon name="tune" size={24} color="#fff" />
            <Text style={styles.bottomButtonText}>Escala</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomButton} onPress={savePoints}>
            <Icon name="content-save" size={24} color="#fff" />
            <Text style={styles.bottomButtonText}>Guardar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bottomButton}
            onPress={handleViewSavedPoints}
          >
            <Icon name="eye" size={24} color="#fff" />
            <Text style={styles.bottomButtonText}>Ver</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Dos botones para seleccionar punto 1 o punto 2 */}
      {!isViewOnly && (
        <View style={styles.pointButtonsContainer}>
          <TouchableOpacity
            style={[
              styles.pointButton,
              selectedPoint === 1 && styles.selectedPointButton,
            ]}
            onPress={() => {
              setSelectedPoint(selectedPoint === 1 ? null : 1);
            }}
          >
            <Text style={styles.pointButtonText}>Punto 1</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.pointButton,
              selectedPoint === 2 && styles.selectedPointButton,
            ]}
            onPress={() => {
              setSelectedPoint(selectedPoint === 2 ? null : 2);
            }}
          >
            <Text style={styles.pointButtonText}>Punto 2</Text>
          </TouchableOpacity>
        </View>
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
      {displayedMeasurement && (
        <Text style={styles.measurementText}>
          {`${displayedMeasurement} ${unit || 'píxeles'}`}
        </Text>
      )}

      <Text style={styles.title}>MicroVista</Text>

      <Modal
        animationType="slide"
        transparent={true}
        visible={scaleModalVisible}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Configurar Escala</Text>
            
            <Text style={styles.modalSubtitle}>Seleccione el lente objetivo:</Text>
            <View style={styles.lensContainer}>
              {lensOptions.map((lens) => (
                <TouchableOpacity
                  key={lens.value}
                  style={[
                    styles.lensButton,
                    selectedLens === lens.value && styles.selectedLensButton
                  ]}
                  onPress={() => setSelectedLens(lens.value)}
                >
                  <Text style={[
                    styles.lensButtonText,
                    selectedLens === lens.value && styles.selectedLensButtonText
                  ]}>
                    {lens.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Distancia conocida"
              keyboardType="numeric"
              value={knownDistance}
              onChangeText={setKnownDistance}
              placeholderTextColor="#B4B4B4"

            />
            <TextInput
              style={styles.input}
              placeholder="Unidad (ej: µm, mm)"
              value={unit}
              onChangeText={setUnit}
              placeholderTextColor="#B4B4B4"

            />

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleAutomatizar}
              >
                <Text style={styles.modalButtonText}>Automatizar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  if (!knownDistance || !unit) {
                    Alert.alert('Error', 'Por favor complete todos los campos');
                    return;
                  }
                  const distanceValue = parseFloat(knownDistance);
                  if (isNaN(distanceValue)) {
                    Alert.alert('Error', 'La distancia debe ser un número válido');
                    return;
                  }
                  const newScaleFactor = distanceValue / measurement;
                  setScaleFactor(newScaleFactor);
                  setScaleModalVisible(false);
                  Alert.alert(
                    'Escala configurada',
                    `1 píxel = ${newScaleFactor.toFixed(4)} ${unit}`
                  );
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

      <Modal visible={libraryModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => {
                setLibraryModalVisible(false);
                setSelectedLibraryImage(null);
              }}
            >
              <Icon name="close" size={24} color="#FF0000" />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>Selecciona una imagen</Text>
            {libraryImages.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedLibraryImage(item)}
                style={[
                  styles.libraryButton,
                  selectedLibraryImage === item && styles.selectedLibraryButton
                ]}
              >
                <Text style={styles.libraryButtonText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleLibraryImageConfirm}
            >
              <Text style={styles.modalButtonText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isSaveModalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Guardar Puntos</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingrese una etiqueta"
              value={labelInput}
              onChangeText={setLabelInput}
            />
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
            >
              <Text style={styles.buttonText}>Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cancelButton]}
              onPress={() => {
                setSaveModalVisible(false);
                setLabelInput('');
              }}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backButton: {
    position: 'absolute',
    top: '7.5%',
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
  imageWrapper: {},
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
    top: '6%',
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
    top: 2,
    marginLeft: 10,
  },
  bottomButtonsContainer: {
    position: 'absolute',
    bottom: '4%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    alignSelf: 'center',
  },
  bottomButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 5,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    width: '30%',
    marginHorizontal: 2,
  },
  bottomButtonText: {
    color: '#fff',
    marginLeft: 5,
    fontSize: 14,
  },
  title: {
    position: 'absolute',
    top: '7%',
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
  pointButtonsContainer: {
    position: 'absolute',
    bottom: '30%',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  pointButton: {
    backgroundColor: 'rgba(0,255,0,0.3)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  pointButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  selectedPointButton: {
    backgroundColor: 'rgba(0,255,0,0.8)',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInstructions: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    textAlign: 'left',
    width: '100%',
    paddingHorizontal: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
    width: '100%',
  },
  modalButtonContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
  },
  modalButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    width: '80%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  lensContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 20,
  },
  lensButton: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
    minWidth: 60,
    alignItems: 'center',
  },
  selectedLensButton: {
    backgroundColor: '#3b82f6',
  },
  lensButtonText: {
    color: '#3b82f6',
    fontSize: 16,
  },
  selectedLensButtonText: {
    color: 'white',
  },
  distanceText: {
    position: 'absolute',
    bottom: '8%', // Moved closer to bottom
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 6,
    borderRadius: 8,
    color: 'white',
    fontSize: 12,
    zIndex: 1000,
  },
  measurementText: {
    position: 'absolute',
    bottom: '20%', // Adjusted to be just above distanceText
    alignSelf: 'center',
    color: '#fff',
    fontSize: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
  },
  libraryButton: {
    padding: 15,
    marginVertical: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.5)', // Light blue background
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedLibraryButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.9)', // Darker blue when selected
  },
  libraryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    right: 8,
    top: 16,
    zIndex: 12,
    padding: 5,
  },
  saveButton: {
    backgroundColor: '#06b6d4',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  cancelButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});