import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, CameraView } from 'expo-camera';
import { COLORS, SPACING, FONT_SIZES } from '../../constants/theme';
import DatabaseService from '../../services/database';
import { Receipt, ReceiptItem } from '../../types';

export default function QRScannerScreen({ navigation }: any) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();
  }, []);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    setIsProcessing(true);
    
    try {
      // Парсирай данните от QR кода директно като стринг
      const receiptData = parseQRData(data);
      
      // Запази в базата данни
      if (receiptData && receiptData.total > 0) {
        const receipt: Receipt = {
          shop_name: receiptData.storeName,
          date: receiptData.date,
          total_amount: receiptData.total,
          category: 'Храна',
          image_uri: null,
          items: receiptData.items
        };

        const receiptItems: ReceiptItem[] = receiptData.items || [];

        DatabaseService.createReceipt(receipt, receiptItems).then(() => {
          Alert.alert(
            '✅ QR код сканиран',
            `Бележка от ${receiptData.storeName} за ${receiptData.total} лв е запазена`,
            [
              { text: 'OK', onPress: () => navigation.goBack() }
            ]
          );
        }).catch((error) => {
          console.error('Error saving receipt:', error);
          Alert.alert('Грешка', 'Неуспешно запазване на бележката');
          setScanned(false);
        });
      } else {
        Alert.alert('Грешка', 'Неуспешно разпознаване на данните от QR кода или сумата е 0');
        setScanned(false);
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      Alert.alert('Грешка', 'Неуспешно обработване на QR кода');
      setScanned(false);
    } finally {
      setIsProcessing(false);
    }
  };  // Функция за парсиране на QR данните
  const parseQRData = (data: any) => {
    // Ако е обект (JSON), обработи като преди
    if (typeof data === 'object' && data !== null) {
      return {
        storeName: data.shopName || data.store || data.merchant || 'Неизвестен магазин',
        date: data.date || data.timestamp || new Date().toISOString().split('T')[0],
        total: data.total || data.amount || data.sum || 0,
        items: data.items || data.products || []
      };
    }
    
    // Ако е стринг, опитай да парсираш българския формат на касовите бележки
    if (typeof data === 'string') {
      // Формат: "51014083*0000266473*2024-05-17*09:21:24*23.54"
      const parts = data.split('*');
      
      if (parts.length >= 5) {
        const machineId = parts[0];      // Идентификатор на касовия апарат
        const receiptNumber = parts[1];  // Номер на бележката
        const date = parts[2];           // Дата
        const time = parts[3];           // Час
        const total = parseFloat(parts[4]); // Сума
        
        return {
          storeName: `Каса ${machineId}`,
          date: date,
          total: total,
          items: [] // За сега няма детайли за артикулите в този формат
        };
      }
    }
    
    // Ако нищо не работи, върни празни данни
    return {
      storeName: 'Неизвестен магазин',
      date: new Date().toISOString().split('T')[0],
      total: 0,
      items: []
    };
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.text}>Искаме разрешение за камерата...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.text}>Няма достъп до камерата</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Назад</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Сканирай QR код</Text>
        <Text style={styles.subtitle}>Насочи камерата към QR кода на касовата бележка</Text>
      </View>

      <View style={styles.scannerContainer}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        />

        {scanned && (
          <View style={styles.overlay}>
            <Text style={styles.overlayText}>
              {isProcessing ? 'Обработка...' : 'QR код сканиран!'}
            </Text>
            {!isProcessing && (
              <TouchableOpacity
                style={styles.rescanButton}
                onPress={() => setScanned(false)}
              >
                <Text style={styles.rescanButtonText}>Сканирай отново</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Отказ</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  text: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
  },
  scannerContainer: {
    flex: 1,
    margin: SPACING.lg,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    color: '#FFF',
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    marginBottom: SPACING.lg,
  },
  rescanButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 8,
  },
  rescanButtonText: {
    color: '#FFF',
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
  },
  cancelButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.danger,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});