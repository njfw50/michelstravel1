import { NavigatorScreenParams } from "@react-navigation/native";
import { FlightOffer, FlightSearchRequest } from "./flights";
import { JourneyMode, SeniorPreferences } from "./app";

export type RegularTabParamList = {
  RegularHome: undefined;
  RegularCatalog: undefined;
  RegularTrips: undefined;
  RegularHelp: undefined;
};

export type SeniorTabParamList = {
  SeniorHome: undefined;
  SeniorTrips: undefined;
  SeniorHelp: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  AppStatus: { environment: "test" | "production"; language?: "pt" | "en" | "es" };
  LanguageSelect: undefined;
  Login: undefined;
  Register: undefined;
  Terms: undefined;
  Privacy: undefined;
  Onboarding: undefined;
  RegularMain: NavigatorScreenParams<RegularTabParamList> | undefined;
  SeniorMain: NavigatorScreenParams<SeniorTabParamList> | undefined;
  RegularResults: { search: FlightSearchRequest };
  SeniorResults: { search: FlightSearchRequest; preferences: SeniorPreferences };
  TripDetail: { offerId: string; initialOffer?: FlightOffer; mode: JourneyMode; preferences?: SeniorPreferences; search?: FlightSearchRequest };
  BookingForm: { offer: FlightOffer; mode: JourneyMode; search?: FlightSearchRequest; preferences?: SeniorPreferences };
};
