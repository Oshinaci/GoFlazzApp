"use client";

import { useState, useEffect } from "react";
import {
  User,
  Wallet,
  Sun,
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
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWallet, SUPPORTED_NETWORKS } from "@/hooks/useWallet";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

type ViewMode = "menu" | "wallets" | "address-book";

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
          className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform ${
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

  const [view, setView] = useState<ViewMode>("menu");

  // App settings local state
  const [currency, setCurrency] = useState("USD");
  const [language, setLanguage] = useState("English");
  const [theme, setTheme] = useState("dark");
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [passcodeEnabled, setPasscodeEnabled] = useState(true);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Copy states
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals / Action parameters
  const [pinInput, setPinInput] = useState("");
  const [pinAction, setPinAction] = useState<{
    type: "create" | "import" | "export_key" | "export_phrase";
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

  // Initialize DB configurations
  useEffect(() => {
    if (!user) return;
    const loadSettings = async () => {
      try {
        const [prefRes, secRes, notifRes] = await Promise.all([
          supabase.from("user_preferences").select("*").eq("user_id", user.id).maybeSingle(),
          supabase.from("security_settings").select("*").eq("user_id", user.id).maybeSingle(),
          supabase.from("notification_settings").select("*").eq("user_id", user.id).maybeSingle(),
        ]);

        if (prefRes.data) {
          setCurrency(prefRes.data.currency);
          setLanguage(prefRes.data.language === "en" ? "English" : prefRes.data.language === "id" ? "Indonesian" : "Chinese");
          setTheme(prefRes.data.theme);
        }
        if (secRes.data) {
          setBiometricsEnabled(secRes.data.biometrics_enabled);
          setPasscodeEnabled(secRes.data.passcode_enabled);
        }
        if (notifRes.data) {
          setPushEnabled(notifRes.data.push_enabled);
          setEmailEnabled(notifRes.data.email_enabled);
        }
      } catch (err) {
        console.error("Error loading settings:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, [user]);

  // DB Updaters
  const updatePreference = async (key: string, value: any) => {
    if (!user) return;
    try {
      await supabase.from("user_preferences").upsert({ user_id: user.id, [key]: value }, { onConflict: "user_id" });
    } catch (e) {
      console.error(e);
    }
  };

  const updateSecurity = async (key: string, value: boolean) => {
    if (!user) return;
    try {
      await supabase.from("security_settings").upsert({ user_id: user.id, [key]: value }, { onConflict: "user_id" });
    } catch (e) {
      console.error(e);
    }
  };

  const updateNotification = async (key: string, value: boolean) => {
    if (!user) return;
    try {
      await supabase.from("notification_settings").upsert({ user_id: user.id, [key]: value }, { onConflict: "user_id" });
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
        }
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
    <main className="min-h-screen bg-background px-4 py-8 text-white relative">
      <div className="container max-w-md pb-24">
        {/* VIEW 1: MAIN MENU */}
        {view === "menu" && (
          <div>
            <div className="mb-6 flex items-center gap-3">
              <button
                onClick={() => window.location.href = "/"}
                className="rounded-full p-2 text-muted-foreground hover:bg-white/5 hover:text-white transition"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-semibold">Settings</h1>
            </div>

            <div className="space-y-6">
              {/* Profile card */}
              <section className="glass-card p-4 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-gradient">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{profile?.display_name || "GoFlazz User"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email || "Offline Sandbox"}</p>
                </div>
              </section>

              {/* Preferences category */}
              <section>
                <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Preferences
                </h2>
                <div className="glass-card divide-y divide-border px-4">
                  {/* Default currency */}
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg border border-border bg-surface p-2 text-muted-foreground">
                        <Coins className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Default Currency</p>
                        <p className="text-xs text-muted-foreground">Display assets in currency</p>
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
                        className="appearance-none rounded-xl border border-border bg-surface py-1.5 pl-3 pr-8 text-xs outline-none focus:border-primary"
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
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg border border-border bg-surface p-2 text-muted-foreground">
                        <Languages className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Language</p>
                        <p className="text-xs text-muted-foreground">App display language</p>
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
                        className="appearance-none rounded-xl border border-border bg-surface py-1.5 pl-3 pr-8 text-xs outline-none focus:border-primary"
                      >
                        <option value="English">English</option>
                        <option value="Indonesian">Indonesian</option>
                        <option value="Chinese">中文</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Theme */}
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg border border-border bg-surface p-2 text-muted-foreground">
                        <Sun className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Appearance</p>
                        <p className="text-xs text-muted-foreground">Choose visual layout</p>
                      </div>
                    </div>
                    <div className="relative">
                      <select
                        value={theme}
                        disabled={isLoading}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTheme(val);
                          updatePreference("theme", val);
                          toast.success(`Appearance changed to ${val} theme`);
                        }}
                        className="appearance-none rounded-xl border border-border bg-surface py-1.5 pl-3 pr-8 text-xs outline-none focus:border-primary"
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
                    className="flex items-center justify-between py-3 cursor-pointer hover:bg-white/5 transition px-2 -mx-2 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg border border-border bg-surface p-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Address Book</p>
                        <p className="text-xs text-muted-foreground">Manage your saved contacts</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </section>

              {/* Wallet Category */}
              <section>
                <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Security & Wallet
                </h2>
                <div className="glass-card divide-y divide-border px-4">
                  <ToggleSetting
                    icon={Shield}
                    label="Biometric ID"
                    description="Use FaceID or Fingerprint"
                    checked={biometricsEnabled}
                    disabled={isLoading}
                    onChange={(checked) => {
                      setBiometricsEnabled(checked);
                      updateSecurity("biometrics_enabled", checked);
                      toast.success(checked ? "Biometric ID enabled" : "Biometric ID disabled");
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
                    onClick={() => setView("wallets")}
                    className="flex items-center justify-between py-3 cursor-pointer hover:bg-white/5 transition px-2 -mx-2 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg border border-border bg-surface p-2 text-muted-foreground">
                        <Wallet className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Wallet Management</p>
                        <p className="text-xs text-muted-foreground">Manage keys, networks, and backups</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </section>

              {/* Notifications */}
              <section>
                <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Notifications
                </h2>
                <div className="glass-card divide-y divide-border px-4">
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
                <div className="glass-card p-2">
                  <button
                    onClick={handleSignOut}
                    disabled={isLoggingOut}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 py-3 text-sm font-semibold text-destructive transition hover:bg-destructive/10 disabled:opacity-50"
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
        {view === "wallets" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setView("menu");
                  setDecryptedKey(null);
                  setDecryptedPhrase(null);
                }}
                className="rounded-full p-2 text-muted-foreground hover:bg-white/5 hover:text-white transition"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-semibold">Wallets</h1>
            </div>

            {/* Network Selector */}
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                Active Chain network
              </h3>
              <div className="grid grid-cols-3 gap-2 font-medium">
                {SUPPORTED_NETWORKS.map((net) => (
                  <button
                    key={net.id}
                    onClick={() => selectNetwork(net.id)}
                    className={`flex items-center gap-1.5 p-2.5 rounded-xl border text-xs transition ${
                      activeNetwork === net.id
                        ? "border-primary bg-primary/10 text-white"
                        : "border-border bg-surface text-muted-foreground hover:text-white"
                    }`}
                  >
                    <span>{net.icon}</span>
                    <span className="truncate">{net.name}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Wallet List */}
            <section className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Your Accounts
                </h3>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  {wallets.length} {wallets.length === 1 ? "wallet" : "wallets"}
                </span>
              </div>

              <div className="space-y-3">
                {wallets.map((w) => {
                  const isActive = activeWallet?.id === w.id;
                  const isPrimary = w.is_primary;
                  return (
                    <div
                      key={w.id}
                      onClick={() => selectWallet(w.id)}
                      className={`glass-card p-4 space-y-3 border transition cursor-pointer relative ${
                        isActive ? "border-primary bg-primary/[0.02]" : "border-border hover:border-border/80"
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
                                className="bg-surface border border-border rounded-lg px-2 py-1 text-xs text-white max-w-[150px] outline-none"
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
                                className="p-1 rounded hover:bg-white/5 text-muted-foreground hover:text-white transition"
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
                              className="p-1 rounded hover:bg-white/5 text-muted-foreground hover:text-white transition"
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
                      <div className="flex items-center gap-2 pt-2 border-t border-border/40" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setPinAction({ type: "export_key", walletId: w.id });
                            setShowPinModal(true);
                          }}
                          className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded bg-surface border border-border text-muted-foreground hover:text-white transition"
                        >
                          <Key className="h-3 w-3" />
                          Export Private Key
                        </button>
                        <button
                          onClick={() => {
                            setPinAction({ type: "export_phrase", walletId: w.id });
                            setShowPinModal(true);
                          }}
                          className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded bg-surface border border-border text-muted-foreground hover:text-white transition"
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
                    className="text-xs text-muted-foreground hover:text-white"
                  >
                    Close
                  </button>
                </div>

                {decryptedKey && (
                  <div className="space-y-2">
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      Your raw private key for selected account. <strong>NEVER</strong> share this with anyone!
                    </p>
                    <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-neutral-900 font-mono text-[10px] text-white">
                      <span className="break-all select-all">{decryptedKey}</span>
                      <button
                        onClick={() => handleCopyText(decryptedKey, "decrypted_key")}
                        className="p-1 rounded hover:bg-white/5 text-muted-foreground hover:text-white transition shrink-0 ml-2"
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
                    <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-neutral-900 font-mono text-[10px] text-white">
                      <span className="break-all select-all">{decryptedPhrase}</span>
                      <button
                        onClick={() => handleCopyText(decryptedPhrase, "decrypted_phrase")}
                        className="p-1 rounded hover:bg-white/5 text-muted-foreground hover:text-white transition shrink-0 ml-2"
                      >
                        {copiedId === "decrypted_phrase" ? (
                          <Check className="h-3.5 w-3.5 text-success" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
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
                      className="flex-1 bg-surface border border-border rounded-xl px-3 py-2 text-xs text-white placeholder-muted-foreground outline-none focus:border-primary"
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
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-white placeholder-muted-foreground outline-none focus:border-primary font-mono resize-none"
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
                className="rounded-full p-2 text-muted-foreground hover:bg-white/5 hover:text-white transition"
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
                    className="text-xs text-muted-foreground hover:text-white"
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
                      className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-white placeholder-muted-foreground outline-none focus:border-primary"
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
                      className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-muted-foreground outline-none focus:border-primary"
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
                className="w-full bg-surface border border-border rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder-muted-foreground outline-none focus:border-primary"
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
                          className="p-1 rounded hover:bg-white/5 text-muted-foreground hover:text-white transition shrink-0"
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
                        className="p-2 rounded-lg border border-border bg-surface hover:text-white hover:bg-white/5 transition"
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
                  className="text-xs text-muted-foreground hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <p className="text-xs text-muted-foreground leading-normal">
                {pinAction.type === "create" && "Enter your 6-digit PIN to authorize cryptographic generation & AES-GCM 256 encryption of your new keys."}
                {pinAction.type === "import" && "Enter your 6-digit PIN to encrypt and import the submitted wallet recovery phrase."}
                {pinAction.type === "export_key" && "Enter your 6-digit PIN to temporarily decrypt and reveal this account's private key."}
                {pinAction.type === "export_phrase" && "Enter your 6-digit PIN to temporarily decrypt and reveal your master mnemonic phrase."}
              </p>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Enter 6-Digit PIN</label>
                <input
                  type="password"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••••"
                  className="w-full text-center rounded-xl border border-border bg-surface px-4 py-3 text-lg font-bold tracking-widest text-white focus:border-primary focus:outline-none"
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
