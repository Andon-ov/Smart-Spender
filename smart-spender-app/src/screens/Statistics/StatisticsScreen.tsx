import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZES } from '../../constants/theme';
import DatabaseService from '../../services/database';
import { Receipt } from '../../types';

interface Stats {
  totalReceipts: number;
  totalAmount: number;
  averageAmount: number;
  categoryBreakdown: { [key: string]: number };
}

export default function StatisticsScreen() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const receipts = await DatabaseService.getReceipts();

      if (receipts.length === 0) {
        setStats(null);
        return;
      }

      const totalAmount = receipts.reduce((sum, receipt) => sum + receipt.total_amount, 0);
      const averageAmount = totalAmount / receipts.length;

      const categoryBreakdown: { [key: string]: number } = {};
      receipts.forEach(receipt => {
        categoryBreakdown[receipt.category] = (categoryBreakdown[receipt.category] || 0) + receipt.total_amount;
      });

      setStats({
        totalReceipts: receipts.length,
        totalAmount,
        averageAmount,
        categoryBreakdown
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCategoryBreakdown = () => {
    if (!stats) return null;

    return Object.entries(stats.categoryBreakdown).map(([category, amount]) => (
      <View key={category} style={styles.categoryItem}>
        <Text style={styles.categoryName}>{category}</Text>
        <Text style={styles.categoryAmount}>{amount.toFixed(2)} лв</Text>
      </View>
    ));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Статистика</Text>
          <Text style={styles.subtitle}>Зареждане...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Статистика</Text>
          <Text style={styles.subtitle}>Анализ на разходите</Text>
        </View>

        {stats ? (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🧾</Text>
              <Text style={styles.statValue}>{stats.totalReceipts}</Text>
              <Text style={styles.statLabel}>Общо бележки</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statIcon}>💰</Text>
              <Text style={styles.statValue}>{stats.totalAmount.toFixed(2)} лв</Text>
              <Text style={styles.statLabel}>Общи разходи</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statIcon}>📊</Text>
              <Text style={styles.statValue}>{stats.averageAmount.toFixed(2)} лв</Text>
              <Text style={styles.statLabel}>Средно на бележка</Text>
            </View>

            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownTitle}>Разходи по категории</Text>
              {renderCategoryBreakdown()}
            </View>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyText}>Няма данни за показване</Text>
            <Text style={styles.emptySubtext}>
              Статистиката ще се покаже след като добавите бележки
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
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
  statsContainer: {
    padding: SPACING.lg,
  },
  statCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: SPACING.sm,
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  breakdownCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  breakdownTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  categoryName: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  categoryAmount: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    marginTop: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
