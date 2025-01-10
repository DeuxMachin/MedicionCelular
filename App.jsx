import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/home';
import MapScreen from './screens/map';
import SavedPointsScreen from './screens/SavedPointsScreen';
import TutorialScreen from './screens/Tutorial';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{
          headerShown: false
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="MapScreen" component={MapScreen} />
        <Stack.Screen name="SavedPointsScreen" component={SavedPointsScreen} />
        <Stack.Screen name="TutorialScreen" component={TutorialScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}