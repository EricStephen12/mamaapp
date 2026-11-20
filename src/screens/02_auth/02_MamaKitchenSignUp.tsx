import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { MamaKitchenLogo } from '../../components/common/MamaKitchenLogo';
import { InputField } from '../../components/common/InputField';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { preferencesStore } from '../../services/preferencesStore';

type Props = NativeStackScreenProps<RootStackParamList, 'MamaKitchenSignUp'>;

export const MamaKitchenSignUp: React.FC<Props> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Choreographed Entrance Animations
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerY = useRef(new Animated.Value(15)).current;

  const introFade = useRef(new Animated.Value(0)).current;
  const introY = useRef(new Animated.Value(15)).current;

  const formFade = useRef(new Animated.Value(0)).current;
  const formY = useRef(new Animated.Value(15)).current;

  const footerFade = useRef(new Animated.Value(0)).current;

  // Error Shake Feedback
  const shakeOffset = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(100, [
      Animated.parallel([
        Animated.timing(headerFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(headerY, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(introFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(introY, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(formFade, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(formY, { toValue: 0, duration: 450, useNativeDriver: true }),
      ]),
      Animated.timing(footerFade, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [headerFade, headerY, introFade, introY, formFade, formY, footerFade]);

  const triggerErrorShake = () => {
    Animated.sequence([
      Animated.timing(shakeOffset, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeOffset, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeOffset, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeOffset, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeOffset, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleSignUp = async () => {
    if (!name.trim()) {
      setErrorMessage('Please enter your name.');
      triggerErrorShake();
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      triggerErrorShake();
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      triggerErrorShake();
      return;
    }

    setErrorMessage('');
    setLoading(true);

    try {
      const { authService } = await import('../../services/api/authService');
      await authService.signUp({ name: name.trim(), email: email.trim(), password });
      const pass = preferencesStore.getKitchenPass();
      if (pass.hasCompletedOnboarding) {
        navigation.replace('YourDailyEdit');
      } else {
        navigation.replace('MakeItYours');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create account. Please try again.');
      triggerErrorShake();
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = () => {
    navigation.navigate('MamaKitchenSignIn');
  };

  const handleSkip = () => {
    const pass = preferencesStore.getKitchenPass();
    if (pass.hasCompletedOnboarding) {
      navigation.replace('YourDailyEdit');
    } else {
      navigation.replace('MakeItYours');
    }
  };

  const handleTerms = () => {
    Alert.alert(
      'Terms of Service',
      'Mama Kitchen provides personalized home cooking suggestions and budget planning tools for informational use. You are responsible for verifying food allergies, ingredient safety, and proper cooking temperatures in your kitchen.'
    );
  };

  const handlePrivacy = () => {
    Alert.alert(
      'Privacy Policy',
      'We store only your name, email, kitchen preferences, saved recipes, and pantry items to personalize your meals. We never sell your personal data. You can permanently delete your account and all data at any time from Kitchen Pass > Account.'
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Skip Bar */}
          <View style={{ alignItems: 'flex-end', paddingHorizontal: 24, paddingTop: 8 }}>
            <TouchableOpacity
              onPress={handleSkip}
              activeOpacity={0.7}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 16,
                backgroundColor: colors.snow200,
              }}
            >
              <Text style={{ fontSize: 13, color: colors.text.primary, fontWeight: '600' }}>
                Skip
              </Text>
            </TouchableOpacity>
          </View>

          {/* Brand Header */}
          <Animated.View
            style={[
              styles.brandContainer,
              {
                opacity: headerFade,
                transform: [{ translateY: headerY }],
              },
            ]}
          >
            <MamaKitchenLogo width={150} height={110} />
          </Animated.View>

          {/* Sign Up Content */}
          <View style={styles.content}>
            {/* Introduction */}
            <Animated.View
              style={[
                styles.introContainer,
                {
                  opacity: introFade,
                  transform: [{ translateY: introY }],
                },
              ]}
            >
              <Text style={styles.heading}>Create account</Text>
            </Animated.View>

            {/* Error Banner */}
            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorBannerText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Form with Error Shake Physics */}
            <Animated.View
              style={[
                styles.form,
                {
                  opacity: formFade,
                  transform: [
                    { translateY: formY },
                    { translateX: shakeOffset },
                  ],
                },
              ]}
            >
              <InputField
                label="NAME"
                placeholder="First name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
              />

              <InputField
                label="EMAIL"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoComplete="email"
              />

              <InputField
                label="PASSWORD"
                placeholder="8+ characters"
                value={password}
                onChangeText={setPassword}
                isPassword
                autoComplete="new-password"
              />

              {/* Primary Action Button */}
              <View style={styles.actionContainer}>
                <PrimaryButton
                  title="Create account"
                  onPress={handleSignUp}
                  loading={loading}
                  showArrow
                />

                {/* Terms and Privacy Policy Note */}
                <Text style={styles.termsAndPrivacy}>
                  By continuing, you agree to our{' '}
                  <Text onPress={handleTerms} style={styles.linkText}>
                    Terms
                  </Text>{' '}
                  &{' '}
                  <Text onPress={handlePrivacy} style={styles.linkText}>
                    Privacy Policy
                  </Text>
                  .
                </Text>
              </View>
            </Animated.View>
          </View>

          {/* Account Entry Footer */}
          <Animated.View
            style={[
              styles.footer,
              { opacity: footerFade },
            ]}
          >
            <View style={styles.divider} />
            <TouchableOpacity
              onPress={handleSignIn}
              activeOpacity={0.7}
              style={styles.signInRow}
            >
              <Text style={styles.alreadyAtThe}>Have an account? </Text>
              <Text style={styles.signInLink}>Sign in</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  brandContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    gap: 28,
  },
  introContainer: {
    gap: 12,
  },
  heading: {
    fontSize: typography.fontSize.heading,
    lineHeight: 46,
    fontFamily: typography.fontFamily.serif,
    color: colors.text.primary,
    fontWeight: '500',
  },
  supportingCopy: {
    fontSize: typography.fontSize.sub,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  errorBox: {
    padding: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
  },
  errorBannerText: {
    color: '#D32F2F',
    fontSize: 13,
  },
  form: {
    gap: 18,
  },
  actionContainer: {
    marginTop: 6,
    gap: 14,
  },
  termsAndPrivacy: {
    fontSize: typography.fontSize.reassurance,
    lineHeight: 17,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  linkText: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    gap: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    width: '100%',
  },
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alreadyAtThe: {
    fontSize: typography.fontSize.sub,
    color: colors.text.secondary,
  },
  signInLink: {
    fontSize: typography.fontSize.sub,
    color: colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default MamaKitchenSignUp;
