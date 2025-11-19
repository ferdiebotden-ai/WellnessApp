import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  SignInScreen,
  SignUpScreen,
  ForgotPasswordScreen,
} from '../screens/auth';
import { palette } from '../theme/palette';

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

/**
 * Navigation stack for unauthenticated users (sign-in, sign-up, password reset).
 */
export const AuthStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="SignIn"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.background },
      }}
    >
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
};

