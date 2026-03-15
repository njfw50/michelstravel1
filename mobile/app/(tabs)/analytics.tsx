import { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useAuthCustom } from "@/hooks/use-auth-custom";
import { apiClient } from "@/lib/api-client";
import { CustomerProfile, SavedPassenger } from "@/types";

type PassengerType = SavedPassenger["passengerType"];

const languageOptions: Array<{ label: string; value: CustomerProfile["preferredLanguage"] }> = [
  { label: "Portugues", value: "pt" },
  { label: "English", value: "en" },
  { label: "Espanol", value: "es" },
];

const connectionOptions: Array<{ label: string; value: CustomerProfile["connectionTolerance"] }> = [
  { label: "Evitar conexao", value: "avoid" },
  { label: "Ate 1 parada", value: "one_stop" },
  { label: "Equilibrado", value: "balanced" },
  { label: "Preco primeiro", value: "price_first" },
];

const bagOptions: Array<{ label: string; value: CustomerProfile["bagsPreference"] }> = [
  { label: "Mala despachada", value: "checked" },
  { label: "Bagagem de mao", value: "carry" },
  { label: "Posso decidir depois", value: "flexible" },
];

const passengerTypeOptions: Array<{ label: string; value: PassengerType }> = [
  { label: "Adulto", value: "adult" },
  { label: "Crianca", value: "child" },
  { label: "Bebe", value: "infant" },
];

function ChoiceGroup<T extends string>({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: Array<{ label: string; value: T }>;
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <View className="mt-4">
      <Text className="text-sm font-semibold text-foreground">{title}</Text>
      <View className="mt-3 flex-row flex-wrap gap-2">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <TouchableOpacity
              key={option.value}
              className={`rounded-full px-4 py-3 ${selected ? "bg-primary" : "border border-border bg-background"}`}
              onPress={() => onChange(option.value)}
              activeOpacity={0.85}
            >
              <Text className={`text-sm font-semibold ${selected ? "text-background" : "text-foreground"}`}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function AccountScreen() {
  const { user, profile, logout, isLoading, setProfile } = useAuthCustom();
  const [preferredAirport, setPreferredAirport] = useState(profile?.preferredAirport || "EWR");
  const [preferredLanguage, setPreferredLanguage] = useState(profile?.preferredLanguage || "pt");
  const [connectionTolerance, setConnectionTolerance] = useState(profile?.connectionTolerance || "avoid");
  const [bagsPreference, setBagsPreference] = useState(profile?.bagsPreference || "checked");
  const [needsHumanHelp, setNeedsHumanHelp] = useState(profile?.needsHumanHelp ?? true);
  const [seniorAssistantEnabled, setSeniorAssistantEnabled] = useState(profile?.seniorAssistantEnabled ?? true);
  const [savedPassengers, setSavedPassengers] = useState<SavedPassenger[]>(profile?.savedPassengers || []);
  const [newPassengerFirstName, setNewPassengerFirstName] = useState("");
  const [newPassengerLastName, setNewPassengerLastName] = useState("");
  const [newPassengerType, setNewPassengerType] = useState<PassengerType>("adult");
  const [newPassengerMobility, setNewPassengerMobility] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setPreferredAirport(profile.preferredAirport || "EWR");
    setPreferredLanguage(profile.preferredLanguage);
    setConnectionTolerance(profile.connectionTolerance);
    setBagsPreference(profile.bagsPreference);
    setNeedsHumanHelp(profile.needsHumanHelp);
    setSeniorAssistantEnabled(profile.seniorAssistantEnabled);
    setSavedPassengers(profile.savedPassengers || []);
  }, [profile]);

  const fullName = useMemo(
    () => [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Cliente Michels Travel",
    [user?.firstName, user?.lastName],
  );

  const addPassenger = () => {
    if (newPassengerFirstName.trim().length < 2) {
      Alert.alert("Nome incompleto", "Digite pelo menos o primeiro nome do passageiro.");
      return;
    }

    const passenger: SavedPassenger = {
      id: `${Date.now()}`,
      label: newPassengerFirstName.trim(),
      firstName: newPassengerFirstName.trim(),
      lastName: newPassengerLastName.trim() || undefined,
      passengerType: newPassengerType,
      mobilitySupport: newPassengerMobility,
    };

    setSavedPassengers((current) => [...current.slice(0, 11), passenger]);
    setNewPassengerFirstName("");
    setNewPassengerLastName("");
    setNewPassengerType("adult");
    setNewPassengerMobility(false);
  };

  const removePassenger = (id: string) => {
    setSavedPassengers((current) => current.filter((passenger) => passenger.id !== id));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const nextProfile = await apiClient.updateProfile({
        preferredAirport: preferredAirport.trim().toUpperCase() || null,
        preferredLanguage,
        connectionTolerance,
        bagsPreference,
        needsHumanHelp,
        seniorAssistantEnabled,
        savedPassengers,
      });
      await setProfile(nextProfile);
      Alert.alert("Preferencias salvas", "Sua conta ficou pronta para as proximas viagens.");
    } catch (error: any) {
      Alert.alert(
        "Nao foi possivel salvar",
        error?.response?.data?.error || error?.message || "Tente novamente em instantes.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}>
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground">Minha conta</Text>
          <Text className="mt-2 text-sm leading-6 text-muted">
            Guarde suas preferencias de viagem e os passageiros que mais viajam com voce.
          </Text>
        </View>

        <View className="rounded-[26px] border border-border bg-surface px-5 py-5">
          <Text className="text-xs font-semibold uppercase tracking-[0.8px] text-muted">Cadastro</Text>
          <Text className="mt-3 text-xl font-bold text-foreground">{fullName}</Text>
          <Text className="mt-2 text-sm leading-6 text-muted">
            {user?.phone || user?.email || "Seu telefone ou email aparecera aqui"}
          </Text>
        </View>

        <View className="mt-4 rounded-[26px] border border-border bg-surface px-5 py-5">
          <Text className="text-lg font-bold text-foreground">Preferencias do senior</Text>

          <View className="mt-4">
            <Text className="text-sm font-semibold text-foreground">Aeroporto preferido</Text>
            <TextInput
              className="mt-3 rounded-[20px] border border-border bg-background px-4 py-4 text-base text-foreground"
              value={preferredAirport}
              onChangeText={(value) => setPreferredAirport(value.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 3))}
              placeholder="Ex.: EWR"
              placeholderTextColor="#8C98AE"
              autoCapitalize="characters"
            />
          </View>

          <ChoiceGroup
            title="Idioma"
            options={languageOptions}
            value={preferredLanguage}
            onChange={setPreferredLanguage}
          />
          <ChoiceGroup
            title="Conexao"
            options={connectionOptions}
            value={connectionTolerance}
            onChange={setConnectionTolerance}
          />
          <ChoiceGroup
            title="Bagagem"
            options={bagOptions}
            value={bagsPreference}
            onChange={setBagsPreference}
          />

          <View className="mt-4 gap-3">
            <TouchableOpacity
              className={`rounded-[20px] px-4 py-4 ${needsHumanHelp ? "bg-primary" : "border border-border bg-background"}`}
              onPress={() => setNeedsHumanHelp((current) => !current)}
              activeOpacity={0.85}
            >
              <Text className={`text-base font-semibold ${needsHumanHelp ? "text-background" : "text-foreground"}`}>
                {needsHumanHelp ? "Ajuda humana priorizada" : "Ajuda humana so quando eu pedir"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`rounded-[20px] px-4 py-4 ${seniorAssistantEnabled ? "bg-primary" : "border border-border bg-background"}`}
              onPress={() => setSeniorAssistantEnabled((current) => !current)}
              activeOpacity={0.85}
            >
              <Text className={`text-base font-semibold ${seniorAssistantEnabled ? "text-background" : "text-foreground"}`}>
                {seniorAssistantEnabled ? "Assistente senior ativa" : "Assistente senior pausada"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="mt-4 rounded-[26px] border border-border bg-surface px-5 py-5">
          <Text className="text-lg font-bold text-foreground">Passageiros salvos</Text>
          <Text className="mt-2 text-sm leading-6 text-muted">
            Guarde nomes e preferencias simples. Cartoes e documentos sensiveis nao ficam guardados aqui.
          </Text>

          <View className="mt-4 gap-3">
            <TextInput
              className="rounded-[20px] border border-border bg-background px-4 py-4 text-base text-foreground"
              value={newPassengerFirstName}
              onChangeText={setNewPassengerFirstName}
              placeholder="Primeiro nome"
              placeholderTextColor="#8C98AE"
            />
            <TextInput
              className="rounded-[20px] border border-border bg-background px-4 py-4 text-base text-foreground"
              value={newPassengerLastName}
              onChangeText={setNewPassengerLastName}
              placeholder="Sobrenome"
              placeholderTextColor="#8C98AE"
            />
          </View>

          <ChoiceGroup
            title="Tipo de passageiro"
            options={passengerTypeOptions}
            value={newPassengerType}
            onChange={setNewPassengerType}
          />

          <TouchableOpacity
            className={`mt-4 rounded-[20px] px-4 py-4 ${newPassengerMobility ? "bg-primary" : "border border-border bg-background"}`}
            onPress={() => setNewPassengerMobility((current) => !current)}
            activeOpacity={0.85}
          >
            <Text className={`text-base font-semibold ${newPassengerMobility ? "text-background" : "text-foreground"}`}>
              {newPassengerMobility ? "Precisa de apoio de mobilidade" : "Nao precisa de apoio de mobilidade"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="mt-4 rounded-[22px] border border-border bg-background px-5 py-4"
            onPress={addPassenger}
            activeOpacity={0.85}
          >
            <Text className="text-center text-base font-semibold text-foreground">Adicionar passageiro</Text>
          </TouchableOpacity>

          <View className="mt-5 gap-3">
            {savedPassengers.length === 0 ? (
              <View className="rounded-[22px] bg-background px-4 py-4">
                <Text className="text-sm leading-6 text-muted">
                  Nenhum passageiro salvo ainda.
                </Text>
              </View>
            ) : (
              savedPassengers.map((passenger) => (
                <View key={passenger.id} className="rounded-[22px] bg-background px-4 py-4">
                  <View className="flex-row items-start justify-between gap-4">
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-foreground">
                        {[passenger.firstName, passenger.lastName].filter(Boolean).join(" ")}
                      </Text>
                      <Text className="mt-1 text-sm leading-6 text-muted">
                        {passenger.passengerType === "adult"
                          ? "Adulto"
                          : passenger.passengerType === "child"
                            ? "Crianca"
                            : "Bebe"}
                        {passenger.mobilitySupport ? " · precisa de apoio de mobilidade" : ""}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => removePassenger(passenger.id)} activeOpacity={0.85}>
                      <Text className="text-sm font-semibold text-primary">Remover</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        <TouchableOpacity
          className={`mt-6 rounded-[22px] bg-primary px-5 py-4 ${isSaving ? "opacity-70" : ""}`}
          activeOpacity={0.85}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text className="text-center text-base font-semibold text-background">
            {isSaving ? "Salvando..." : "Salvar preferencias"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`mt-4 rounded-[22px] border border-border bg-background px-5 py-4 ${isLoading ? "opacity-70" : ""}`}
          activeOpacity={0.85}
          onPress={logout}
          disabled={isLoading}
        >
          <Text className="text-center text-base font-semibold text-foreground">
            Sair desta conta
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
