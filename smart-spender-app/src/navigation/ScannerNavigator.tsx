import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ScannerScreen from '../screens/Scanner/ScannerScreen';
import QRScannerScreen from '../screens/Scanner/QRScannerScreen';

export type ScannerStackParamList = {
  ScannerMain: undefined;
  QRScanner: undefined;
};

const Stack = createStackNavigator<ScannerStackParamList>();

export default function ScannerNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ScannerMain" component={ScannerScreen} />
      <Stack.Screen name="QRScanner" component={QRScannerScreen} />
    </Stack.Navigator>
  );
}