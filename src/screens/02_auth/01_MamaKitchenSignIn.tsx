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

type Props = NativeStackScreenProps<RootStackParamList, 'MamaKitchenSignIn'>;

export const MamaKitchenSignIn: React.FC<Props> = ({ navigation }) => {
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
    // Elegant Staggered Entrance
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
  }, []);

  const triggerErrorShake = () => {
    Animated.sequence([
      Animated.timing(shakeOffset, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeOffset, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeOffset, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeOffset, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeOffset, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please fill in both email and password.');
      triggerErrorShake();
      return;
    }
    setErrorMessage('');
    setLoading(true);

    try {
      const { authService } = await import('../../services/api/authService');
      const { preferencesStore } = await import('../../services/preferencesStore');
      await authService.signIn({ email: email.trim(), password });
      await preferencesStore.initFromDb();
      const pass = preferencesStore.getKitchenPass();
      if (pass.hasCompletedOnboarding) {
        navigation.replace('YourDailyEdit');
      } else {
        navigation.replace('MakeItYours');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to sign in. Please try again.');
      triggerErrorShake();
    } finally {
      setLoading(false);
    }
  };


  const handleForgotPassword = () => {
    // Navigation to forgot password when added
  };

  const handleCreateAccount = () => {
    navigation.navigate('MamaKitchenSignUp');
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
            <MamaKitchenLogo width={216} height={162} />
          </Animated.View>

          {/* Sign In Content */}
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
              <Text style={styles.heading}>Welcome back.</Text>
              <Text style={styles.supportingCopy}>
                Your daily edit is waiting. Let’s find something good for your table.
              </Text>
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
                label="EMAIL ADDRESS"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoComplete="email"
              />

              <InputField
                label="PASSWORD"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                isPassword
                autoComplete="password"
              />

              {/* Forgot Password */}
              <TouchableOpacity
                onPress={handleForgotPassword}
                style={styles.forgotPasswordWrapper}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>

              {/* Primary Action Button */}
              <View style={styles.actionContainer}>
                <PrimaryButton
                  title="Sign in"
                  onPress={handleSignIn}
                  loading={loading}
                  showArrow
                />
                <Text style={styles.reassurance}>
                  Good food. Your taste. Your budget.
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
              onPress={handleCreateAccount}
              activeOpacity={0.7}
              style={styles.createAccountRow}
            >
              <Text style={styles.newToMama}>New to Mama Kitchen? </Text>
              <Text style={styles.createAccountLink}>Create an account</Text>
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
    gap: 32,
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
    gap: 16,
  },
  forgotPasswordWrapper: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
  },
  forgotPasswordText: {
    fontSize: typography.fontSize.sub,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  actionContainer: {
    marginTop: 8,
    gap: 12,
  },
  reassurance: {
    fontSize: typography.fontSize.reassurance,
    lineHeight: 17,
    color: colors.text.secondary,
    textAlign: 'center',
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
  createAccountRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newToMama: {
    fontSize: typography.fontSize.sub,
    color: colors.text.secondary,
  },
  createAccountLink: {
    fontSize: typography.fontSize.sub,
    color: colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default MamaKitchenSignIn;
