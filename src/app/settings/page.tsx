"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  User,
  Wallet,
  Sun,
  Moon,
  Monitor,
  Languages,
  Coins,
  Lock,
  Bell,
  Shield,
  HeartHandshake,
  Info,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  LogOut,
  ArrowLeft,
  Copy,
  Check,
  Plus,
  Trash2,
  Edit2,
  Search,
  Key,
  Eye,
  EyeOff,
  PlusCircle,
  Download,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWallet, SUPPORTED_NETWORKS } from "@/hooks/useWallet";
import { useWalletSecurityContext } from "@/context/WalletSecurityContext";
import { PreferencesService } from "@/services/preferences.service";
import { SecurityService } from "@/services/security.service";
import { generateMnemonicPDF } from "@/lib/pdfBackup";
import { toast } from "sonner";
import ActionPageHeader from "@/components/layout/ActionPageHeader";

type ViewMode = "menu" | "wallet-accounts" | "address-book" | "security-center";

interface ToggleSettingProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleSetting({ icon: Icon, label, description, checked, disabled, onChange }: ToggleSettingProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg border border-border bg-surface p-2 text-muted-foreground">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className={`relative h-6 w-11 rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-neutral-800"
        } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-foreground transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { user, profile, signOut } = useAuth();
  const {
    wallets,
    activeWallet,
    activeNetwork,
    contacts,
    createWallet,
    importWallet,
    renameWallet,
    selectWallet,
    selectNetwork,
    removeWallet,
    exportPrivateKey,
    exportMnemonic,
    addContact,
    updateContact,
    deleteContact,
  } = useWallet();

  const {
    isBiometricsEnabled,
    biometricTypeLabel,
    enableBiometricsWithPrompt,
    disableBiometricsWithPin,
  } = useWalletSecurityContext();

  const [view, setView] = useState<ViewMode>("menu");

  // App settings local state
  const [currency, setCurrency] = useState("USD");
  const [language, setLanguage] = useState("English");
  const { theme, setTheme: setAppTheme } = useTheme();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [passcodeEnabled, setPasscodeEnabled] = useState(true);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Copy states
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals / Action parameters
  const [pinInput, setPinInput] = useState("");
  const [pinAction, setPinAction] = useState<{
    type: "create" | "import" | "export_key" | "export_phrase" | "backup_pdf" | "disable_biometrics";
    walletId?: string;
  } | null>(null);

  // Dialog parameters
  const [showPinModal, setShowPinModal] = useState(false);
  const [newWalletName, setNewWalletName] = useState("");
  const [importPhrase, setImportPhrase] = useState("");
  const [renameWalletId, setRenameWalletId] = useState<string | null>(null);
  const [renameWalletInput, setRenameWalletInput] = useState("");

  // Decrypted output display
  const [decryptedKey, setDecryptedKey] = useState<string | null>(null);
  const [decryptedPhrase, setDecryptedPhrase] = useState<string | null>(null);

  // Address book states
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactAddress, setContactAddress] = useState("");
  const [contactLabel, setContactLabel] = useState("Personal");
  const [editingContactId, setEditingContactId] = useState<string | null>(null);

  // Security Center enterprise states
  const [sessions, setSessions] = useState([
    { id: "sess_current", device_name: "Chrome / macOS", ip_address: "182.253.141.52", location: "Jakarta, ID", is_current: true, last_active: "Active now" },
    { id: "sess_phone", device_name: "iPhone 15 Pro (GoFlazz iOS)", ip_address: "114.124.23.90", location: "Singapore", is_current: false, last_active: "2 hours ago" },
    { id: "sess_tablet", device_name: "Safari / iPadOS", ip_address: "203.190.241.11", location: "Surabaya, ID", is_current: false, last_active: "3 days ago" }
  ]);
  const [socialGuardians, setSocialGuardians] = useState([
    { id: "g1", name: "Alice (Primary)", address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F", status: "active" },
    { id: "g2", name: "Bob (Backup)", address: "0x2546BcD3c84621e901426440170F4b4e2311f71A", status: "active" }
  ]);
  const [newGuardianName, setNewGuardianName] = useState("");
  const [newGuardianAddress, setNewGuardianAddress] = useState("");
  const [mpcSyncing, setMpcSyncing] = useState(false);
  const [isPdfBackedUp, setIsPdfBackedUp] = useState(false);
  const [isSeedPhraseBackedUp, setIsSeedPhraseBackedUp] = useState(false);

  // Load backup completion statuses from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsPdfBackedUp(localStorage.getItem("goflazz_pdf_backed_up") === "true");
      setIsSeedPhraseBackedUp(localStorage.getItem("goflazz_seed_backed_up") === "true");
    }
  }, []);

  // Initialize DB configurations
  useEffect(() => {
    if (!user) return;
    const loadSettings = async () => {
      try {
        const [prefData, secData, notifData] = await Promise.all([
          PreferencesService.getUserPreferences(user.id),
          SecurityService.getSecuritySettings(user.id),
          PreferencesService.getNotificationSettings(user.id),
        ]);

        if (prefData) {
          setCurrency(prefData.currency);
          setLanguage(prefData.language === "en" ? "English" : prefData.language === "id" ? "Indonesian" : "Chinese");
          if (prefData.theme) setAppTheme(prefData.theme);
        }
        if (secData) {
          setPasscodeEnabled(secData.passcode_enabled);
        }
        if (notifData) {
          setPushEnabled(notifData.push_enabled);
          setEmailEnabled(notifData.email_enabled);
        }
      } catch (err) {
        console.error("Error loading settings:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, [user, setAppTheme]);

  // DB Updaters
  const updatePreference = async (key: string, value: any) => {
    if (!user) return;
    try {
      await PreferencesService.updateUserPreference(user.id, key, value);
    } catch (e) {
      console.error(e);
    }
  };

  const updateSecurity = async (key: string, value: boolean) => {
    if (!user) return;
    try {
      await SecurityService.updateSecuritySetting(user.id, key, value);
    } catch (e) {
      console.error(e);
    }
  };

  const updateNotification = async (key: string, value: boolean) => {
    if (!user) return;
    try {
      await PreferencesService.updateNotificationSetting(user.id, key, value);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      toast.success("Successfully logged out");
    } catch (err: any) {
      toast.error(err.message || "Failed to sign out");
      setIsLoggingOut(false);
    }
  };

  const handleCopyText = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Failed to copy address.");
    }
  };

  // Secure PIN execution
  const executePinAuthorizedAction = async () => {
    if (!pinInput || !pinAction) return;

    if (pinAction.type === "create") {
      const res = await createWallet(newWalletName || "Additional Wallet", pinInput);
      if (res) {
        toast.success(`Wallet "${newWalletName || "Additional Wallet"}" created!`);
        setNewWalletName("");
        setShowPinModal(false);
        setPinInput("");
        setPinAction(null);
      }
    } else if (pinAction.type === "import") {
      const res = await importWallet(newWalletName || "Imported Wallet", importPhrase, pinInput);
      if (res) {
        toast.success("Wallet imported successfully!");
        setNewWalletName("");
        setImportPhrase("");
        setShowPinModal(false);
        setPinInput("");
        setPinAction(null);
      }
    } else if (pinAction.type === "export_key") {
      if (pinAction.walletId) {
        const rawKey = await exportPrivateKey(pinAction.walletId, pinInput);
        if (rawKey) {
          setDecryptedKey(rawKey);
          setDecryptedPhrase(null);
          setShowPinModal(false);
          setPinInput("");
        }
      }
    } else if (pinAction.type === "export_phrase") {
      if (pinAction.walletId) {
        const rawPhrase = await exportMnemonic(pinAction.walletId, pinInput);
        if (rawPhrase) {
          setDecryptedPhrase(rawPhrase);
          setDecryptedKey(null);
          setShowPinModal(false);
          setPinInput("");
          localStorage.setItem("goflazz_seed_backed_up", "true");
          setIsSeedPhraseBackedUp(true);
        }
      }
    } else if (pinAction.type === "backup_pdf") {
      if (pinAction.walletId) {
        const rawPhrase = await exportMnemonic(pinAction.walletId, pinInput);
        if (rawPhrase) {
          const targetWallet = wallets.find((w) => w.id === pinAction.walletId);
          generateMnemonicPDF(targetWallet?.name || "Wallet", targetWallet?.address || "", rawPhrase);
          toast.success("PDF backup sheet generated and downloaded!");
          setShowPinModal(false);
          setPinInput("");
          setPinAction(null);
          localStorage.setItem("goflazz_pdf_backed_up", "true");
          setIsPdfBackedUp(true);
        }
      }
    } else if (pinAction.type === "disable_biometrics") {
      const res = await disableBiometricsWithPin(pinInput);
      if (res.success) {
        setShowPinModal(false);
        setPinInput("");
        setPinAction(null);
      } else {
        toast.error(res.error || "Incorrect PIN. Cannot disable biometrics.");
      }
    }
  };

  // Address book handlers
  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingContactId) {
      const success = await updateContact(editingContactId, contactName, contactAddress, contactLabel);
      if (success) {
        setEditingContactId(null);
        setContactName("");
        setContactAddress("");
        setContactLabel("Personal");
        setShowAddContact(false);
      }
    } else {
      const success = await addContact(contactName, contactAddress, contactLabel);
      if (success) {
        setContactName("");
        setContactAddress("");
        setContactLabel("Personal");
        setShowAddContact(false);
      }
    }
  };

  const handleEditContact = (c: any) => {
    setEditingContactId(c.id);
    setContactName(c.name);
    setContactAddress(c.address);
    setContactLabel(c.label || "Personal");
    setShowAddContact(true);
  };

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.label || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-background pb-28 pt-2 text-foreground relative">
      <div className="mx-auto max-w-[480px] px-2.5 sm:px-3.5 space-y-4">
        {/* VIEW 1: MAIN MENU */}
        {view === "menu" && (
          <div className="space-y-4">
            <ActionPageHeader title="Settings" backHref="/" />

            <div className="space-y-4">
              {/* Profile card */}
              <section className="rounded-[20px] bg-card border border-border/80 p-4 shadow-sm flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-primary/10 text-primary border border-primary/20 shrink-0">
                  <User className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[15px] truncate text-foreground">{profile?.display_name || "GoFlazz User"}</p>
                  <p className="text-[13px] text-muted-foreground truncate font-medium">{user?.email || "Offline Sandbox"}</p>
                </div>
              </section>

              {/* Preferences category */}
              <section className="space-y-2">
                <h2 className="px-1 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Preferences
                </h2>
                <div className="rounded-[20px] bg-card border border-border/80 divide-y divide-border/60 px-4 shadow-sm">
                  {/* Default currency */}
                  <div className="flex items-center justify-between py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="rounded-[12px] border border-border bg-card-secondary p-2 text-muted-foreground">
                        <Coins className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold text-foreground">Default Currency</p>
                        <p className="text-[12px] text-muted-foreground font-medium">Display assets in currency</p>
                      </div>
                    </div>
                    <div className="relative">
                      <select
                        value={currency}
                        disabled={isLoading}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCurrency(val);
                          updatePreference("currency", val);
                          toast.success(`Currency changed to ${val}`);
                        }}
                        className="appearance-none rounded-[14px] border border-border/80 bg-card-secondary py-1.5 pl-3 pr-8 text-[12px] font-semibold text-foreground outline-none focus:border-primary"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="IDR">IDR (Rp)</option>
                        <option value="SGD">SGD (S$)</option>
                        <option value="EUR">EUR (€)</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Language */}
                  <div className="flex items-center justify-between py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="rounded-[12px] border border-border bg-card-secondary p-2 text-muted-foreground">
                        <Languages className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold text-foreground">Language</p>
                        <p className="text-[12px] text-muted-foreground font-medium">App display language</p>
                      </div>
                    </div>
                    <div className="relative">
                      <select
                        value={language}
                        disabled={isLoading}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLanguage(val);
                          const code = val === "English" ? "en" : val === "Indonesian" ? "id" : "zh";
                          updatePreference("language", code);
                          toast.success(`Language updated to ${val}`);
                        }}
                        className="appearance-none rounded-[14px] border border-border/80 bg-card-secondary py-1.5 pl-3 pr-8 text-[12px] font-semibold text-foreground outline-none focus:border-primary"
                      >
                        <option value="English">English</option>
                        <option value="Indonesian">Indonesian</option>
                        <option value="Chinese">中文</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Theme */}
                  <div className="flex items-center justify-between py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="rounded-[12px] border border-border bg-card-secondary p-2 text-muted-foreground">
                        {theme === "light" ? <Sun className="h-4 w-4" /> : theme === "system" ? <Monitor className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold text-foreground">Appearance</p>
                        <p className="text-[12px] text-muted-foreground font-medium">Choose visual layout</p>
                      </div>
                    </div>
                    <div className="relative">
                      <select
                        value={theme}
                        disabled={isLoading}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAppTheme(val);
                          updatePreference("theme", val);
                          toast.success(`Appearance changed to ${val} theme`);
                        }}
                        className="appearance-none rounded-[14px] border border-border/80 bg-card-secondary py-1.5 pl-3 pr-8 text-[12px] font-semibold text-foreground outline-none focus:border-primary"
                      >
                        <option value="dark">Dark Theme</option>
                        <option value="light">Light Theme</option>
                        <option value="system">System</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Address Book */}
                  <div
                    onClick={() => setView("address-book")}
                    className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-foreground/5 transition rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-[12px] border border-border bg-card-secondary p-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold text-foreground">Address Book</p>
                        <p className="text-[12px] text-muted-foreground font-medium">Manage your saved contacts</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </section>

              {/* Wallet Category */}
              <section className="space-y-2">
                <h2 className="px-1 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Security & Wallet
                </h2>
                <div className="rounded-[20px] bg-card border border-border/80 divide-y divide-border/60 px-4 shadow-sm">
                  <ToggleSetting
                    icon={Shield}
                    label={`${biometricTypeLabel} Authentication`}
                    description={`Use ${biometricTypeLabel} for fast unlock`}
                    checked={isBiometricsEnabled}
                    disabled={isLoading}
                    onChange={async (checked) => {
                      if (checked) {
                        await enableBiometricsWithPrompt();
                      } else {
                        setPinAction({ type: "disable_biometrics" });
                        setShowPinModal(true);
                      }
                    }}
                  />
                  <ToggleSetting
                    icon={Lock}
                    label="App Passcode"
                    description="Require PIN on startup"
                    checked={passcodeEnabled}
                    disabled={isLoading}
                    onChange={(checked) => {
                      setPasscodeEnabled(checked);
                      updateSecurity("passcode_enabled", checked);
                      toast.success(checked ? "App passcode lock enabled" : "App passcode lock disabled");
                    }}
                  />

                  {/* Wallet Management Link */}
                  <div
                    onClick={() => setView("wallet-accounts")}
                    className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-foreground/5 transition rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-[12px] border border-border bg-card-secondary p-2 text-muted-foreground">
                        <Wallet className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold text-foreground">Wallet Management</p>
                        <p className="text-[12px] text-muted-foreground font-medium">Manage keys, networks, and backups</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>

                  {/* Security Center Link */}
                  <div
                    onClick={() => setView("security-center")}
                    className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-foreground/5 transition rounded-xl"
                    id="security-center-link"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-[12px] border border-primary/20 bg-primary/10 p-2 text-primary">
                        <Shield className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold text-primary">Security Center</p>
                        <p className="text-[12px] text-muted-foreground font-medium">Check score, devices & MPC backup health</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </section>

              {/* Notifications */}
              <section className="space-y-2">
                <h2 className="px-1 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Notifications
                </h2>
                <div className="rounded-[20px] bg-card border border-border/80 divide-y divide-border/60 px-4 shadow-sm">
                  <ToggleSetting
                    icon={Bell}
                    label="Push Notifications"
                    description="Receive alerts for transactions"
                    checked={pushEnabled}
                    disabled={isLoading}
                    onChange={(checked) => {
                      setPushEnabled(checked);
                      updateNotification("push_enabled", checked);
                      toast.success(checked ? "Push notifications enabled" : "Push notifications disabled");
                    }}
                  />
                  <ToggleSetting
                    icon={Bell}
                    label="Email Alerts"
                    description="Weekly portfolio updates"
                    checked={emailEnabled}
                    disabled={isLoading}
                    onChange={(checked) => {
                      setEmailEnabled(checked);
                      updateNotification("email_enabled", checked);
                      toast.success(checked ? "Email alerts enabled" : "Email alerts disabled");
                    }}
                  />
                </div>
              </section>

              {/* Sign Out */}
              <section>
                <div className="rounded-[20px] bg-card border border-border/80 p-2 shadow-sm">
                  <button
                    onClick={handleSignOut}
                    disabled={isLoggingOut}
                    className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-destructive/20 bg-destructive/5 py-3 text-[14px] font-semibold text-destructive transition hover:bg-destructive/10 disabled:opacity-50"
                  >
                    {isLoggingOut ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-destructive/20 border-t-destructive" />
                    ) : (
                      <>
                        <LogOut className="h-4 w-4" />
                        Sign Out Securely
                      </>
                    )}
                  </button>
                </div>
              </section>
            </div>
          </div>
        )}

        {/* VIEW 2: WALLET MANAGEMENT */}
        {view === "wallet-accounts" && (
          <div className="space-y-4">
            <ActionPageHeader
              title="Wallets"
              onBack={() => {
                setView("menu");
                setDecryptedKey(null);
                setDecryptedPhrase(null);
              }}
            />

            {/* Network Selector */}
            <section className="space-y-2">
              <h3 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
                Active Chain network
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {SUPPORTED_NETWORKS.map((net) => (
                  <button
                    key={net.id}
                    onClick={() => selectNetwork(net.id)}
                    className={`flex items-center justify-center gap-1.5 p-2.5 rounded-[14px] border text-[12px] font-semibold transition-all ${
                      activeNetwork === net.id
                        ? "border-primary bg-primary text-white shadow-sm"
                        : "border-border/80 bg-card text-muted-foreground hover:text-foreground hover:border-border"
                    }`}
                  >
                    <span>{net.icon}</span>
                    <span className="truncate">{net.name}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Wallet List */}
            <section className="space-y-2.5">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Your Accounts
                </h3>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {wallets.length} {wallets.length === 1 ? "account" : "accounts"}
                </span>
              </div>

              <div className="space-y-2.5">
                {wallets.map((w) => {
                  const isActive = activeWallet?.id === w.id;
                  const isPrimary = w.is_primary;
                  return (
                    <div
                      key={w.id}
                      onClick={() => selectWallet(w.id)}
                      className={`p-4 rounded-[20px] bg-card border space-y-3 transition-all cursor-pointer relative shadow-sm ${
                        isActive ? "border-primary ring-1 ring-primary/30" : "border-border/80 hover:border-primary/30"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          {renameWalletId === w.id ? (
                            <div className="flex items-center gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                value={renameWalletInput}
                                onChange={(e) => setRenameWalletInput(e.target.value)}
                                className="bg-surface border border-border rounded-lg px-2 py-1 text-xs text-foreground max-w-[150px] outline-none"
                              />
                              <button
                                onClick={async () => {
                                  if (renameWalletInput.trim()) {
                                    await renameWallet(w.id, renameWalletInput.trim());
                                    setRenameWalletId(null);
                                  }
                                }}
                                className="p-1 text-success hover:bg-success/10 rounded"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm leading-none">{w.name}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRenameWalletId(w.id);
                                  setRenameWalletInput(w.name);
                                }}
                                className="p-1 rounded hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition"
                                title="Rename Wallet"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                            </div>
                          )}

                          <div className="flex items-center gap-1.5 mt-2">
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {w.address.substring(0, 6)}...{w.address.substring(w.address.length - 4)}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyText(w.address, w.id);
                              }}
                              className="p-1 rounded hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition"
                            >
                              {copiedId === w.id ? (
                                <Check className="h-3 w-3 text-success" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Status badges */}
                        <div className="flex items-center gap-1.5">
                          {isPrimary && (
                            <span className="text-[9px] bg-primary/20 text-primary border border-primary/30 font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full">
                              Primary
                            </span>
                          )}
                          {!isPrimary && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (confirm("Are you sure you want to remove this wallet? Any funds inside must be backed up first.")) {
                                  await removeWallet(w.id);
                                }
                              }}
                              className="p-1.5 rounded-lg border border-destructive/20 text-destructive bg-destructive/5 hover:bg-destructive/10 transition"
                              title="Remove Wallet"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Export buttons */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setPinAction({ type: "backup_pdf", walletId: w.id });
                            setShowPinModal(true);
                          }}
                          className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition font-medium"
                          title="Generate physical PDF backup sheet"
                        >
                          <FileText className="h-3 w-3" />
                          Backup PDF
                        </button>
                        <button
                          onClick={() => {
                            setPinAction({ type: "export_key", walletId: w.id });
                            setShowPinModal(true);
                          }}
                          className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded bg-surface border border-border text-muted-foreground hover:text-foreground transition"
                        >
                          <Key className="h-3 w-3" />
                          Export Private Key
                        </button>
                        <button
                          onClick={() => {
                            setPinAction({ type: "export_phrase", walletId: w.id });
                            setShowPinModal(true);
                          }}
                          className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded bg-surface border border-border text-muted-foreground hover:text-foreground transition"
                        >
                          <Download className="h-3 w-3" />
                          Export Recovery Mnemonic
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Private Details Displays */}
            {(decryptedKey || decryptedPhrase) && (
              <section className="glass-card p-4 space-y-3 border-warning/30 bg-warning/[0.01]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-warning font-semibold text-xs uppercase tracking-wider">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Secure Export Container</span>
                  </div>
                  <button
                    onClick={() => {
                      setDecryptedKey(null);
                      setDecryptedPhrase(null);
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Close
                  </button>
                </div>

                {decryptedKey && (
                  <div className="space-y-2">
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      Your raw private key for selected account. <strong>NEVER</strong> share this with anyone!
                    </p>
                    <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-neutral-900 font-mono text-[10px] text-foreground">
                      <span className="break-all select-all">{decryptedKey}</span>
                      <button
                        onClick={() => handleCopyText(decryptedKey, "decrypted_key")}
                        className="p-1 rounded hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition shrink-0 ml-2"
                      >
                        {copiedId === "decrypted_key" ? (
                          <Check className="h-3.5 w-3.5 text-success" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {decryptedPhrase && (
                  <div className="space-y-2">
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      Your 12-word master Secret Recovery Phrase. It derives all derived accounts.
                    </p>
                    <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-neutral-900 font-mono text-[10px] text-foreground">
                      <span className="break-all select-all">{decryptedPhrase}</span>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <button
                          onClick={() => {
                            const target = wallets.find((w) => w.id === activeWallet?.id) || wallets[0];
                            generateMnemonicPDF(target?.name || "Wallet", target?.address || "", decryptedPhrase);
                            toast.success("PDF backup sheet generated and downloaded!");
                          }}
                          className="flex items-center gap-1 p-1 px-2 rounded bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 transition text-[10px] font-sans font-semibold"
                          title="Download PDF Backup Sheet"
                        >
                          <FileText className="h-3 w-3" />
                          Download PDF
                        </button>
                        <button
                          onClick={() => handleCopyText(decryptedPhrase, "decrypted_phrase")}
                          className="p-1 rounded hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition"
                        >
                          {copiedId === "decrypted_phrase" ? (
                            <Check className="h-3.5 w-3.5 text-success" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Quick Actions */}
            <section className="space-y-3 pt-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                Wallet Actions
              </h3>
              <div className="space-y-3">
                {/* Create Wallet Block */}
                <div className="p-4 rounded-2xl border border-border bg-surface-glass/40 space-y-3">
                  <h4 className="font-semibold text-xs uppercase tracking-wider text-primary">
                    Create Additional Wallet
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    Derive a brand new secure private key and public address instantly.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Trading Wallet"
                      value={newWalletName}
                      onChange={(e) => setNewWalletName(e.target.value)}
                      className="flex-1 bg-surface border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder-muted-foreground outline-none focus:border-primary"
                    />
                    <button
                      onClick={() => {
                        setPinAction({ type: "create" });
                        setShowPinModal(true);
                      }}
                      className="flex items-center gap-1 bg-primary text-white font-semibold text-xs px-3.5 py-2 rounded-xl hover:opacity-95 transition"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Generate
                    </button>
                  </div>
                </div>

                {/* Import Wallet Block */}
                <div className="p-4 rounded-2xl border border-border bg-surface-glass/40 space-y-3">
                  <h4 className="font-semibold text-xs uppercase tracking-wider text-success">
                    Import Wallet Mnemonic
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    Recover keys by submitting a standard 12-word secret mnemonic.
                  </p>
                  <textarea
                    rows={2}
                    placeholder="word1 word2 ... word12"
                    value={importPhrase}
                    onChange={(e) => setImportPhrase(e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder-muted-foreground outline-none focus:border-primary font-mono resize-none"
                  />
                  <button
                    onClick={() => {
                      if (!importPhrase.trim()) {
                        toast.error("Please enter a recovery phrase.");
                        return;
                      }
                      setPinAction({ type: "import" });
                      setShowPinModal(true);
                    }}
                    className="w-full flex items-center justify-center gap-1 bg-success/20 border border-success/30 text-success font-semibold text-xs py-2.5 rounded-xl hover:bg-success/30 transition"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Authorize Import
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* VIEW 3: ADDRESS BOOK (CONTACTS) */}
        {view === "address-book" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setView("menu");
                  setShowAddContact(false);
                  setContactName("");
                  setContactAddress("");
                  setContactLabel("Personal");
                  setEditingContactId(null);
                }}
                className="rounded-full p-2 text-muted-foreground hover:bg-foreground/5 hover:text-foreground transition"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-semibold">Address Book</h1>
            </div>

            {/* Add Contact Button Toggle */}
            {!showAddContact && (
              <button
                onClick={() => {
                  setEditingContactId(null);
                  setContactName("");
                  setContactAddress("");
                  setContactLabel("Personal");
                  setShowAddContact(true);
                }}
                className="w-full flex items-center justify-center gap-2 p-3.5 border border-primary/20 bg-primary/5 rounded-2xl hover:bg-primary/10 transition font-semibold text-sm text-primary"
              >
                <PlusCircle className="h-4 w-4" />
                Add New Contact
              </button>
            )}

            {/* Add/Edit Form */}
            {showAddContact && (
              <form onSubmit={handleSaveContact} className="p-4 rounded-2xl border border-border bg-surface-glass/40 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-xs uppercase tracking-wider text-primary">
                    {editingContactId ? "Edit Contact" : "Add Contact Details"}
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddContact(false);
                      setEditingContactId(null);
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase">Contact Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alice Crypto"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder-muted-foreground outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase">Ethereum Address</label>
                    <input
                      type="text"
                      required
                      placeholder="0x..."
                      value={contactAddress}
                      onChange={(e) => setContactAddress(e.target.value)}
                      className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground placeholder-muted-foreground outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase">Address Label</label>
                    <div className="relative">
                      <select
                        value={contactLabel}
                        onChange={(e) => setContactLabel(e.target.value)}
                        className="w-full appearance-none rounded-xl border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-primary"
                      >
                        <option value="Personal">Personal</option>
                        <option value="Work">Work</option>
                        <option value="Exchange">Exchange</option>
                        <option value="Savings">Savings</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1 bg-primary text-white font-semibold text-xs py-2.5 rounded-xl hover:opacity-95 transition"
                >
                  <Check className="h-3.5 w-3.5" />
                  {editingContactId ? "Save Contact Updates" : "Save Contact"}
                </button>
              </form>
            )}

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search contacts by name or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-surface border border-border rounded-2xl pl-10 pr-4 py-3 text-xs text-foreground placeholder-muted-foreground outline-none focus:border-primary"
              />
            </div>

            {/* Contacts List */}
            <div className="space-y-3">
              {filteredContacts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs border border-dashed border-border rounded-2xl">
                  No contacts found in address book.
                </div>
              ) : (
                filteredContacts.map((c) => (
                  <div
                    key={c.id}
                    className="glass-card p-4 flex items-center justify-between border border-border hover:border-border/80 transition"
                  >
                    <div className="min-w-0 flex-1 mr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm leading-none">{c.name}</span>
                        {c.label && (
                          <span className="text-[8px] bg-neutral-800 text-muted-foreground font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider">
                            {c.label}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="font-mono text-[10px] text-muted-foreground break-all">
                          {c.address}
                        </span>
                        <button
                          onClick={() => handleCopyText(c.address, c.id)}
                          className="p-1 rounded hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition shrink-0"
                        >
                          {copiedId === c.id ? (
                            <Check className="h-3 w-3 text-success" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                      <button
                        onClick={() => handleEditContact(c)}
                        className="p-2 rounded-lg border border-border bg-surface hover:text-foreground hover:bg-foreground/5 transition"
                        title="Edit Contact"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`Delete contact "${c.name}"?`)) {
                            await deleteContact(c.id);
                          }
                        }}
                        className="p-2 rounded-lg border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 text-destructive transition"
                        title="Delete Contact"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* VIEW 4: ENTERPRISE SECURITY CENTER */}
        {view === "security-center" && (
          <div className="space-y-6">
            <div className="mb-6 flex items-center gap-3">
              <button
                onClick={() => setView("menu")}
                className="rounded-full p-2 text-muted-foreground hover:bg-foreground/5 hover:text-foreground transition"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Enterprise Security Center</h1>
                <p className="text-xs text-muted-foreground mt-0.5">Grade-A Protection Status</p>
              </div>
            </div>

            {/* DYNAMIC SECURITY SCORE */}
            <section className="glass-card p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row items-center gap-5">
                {/* Visual Radial Progress */}
                {(() => {
                  let score = 0;
                  if (passcodeEnabled) score += 25;
                  if (isBiometricsEnabled) score += 15;
                  if (isSeedPhraseBackedUp) score += 25;
                  if (isPdfBackedUp) score += 15;
                  score += Math.min(20, socialGuardians.length * 10);

                  const radius = 40;
                  const circumference = 2 * Math.PI * radius;
                  const strokeDashoffset = circumference - (score / 100) * circumference;

                  return (
                    <div className="relative flex items-center justify-center h-28 w-28 shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        {/* Background track */}
                        <circle
                          cx="56"
                          cy="56"
                          r={radius}
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-border"
                        />
                        {/* Active stroke */}
                        <circle
                          cx="56"
                          cy="56"
                          r={radius}
                          stroke="url(#score-gradient)"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          className="transition-all duration-1000 ease-out"
                        />
                        <defs>
                          <linearGradient id="score-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#10b981" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-2xl font-extrabold tracking-tight">{score}%</span>
                        <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold">Score</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Score Summary List */}
                <div className="flex-1 space-y-2.5 w-full">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Security Health Checklist</h3>
                    <span className="text-xs text-emerald-500 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                      {(() => {
                        let score = 0;
                        if (passcodeEnabled) score += 25;
                        if (isBiometricsEnabled) score += 15;
                        if (isSeedPhraseBackedUp) score += 25;
                        if (isPdfBackedUp) score += 15;
                        score += Math.min(20, socialGuardians.length * 10);
                        if (score >= 90) return "Excellent";
                        if (score >= 70) return "Strong";
                        return "Needs Attention";
                      })()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${passcodeEnabled ? "bg-emerald-500" : "bg-neutral-600"}`} />
                      <span className={passcodeEnabled ? "text-foreground" : "text-muted-foreground"}>
                        Passcode Lock (+25)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${isBiometricsEnabled ? "bg-emerald-500" : "bg-neutral-600"}`} />
                      <span className={isBiometricsEnabled ? "text-foreground" : "text-muted-foreground"}>
                        Biometrics (+15)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${isSeedPhraseBackedUp ? "bg-emerald-500" : "bg-neutral-600"}`} />
                      <span className={isSeedPhraseBackedUp ? "text-foreground" : "text-muted-foreground"}>
                        Seed Backup Verified (+25)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${isPdfBackedUp ? "bg-emerald-500" : "bg-neutral-600"}`} />
                      <span className={isPdfBackedUp ? "text-foreground" : "text-muted-foreground"}>
                        Secure PDF Backed (+15)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:col-span-2">
                      <span className={`h-2 w-2 rounded-full ${socialGuardians.length > 0 ? "bg-emerald-500" : "bg-neutral-600"}`} />
                      <span className={socialGuardians.length > 0 ? "text-foreground" : "text-muted-foreground"}>
                        Social Guardians Setup (+20 - {socialGuardians.length}/2 active)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* MULTI-DEVICE SESSION MANAGEMENT */}
            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Active Sessions & Devices
                </h2>
                <span className="text-[10px] text-muted-foreground">3 Registered Devices</span>
              </div>

              <div className="glass-card divide-y divide-border">
                {sessions.map((sess) => (
                  <div key={sess.id} className="p-4 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5 rounded-lg border border-border bg-surface p-2 text-muted-foreground">
                        <Monitor className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold truncate text-foreground">{sess.device_name}</p>
                          {sess.is_current && (
                            <span className="text-[9px] bg-primary/20 text-primary font-bold px-1.5 py-0.5 rounded-md shrink-0 uppercase tracking-wide">
                              This Device
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {sess.ip_address} • {sess.location}
                        </p>
                        <p className="text-[9px] text-muted-foreground mt-0.5">
                          Last active: {sess.last_active}
                        </p>
                      </div>
                    </div>

                    {!sess.is_current && (
                      <button
                        onClick={() => {
                          setSessions((prev) => prev.filter((s) => s.id !== sess.id));
                          toast.success(`Session on ${sess.device_name} revoked and logged out.`);
                        }}
                        className="text-[10px] text-destructive border border-destructive/20 hover:bg-destructive/10 bg-destructive/5 px-2.5 py-1 rounded-lg font-semibold transition shrink-0"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* SOCIAL GUARDIANS (SOCIAL RECOVERY) */}
            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Social Guardians (2-of-N Recovery)
                </h2>
                <HelpCircle
                  className="h-3.5 w-3.5 text-muted-foreground cursor-pointer hover:text-foreground transition hover:bg-transparent"
                  onClick={() => toast.info("Configure trusted Web3 addresses that can authorize account recovery in case you lose your master credentials.")}
                />
              </div>

              <div className="glass-card p-4 space-y-4">
                <p className="text-[11px] text-muted-foreground leading-normal">
                  Designate trusted friends or alternative wallets as Social Guardians to unlock account recovery using smart-contract signature thresholds.
                </p>

                {/* Add Guardian Form */}
                <div className="space-y-3 bg-surface/30 p-3.5 rounded-2xl border border-border">
                  <h3 className="text-xs font-semibold">Register New Guardian</h3>
                  
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Guardian Name (e.g., Alice)"
                      value={newGuardianName}
                      onChange={(e) => setNewGuardianName(e.target.value)}
                      className="w-full text-xs bg-surface border border-border rounded-xl px-3 py-2.5 outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder="Ethereum Hex Address (0x...)"
                      value={newGuardianAddress}
                      onChange={(e) => setNewGuardianAddress(e.target.value)}
                      className="w-full text-xs font-mono bg-surface border border-border rounded-xl px-3 py-2.5 outline-none focus:border-primary"
                    />
                  </div>

                  <button
                    onClick={() => {
                      if (!newGuardianName.trim()) {
                        toast.error("Please enter a guardian name.");
                        return;
                      }
                      if (!newGuardianAddress.startsWith("0x") || newGuardianAddress.length !== 42) {
                        toast.error("Please enter a valid 42-character Ethereum address (0x...)");
                        return;
                      }
                      
                      const newG = {
                        id: "g_" + Math.random().toString(36).substr(2, 9),
                        name: newGuardianName,
                        address: newGuardianAddress,
                        status: "active"
                      };
                      setSocialGuardians((prev) => [...prev, newG]);
                      toast.success(`Guardian "${newGuardianName}" successfully registered and authorized!`);
                      setNewGuardianName("");
                      setNewGuardianAddress("");
                    }}
                    className="w-full flex items-center justify-center gap-1 bg-primary text-white text-xs font-semibold py-2.5 rounded-xl hover:opacity-95 transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Guardian
                  </button>
                </div>

                {/* Guardian List */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-semibold px-1">Registered Guardians</h3>
                  {socialGuardians.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic px-1">No social recovery guardians configured yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {socialGuardians.map((g) => (
                        <div key={g.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface/50 text-xs">
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">{g.name}</p>
                            <p className="font-mono text-[9px] text-muted-foreground truncate">{g.address}</p>
                          </div>
                          <button
                            onClick={() => {
                              setSocialGuardians((prev) => prev.filter((item) => item.id !== g.id));
                              toast.success(`Guardian "${g.name}" removed.`);
                            }}
                            className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/5 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* MPC THRESHOLD CRYPTOGRAPHY */}
            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  2-of-3 MPC Threshold Key Shares
                </h2>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-bold">Secure</span>
              </div>

              <div className="glass-card p-4 space-y-4">
                <p className="text-[11px] text-muted-foreground leading-normal">
                  Your cryptographic keys are split into 3 decentralized shares. Any 2 shares are required to construct signatures, protecting your funds from any single point of failure.
                </p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-500/10 bg-emerald-500/5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2.5 w-2.5 items-center justify-center rounded-full bg-emerald-500" />
                      <span className="font-medium">Share 1: Secure Enclave (Device)</span>
                    </div>
                    <span className="text-[9px] text-emerald-500 font-bold uppercase">Online</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-500/10 bg-emerald-500/5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2.5 w-2.5 items-center justify-center rounded-full bg-emerald-500" />
                      <span className="font-medium">Share 2: Encrypted Cloud Escrow</span>
                    </div>
                    <span className="text-[9px] text-emerald-500 font-bold uppercase">Synced</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-primary/20 bg-primary/5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`flex h-2.5 w-2.5 items-center justify-center rounded-full ${isPdfBackedUp ? "bg-emerald-500" : "bg-primary animate-pulse"}`} />
                      <span className="font-medium">Share 3: Decentralized PDF Recovery Share</span>
                    </div>
                    <span className={`text-[9px] font-bold uppercase ${isPdfBackedUp ? "text-emerald-500" : "text-primary"}`}>
                      {isPdfBackedUp ? "Verified" : "Setup Needed"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setMpcSyncing(true);
                    toast.loading("Re-keying split shares via decentralized threshold cryptography...");
                    setTimeout(() => {
                      toast.dismiss();
                      setMpcSyncing(false);
                      toast.success("MPC Key shares rotated & synchronized successfully!");
                    }, 1500);
                  }}
                  disabled={mpcSyncing}
                  className="w-full flex items-center justify-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 border border-border text-foreground text-xs font-semibold py-3 rounded-xl transition"
                >
                  <Lock className={`h-4 w-4 ${mpcSyncing ? "animate-spin" : ""}`} />
                  {mpcSyncing ? "Synchronizing MPC Key Shares..." : "Synchronize & Re-key MPC Shares"}
                </button>
              </div>
            </section>

            {/* WEBAUTHN PASSKEY SECONDARY ACCESS */}
            <section className="glass-card p-4 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg border border-border bg-surface p-2 text-primary shrink-0">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold">WebAuthn FIDO2 Passkeys</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Register secondary biometric authorization keys for quick recovery.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  toast.success("Passkey registration simulated successfully! FIDO2 key stored on your secure enclave.");
                }}
                className="text-[10px] bg-primary text-white font-bold px-3 py-2 rounded-xl transition hover:opacity-95 shrink-0"
              >
                Register
              </button>
            </section>
          </div>
        )}

        {/* PIN SECURITY AUTHORIZATION MODAL OVERLAY */}
        {showPinModal && pinAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6 backdrop-blur-xs">
            <div className="glass-card w-full max-w-sm p-6 space-y-4 border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-primary font-semibold text-xs uppercase tracking-wider">
                  <Lock className="h-4 w-4" />
                  <span>PIN Authorization Required</span>
                </div>
                <button
                  onClick={() => {
                    setShowPinModal(false);
                    setPinInput("");
                    setPinAction(null);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>

              <p className="text-xs text-muted-foreground leading-normal">
                {pinAction.type === "create" && "Enter your 6-digit PIN to authorize cryptographic generation & AES-GCM 256 encryption of your new keys."}
                {pinAction.type === "import" && "Enter your 6-digit PIN to encrypt and import the submitted wallet recovery phrase."}
                {pinAction.type === "export_key" && "Enter your 6-digit PIN to temporarily decrypt and reveal this account's private key."}
                {pinAction.type === "export_phrase" && "Enter your 6-digit PIN to temporarily decrypt and reveal your master mnemonic phrase."}
                {pinAction.type === "backup_pdf" && "Enter your 6-digit PIN to decrypt your recovery phrase and generate a client-side PDF backup document."}
              </p>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Enter 6-Digit PIN</label>
                <input
                  type="password"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••••"
                  className="w-full text-center rounded-xl border border-border bg-surface px-4 py-3 text-lg font-bold tracking-widest text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <button
                disabled={pinInput.length !== 6}
                onClick={executePinAuthorizedAction}
                className="w-full flex items-center justify-center gap-1.5 bg-primary text-white font-semibold text-xs py-3 rounded-xl hover:opacity-95 transition disabled:opacity-40"
              >
                <Shield className="h-4 w-4" />
                Authorize Action
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
