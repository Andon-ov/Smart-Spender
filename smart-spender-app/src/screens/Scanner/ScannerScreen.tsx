import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, FONT_SIZES } from '../../constants/theme';
import { ocrSpaceService } from '../../services/ocrSpaceService';
import DatabaseService from '../../services/database';
import { Receipt, ReceiptItem } from '../../types';

export default function ScannerScreen({ navigation }: any) {
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const requestPermissions = async () => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    return cameraPermission.granted && mediaLibraryPermission.granted;
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert('Разрешения', 'Необходими са разрешения за камера и галерия');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert('Разрешения', 'Необходими са разрешения за камера и галерия');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
    }
  };

  const scanQRCode = () => {
    navigation.navigate('QRScanner');
  };

  const analyzeReceipt = async () => {
    if (!image) return;

    setIsProcessing(true);
    try {
      // Analyze with OCR.space API (free tier)
      const result = await ocrSpaceService.analyzeReceipt(image);

      // Convert OCR result to database format and save
      if (result.storeName && result.total) {
        const receipt: Receipt = {
          shop_name: result.storeName,
          date: result.date || new Date().toISOString().split('T')[0], // Use current date if not found
          total_amount: result.total,
          category: 'Храна', // Default category
          image_uri: image,
          items: result.items?.map(item => ({
            product_name: item.productName,
            quantity: item.quantity || 1,
            unit_price: item.unitPrice || item.totalPrice,
            total_price: item.totalPrice
          }))
        };

        const receiptItems: ReceiptItem[] = result.items?.map(item => ({
          product_name: item.productName,
          quantity: item.quantity || 1,
          unit_price: item.unitPrice || item.totalPrice,
          total_price: item.totalPrice
        })) || [];

        try {
          await DatabaseService.createReceipt(receipt, receiptItems);
          console.log('Receipt saved successfully');
        } catch (dbError) {
          console.error('Error saving receipt:', dbError);
          // Don't fail the whole process if saving fails
        }
      }

      const message = [
        result.storeName ? `🏪 Магазин: ${result.storeName}` : '',
        result.date ? `📅 Дата: ${result.date}` : '',
        result.total ? `💰 Обща сума: ${result.total} лв` : '',
        result.items && result.items.length > 0 ? `🛒 Продукти: ${result.items.length}` : ''
      ].filter(Boolean).join('\n');

      const buttons = [
        { text: 'OK', onPress: () => setImage(null) }
      ];

      // Add "View Products" button if we have items
      if (result.items && result.items.length > 0) {
        buttons.unshift({
          text: 'Виж продукти',
          onPress: () => {
            const itemsText = result.items!.map((item, index) => {
              let text = `${index + 1}. ${item.productName}`;
              if (item.quantity && item.unitPrice) {
                text += ` (${item.quantity} x ${item.unitPrice} лв = ${item.totalPrice} лв)`;
              } else {
                text += ` - ${item.totalPrice} лв`;
              }
              return text;
            }).join('\n');

            Alert.alert(
              'Продукти',
              itemsText,
              [
                { text: 'OK', onPress: () => setImage(null) }
              ]
            );
          }
        });
      }

      Alert.alert(
        '✅ Анализ завършен',
        message || 'Текстът е извлечен, но не е разпозната структурата на бележката',
        buttons
      );
    } catch (error) {
      console.error('Error analyzing receipt:', error);
      Alert.alert('Грешка', `Неуспешно анализиране: ${error instanceof Error ? error.message : 'Неизвестна грешка'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Сканирай бележка</Text>
        <Text style={styles.subtitle}>Заснеми или избери снимка</Text>
      </View>

      {image ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.image} />
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setImage(null)}
          >
            <Text style={styles.clearButtonText}>Изчисти</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderIcon}>📸</Text>
          <Text style={styles.placeholderText}>Няма избрано изображение</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={takePhoto}>
          <Text style={styles.buttonIcon}>📷</Text>
          <Text style={styles.buttonText}>Заснеми</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={pickImage}>
          <Text style={styles.buttonIcon}>🖼️</Text>
          <Text style={styles.buttonText}>Избери от галерия</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={scanQRCode}>
          <Text style={styles.buttonIcon}>📱</Text>
          <Text style={styles.buttonText}>Сканирай QR</Text>
        </TouchableOpacity>
      </View>

      {image && (
        <TouchableOpacity
          style={[styles.analyzeButton, isProcessing && styles.disabledButton]}
          disabled={isProcessing}
          onPress={analyzeReceipt}
        >
          <Text style={styles.analyzeButtonText}>
            {isProcessing ? 'Обработка...' : 'Анализирай бележка'}
          </Text>
        </TouchableOpacity>
      )}
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
  imageContainer: {
    flex: 1,
    margin: SPACING.lg,
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    flex: 1,
    resizeMode: 'contain',
  },
  clearButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.danger,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: SPACING.lg,
  },
  placeholderIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  placeholderText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: SPACING.lg,
    gap: SPACING.sm,
    marginBottom: 100,
  },
  button: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonIcon: {
    fontSize: 32,
    marginBottom: SPACING.sm,
  },
  buttonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  analyzeButton: {
    backgroundColor: COLORS.primary,
    marginHorizontal: SPACING.lg,
    marginBottom: 80,

    padding: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: COLORS.textLight,
  },
  analyzeButtonText: {
    color: '#FFF',
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
  },
});
