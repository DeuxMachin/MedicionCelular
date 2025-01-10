import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function SavedPointsScreen({ route, navigation }) {
  const { savedPoints, originalImageSize, onUpdatePoints } = route.params;

  const handleDelete = (index) => {
    Alert.alert(
      'Eliminar Etiqueta',
      '¿Estás seguro de que deseas eliminar esta etiqueta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            const updatedPoints = savedPoints.filter((_, i) => i !== index);
            // Llamar a la función del padre para actualizar los puntos
            onUpdatePoints(updatedPoints);
            navigation.setParams({ savedPoints: updatedPoints });
          },
        },
      ]
    );
  };

  const handleViewLabel = (item) => {
    navigation.navigate({
      name: 'MapScreen',
      params: { 
        labelToView: item,
        imageUri: item.imageUri, 
        isViewOnly: true,
      },
      merge: true, 
    });
  };

  const renderItem = ({ item, index }) => {
    if (!originalImageSize) {
      Alert.alert('Error', 'No se encontraron las dimensiones de la imagen.');
      return null;
    }

    const measurement = item.measurement;
    const displayMeasurement = item.scaleFactor 
      ? `${(measurement * item.scaleFactor).toFixed(2)} ${item.unit}`
      : `${measurement.toFixed(2)} píxeles`;

    return (
      <View style={styles.pointItem}>
        <View>
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.measurement}>{displayMeasurement}</Text>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity onPress={() => handleViewLabel(item)}>
            <Icon name="eye" size={24} color="#06b6d4" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(index)} style={{ marginLeft: 10 }}>
            <Icon name="delete" size={24} color="#FF0000" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Icon name="arrow-left" size={24} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.title}>Puntos Guardados</Text>
      <FlatList
        data={savedPoints}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No hay puntos guardados.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3b82f6',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
  },
  title: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 20,
    alignSelf: 'center',
  },
  list: {
    paddingBottom: 20,
  },
  pointItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  label: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  coordinates: {
    color: '#fff',
    fontSize: 16,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
  measurement: {
    color: '#fff',
    fontSize: 16,
  },
});