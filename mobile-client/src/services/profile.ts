import { api } from "../lib/api";
import { MobileCustomerProfile } from "../store/authStore";

type ProfileResponse = {
  profile: MobileCustomerProfile;
};

export async function updateCustomerProfile(payload: Partial<MobileCustomerProfile>) {
  const response = await api.patch<ProfileResponse>("/api/mobile/customer/profile", payload);
  return response.data.profile;
}
