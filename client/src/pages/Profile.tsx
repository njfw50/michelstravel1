import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Plane,
  Calendar,
  Save,
  Loader2,
  Shield,
  CheckCircle,
} from "lucide-react";
import { SEO } from "@/components/SEO";

interface ProfileData {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  profileImageUrl: string | null;
  createdAt: string | null;
  bookingsCount: number;
}

function safeDateFormat(dateStr: string | null) {
  if (!dateStr) return "---";
  try {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function Profile() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useI18n();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery<ProfileData>({
    queryKey: ["/api/profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load profile");
      return res.json();
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || "");
      setLastName(profile.lastName || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; phone: string }) => {
      const res = await apiRequest("PATCH", "/api/profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast({
        title: t("profile.saved_title") || "Profile updated",
        description: t("profile.saved_desc") || "Your information has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: t("profile.error_title") || "Error",
        description: t("profile.error_desc") || "Could not update your profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ firstName, lastName, phone });
  };

  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="bg-white border-gray-200 shadow-sm rounded-2xl max-w-md w-full">
          <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
              <User className="h-7 w-7 text-blue-500" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">{t("profile.login_required") || "Sign in to see your profile"}</h2>
              <p className="text-sm text-gray-500 mt-1">{t("profile.login_required_desc") || "You need to be logged in to view and edit your profile."}</p>
            </div>
            <Button
              onClick={() => { window.location.href = "/api/login"; }}
              className="bg-blue-600 text-white font-bold"
              data-testid="button-login-from-profile"
            >
              {t("nav.signin") || "Sign In"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isLoading = authLoading || profileLoading;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <SEO title="Meu Perfil" description="Gerencie suas informações pessoais e preferências de viagem." path="/profile" noindex={true} />
      <div className="bg-white border-b border-gray-200 shadow-sm pt-8 pb-6 px-4">
        <div className="container mx-auto max-w-2xl">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold font-display text-gray-900" data-testid="text-profile-title">
              {t("profile.title") || "My Profile"}
            </h1>
            <p className="text-gray-500 mt-1">
              {t("profile.subtitle") || "Your personal information and account details."}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 mt-8 space-y-6">
        {isLoading ? (
          <Card className="bg-white border-gray-200 rounded-2xl">
            <CardContent className="p-8">
              <div className="animate-pulse space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-gray-200" />
                  <div className="space-y-2 flex-1">
                    <div className="h-5 w-40 bg-gray-200 rounded" />
                    <div className="h-4 w-56 bg-gray-100 rounded" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-10 bg-gray-100 rounded-lg" />
                  <div className="h-10 bg-gray-100 rounded-lg" />
                  <div className="h-10 bg-gray-100 rounded-lg" />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card className="bg-white border-gray-200 shadow-sm rounded-2xl" data-testid="card-profile-header">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center text-white ring-4 ring-blue-100 shrink-0">
                      {profile?.profileImageUrl ? (
                        <img src={profile.profileImageUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
                      ) : (
                        <User className="h-7 w-7" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-bold text-gray-900 text-lg" data-testid="text-profile-name">
                        {profile?.firstName || profile?.lastName
                          ? `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim()
                          : t("profile.unnamed") || "Traveler"}
                      </h2>
                      <p className="text-sm text-gray-500 flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        <span data-testid="text-profile-email">{profile?.email || "---"}</span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                      <div className="flex items-center gap-2 text-blue-600 mb-1">
                        <Plane className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">{t("profile.total_trips") || "Trips"}</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-700" data-testid="text-profile-bookings-count">
                        {profile?.bookingsCount || 0}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="flex items-center gap-2 text-gray-500 mb-1">
                        <Calendar className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">{t("profile.member_since") || "Member since"}</span>
                      </div>
                      <div className="text-sm font-semibold text-gray-700" data-testid="text-profile-member-since">
                        {safeDateFormat(profile?.createdAt || null)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
              <Card className="bg-white border-gray-200 shadow-sm rounded-2xl" data-testid="card-profile-form">
                <CardContent className="p-6">
                  <h3 className="font-bold text-gray-900 text-sm mb-1 flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-500" />
                    {t("profile.personal_info") || "Personal Information"}
                  </h3>
                  <p className="text-xs text-gray-500 mb-5">{t("profile.personal_info_desc") || "Keep your info up to date so we can reach you about your bookings."}</p>

                  <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-gray-600 text-sm">{t("profile.first_name") || "First name"}</Label>
                        <Input
                          id="firstName"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder={t("profile.first_name_placeholder") || "Your first name"}
                          className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
                          data-testid="input-profile-firstname"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-gray-600 text-sm">{t("profile.last_name") || "Last name"}</Label>
                        <Input
                          id="lastName"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder={t("profile.last_name_placeholder") || "Your last name"}
                          className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
                          data-testid="input-profile-lastname"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-gray-600 text-sm flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" />
                        {t("profile.phone") || "Phone number"}
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder={t("profile.phone_placeholder") || "+1 (555) 000-0000"}
                        className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
                        data-testid="input-profile-phone"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-600 text-sm flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        {t("profile.email_label") || "Email"}
                      </Label>
                      <Input
                        value={profile?.email || ""}
                        disabled
                        className="bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
                        data-testid="input-profile-email"
                      />
                      <p className="text-xs text-gray-400">{t("profile.email_note") || "Your email is linked to your account and can't be changed here."}</p>
                    </div>

                    <Separator className="bg-gray-100" />

                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="border-gray-200 text-gray-600 gap-2"
                        onClick={() => setLocation("/my-trips")}
                        data-testid="button-goto-trips"
                      >
                        <Plane className="h-4 w-4" />
                        {t("profile.view_trips") || "View My Trips"}
                      </Button>

                      <Button
                        type="submit"
                        disabled={updateMutation.isPending}
                        className="bg-blue-600 text-white font-bold gap-2"
                        data-testid="button-save-profile"
                      >
                        {updateMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : saved ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        {saved ? (t("profile.saved") || "Saved!") : (t("profile.save") || "Save Changes")}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
              <Card className="bg-white border-gray-200 shadow-sm rounded-2xl" data-testid="card-security-info">
                <CardContent className="p-6">
                  <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    {t("profile.security_title") || "Account Security"}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                      <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-emerald-700">{t("profile.secure_login") || "Secure login active"}</p>
                        <p className="text-xs text-emerald-600">{t("profile.secure_login_desc") || "Your account is protected with encrypted authentication. Your data is always safe."}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
                      <Shield className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-blue-700">{t("profile.data_protected") || "Data protection"}</p>
                        <p className="text-xs text-blue-600">{t("profile.data_protected_desc") || "Your personal and payment information is encrypted and stored securely. We never share your data."}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
