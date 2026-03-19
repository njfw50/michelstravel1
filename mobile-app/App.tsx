import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from './theme';
import MobileDashboard from './screens/MobileDashboard';
import Bookings from './screens/Bookings';
import VoiceEscalations from './screens/VoiceEscalations';
import Deals from './screens/Deals';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName = 'home';
            if (route.name === 'Painel') iconName = 'ios-speedometer';
            if (route.name === 'Reservas') iconName = 'ios-list';
            if (route.name === 'Voz') iconName = 'ios-mic';
            if (route.name === 'Ofertas') iconName = 'ios-pricetag';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.muted,
          headerShown: false,
        })}
      >
        <Tab.Screen name="Painel" component={MobileDashboard} />
        <Tab.Screen name="Reservas" component={Bookings} />
        <Tab.Screen name="Voz" component={VoiceEscalations} />
        <Tab.Screen name="Ofertas" component={Deals} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
