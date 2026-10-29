import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { MamaCharacter, MamaPose } from './MamaCharacter';
import {
  preferencesStore,
  SUPPORTED_COUNTRIES,
  SUPPORTED_CURRENCIES,
  SupportedCountry,
  formatCurrency,
} from '../../services/preferencesStore';

interface CountryCurrencyModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CountryCurrencyModal: React.FC<CountryCurrencyModalProps> = ({
  visible,
  onClose,
}) => {
  const currentPass = preferencesStore.getKitchenPass();

  const [selectedCountryId, setSelectedCountryId] = useState(currentPass.country || 'NG');
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState(currentPass.currencyCode || 'NGN');
  const [weeklyBudgetString, setWeeklyBudgetString] = useState(String(currentPass.weeklyBudget || 35000));
  const [customCountryName, setCustomCountryName] = useState('');
  const [customCurrencySymbol, setCustomCurrencySymbol] = useState('');
  const [mamaNote, setMamaNote] = useState<string>("Choose your country so I can price meals and match local staples.");
  const [mamaPose, setMamaPose] = useState<MamaPose>('thinking');

  useEffect(() => {
    if (visible) {
      const pass = preferencesStore.getKitchenPass();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedCountryId(pass.country);
      setSelectedCurrencyCode(pass.currencyCode);
      setWeeklyBudgetString(String(pass.weeklyBudget));
      const found = SUPPORTED_COUNTRIES.find((c) => c.id === pass.country);
      if (found) {
        setMamaNote(found.mamaGreeting);
        setMamaPose('delighted');
      }
    }
  }, [visible]);

  const handleSelectCountry = (country: SupportedCountry) => {
    setSelectedCountryId(country.id);
    setSelectedCurrencyCode(country.currencyCode);
    setWeeklyBudgetString(String(country.defaultWeeklyBudget));
    setMamaNote(country.mamaGreeting);
    setMamaPose('delighted');
  };

  const handleSave = () => {
    const budgetNum = parseFloat(weeklyBudgetString.replace(/[^0-9.]/g, '')) || 35000;
    
    if (selectedCountryId === 'custom' && customCountryName.trim()) {
      preferencesStore.updateKitchenPass({
        country: 'custom',
        countryName: customCountryName.trim(),
        currencyCode: selectedCurrencyCode,
        currencySymbol: customCurrencySymbol.trim() || '$',
        weeklyBudget: budgetNum,
        spentThisWeek: Math.round(budgetNum * 0.3),
      });
    } else {
      preferencesStore.updateCountryAndCurrency(
        selectedCountryId,
        selectedCurrencyCode,
        budgetNum
      );
    }

    onClose();
  };

  const activeCurrency =
    SUPPORTED_CURRENCIES.find((c) => c.code === selectedCurrencyCode) || {
      code: selectedCurrencyCode,
      symbol: currentPass.currencySymbol,
    };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.sheet}
            >
              {/* Header */}
              <View style={styles.sheetHeader}>
                <View style={styles.headerLeft}>
                  <Text style={styles.sheetTitle}>Country & Currency</Text>
                  <Text style={styles.sheetSubtitle}>Mama adapts meal costs & local pantry staples</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close" size={20} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>

              {/* Mama Voice Bar */}
              <View style={styles.mamaBanner}>
                <MamaCharacter pose={mamaPose} size={42} isSpeaking={true} />
                <Text style={styles.mamaBannerText}>&ldquo;{mamaNote}&rdquo;</Text>
              </View>

              <ScrollView style={styles.bodyScroll} showsVerticalScrollIndicator={false}>
                {/* 1. Country Selection */}
                <Text style={styles.sectionLabel}>YOUR COUNTRY</Text>
                <View style={styles.countryGrid}>
                  {SUPPORTED_COUNTRIES.map((country) => {
                    const isSelected = selectedCountryId === country.id;
                    return (
                      <TouchableOpacity
                        key={country.id}
                        style={[styles.countryChip, isSelected && styles.countryChipSelected]}
                        onPress={() => handleSelectCountry(country)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.countryName, isSelected && styles.countryNameSelected]}>
                          {country.name}
                        </Text>
                        <Text style={[styles.countryCurrencyTag, isSelected && styles.countryCurrencyTagSelected]}>
                          {country.currencySymbol} {country.currencyCode}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* 2. Currency Selector */}
                <Text style={styles.sectionLabel}>CURRENCY</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.currencyRow}>
                  {SUPPORTED_CURRENCIES.map((curr) => {
                    const isSelected = selectedCurrencyCode === curr.code;
                    return (
                      <TouchableOpacity
                        key={curr.code}
                        style={[styles.currPill, isSelected && styles.currPillSelected]}
                        onPress={() => {
                          setSelectedCurrencyCode(curr.code);
                          setMamaPose('writing');
                        }}
                      >
                        <Text style={[styles.currSymbol, isSelected && styles.currSymbolSelected]}>
                          {curr.symbol}
                        </Text>
                        <Text style={[styles.currCode, isSelected && styles.currCodeSelected]}>
                          {curr.code}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* 3. Weekly Food Budget */}
                <Text style={styles.sectionLabel}>WEEKLY FOOD BUDGET</Text>
                <View style={styles.budgetInputContainer}>
                  <Text style={styles.budgetSymbolPrefix}>{activeCurrency.symbol}</Text>
                  <TextInput
                    style={styles.budgetInput}
                    value={weeklyBudgetString}
                    onChangeText={setWeeklyBudgetString}
                    keyboardType="numeric"
                    placeholder="e.g. 35000"
                    placeholderTextColor={colors.text.muted}
                  />
                  <Text style={styles.budgetSuffix}>/ week</Text>
                </View>
                <Text style={styles.budgetTip}>
                  Mama keeps track of cooking vs takeout so you never overspend.
                </Text>
              </ScrollView>

              {/* Action Button */}
              <View style={styles.footer}>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
                  <Text style={styles.saveBtnText}>Save Preferences</Text>
                  <Ionicons name="checkmark" size={18} color={colors.snow100} />
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.snow100,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    maxHeight: '85%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  headerLeft: {
    flex: 1,
  },
  sheetTitle: {
    fontSize: 20,
    fontFamily: typography.fontFamily.serif,
    fontWeight: '600',
    color: colors.text.primary,
  },
  sheetSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.snow200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mamaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#ECE3D4',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  mamaBannerText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: colors.text.primary,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  bodyScroll: {
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.text.muted,
    letterSpacing: 0.8,
    marginTop: 12,
    marginBottom: 8,
  },
  countryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  countryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.snow200,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  countryChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  countryName: {
    fontSize: typography.fontSize.sub,
    fontWeight: '600',
    color: colors.text.primary,
  },
  countryNameSelected: {
    color: colors.snow100,
  },
  countryCurrencyTag: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
  },
  countryCurrencyTagSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  currPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: colors.snow200,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  currPillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  currSymbol: {
    fontSize: typography.fontSize.sub,
    fontWeight: '700',
    color: colors.text.primary,
  },
  currSymbolSelected: {
    color: colors.snow100,
  },
  currCode: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
  },
  currCodeSelected: {
    color: colors.snow100,
  },
  budgetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.snow200,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.08)',
  },
  budgetSymbolPrefix: {
    fontSize: 24,
    fontFamily: typography.fontFamily.serif,
    color: colors.text.primary,
    marginRight: 6,
  },
  budgetInput: {
    flex: 1,
    fontSize: 22,
    fontFamily: typography.fontFamily.serif,
    color: colors.text.primary,
    padding: 0,
  },
  budgetSuffix: {
    fontSize: typography.fontSize.sub,
    color: colors.text.muted,
  },
  budgetTip: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: 6,
    marginBottom: 16,
  },
  footer: {
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(36, 40, 32, 0.08)',
  },
  saveBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
  },
  saveBtnText: {
    color: colors.snow100,
    fontSize: typography.fontSize.sub,
    fontWeight: '600',
  },
});
