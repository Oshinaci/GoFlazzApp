import { createClient } from "@supabase/supabase-js";

// Check if we are using the placeholder / unconfigured Supabase
const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isPlaceholder = 
  !rawUrl || 
  rawUrl.includes("placeholder") || 
  !rawKey || 
  rawKey.length < 20 || 
  rawKey.includes("placeholder");

// ----------------------------------------------------
// Mock Client Implementation for Offline/Local-Only Mode
// ----------------------------------------------------
class MockSupabaseClient {
  private listeners: Array<(event: string, session: any) => void> = [];

  constructor() {
    if (typeof window !== "undefined") {
      // Ensure basic mock tables exist in local storage
      const tables = [
        "wallet_profiles",
        "profiles", 
        "wallet_preferences",
        "user_preferences", 
        "wallet_security",
        "wallet_settings",
        "security_settings", 
        "wallet_notifications",
        "notification_settings", 
        "wallet_activity",
        "activity_logs", 
        "user_wallets",
        "wallet_metadata",
        "wallet_contacts",
        "wallet_balances",
        "wallet_devices"
      ];
      tables.forEach((table) => {
        if (!localStorage.getItem(`mock_db_${table}`)) {
          localStorage.setItem(`mock_db_${table}`, JSON.stringify([]));
        }
      });
      if (!localStorage.getItem("mock_users")) {
        localStorage.setItem("mock_users", JSON.stringify([]));
      }
    }
  }

  auth = {
    getSession: async () => {
      if (typeof window === "undefined") return { data: { session: null }, error: null };
      const currentUserId = localStorage.getItem("mock_current_user_id");
      if (!currentUserId) return { data: { session: null }, error: null };

      const users = JSON.parse(localStorage.getItem("mock_users") || "[]");
      const user = users.find((u: any) => u.id === currentUserId);
      if (!user) return { data: { session: null }, error: null };

      const session = {
        user: {
          id: user.id,
          email: user.email,
          user_metadata: user.user_metadata || {},
        },
        access_token: "mock-token",
        expires_at: 9999999999,
      };
      return { data: { session }, error: null };
    },

    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      this.listeners.push(callback);
      // Immediately call back with the initial state
      this.auth.getSession().then(({ data: { session } }) => {
        callback(session ? "SIGNED_IN" : "SIGNED_OUT", session);
      }).catch(() => {});

      return {
        data: {
          subscription: {
            unsubscribe: () => {
              this.listeners = this.listeners.filter((l) => l !== callback);
            },
          },
        },
      };
    },

    signUp: async ({ email, password, options }: any) => {
      if (typeof window === "undefined") return { data: { user: null, session: null }, error: { message: "SSR environment" } };
      const users = JSON.parse(localStorage.getItem("mock_users") || "[]");
      const exists = users.find((u: any) => u.email === email);
      if (exists) {
        return { data: { user: null, session: null }, error: { message: "An account with this email already exists." } };
      }

      const newUser = {
        id: "usr_" + Math.random().toString(36).substr(2, 9),
        email,
        password,
        user_metadata: options?.data || {},
      };
      users.push(newUser);
      localStorage.setItem("mock_users", JSON.stringify(users));
      localStorage.setItem("mock_current_user_id", newUser.id);

      const session = {
        user: {
          id: newUser.id,
          email: newUser.email,
          user_metadata: newUser.user_metadata,
        },
        access_token: "mock-token",
        expires_at: 9999999999,
      };

      // Create defaults for this user
      const db_profiles = JSON.parse(localStorage.getItem("mock_db_profiles") || "[]");
      const displayName = options?.data?.full_name || email.split("@")[0] || "User";
      db_profiles.push({
        id: "prof_" + Math.random().toString(36).substr(2, 9),
        user_id: newUser.id,
        display_name: displayName,
        email: email,
        onboarding_status: "incomplete",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      localStorage.setItem("mock_db_profiles", JSON.stringify(db_profiles));

      this.listeners.forEach((l) => l("SIGNED_IN", session));

      return { data: { user: session.user, session }, error: null };
    },

    signInWithPassword: async ({ email, password }: any) => {
      if (typeof window === "undefined") return { data: { user: null, session: null }, error: { message: "SSR environment" } };
      const users = JSON.parse(localStorage.getItem("mock_users") || "[]");
      const user = users.find((u: any) => u.email === email && u.password === password);
      if (!user) {
        return { data: { user: null, session: null }, error: { message: "Invalid email or password." } };
      }

      localStorage.setItem("mock_current_user_id", user.id);

      const session = {
        user: {
          id: user.id,
          email: user.email,
          user_metadata: user.user_metadata || {},
        },
        access_token: "mock-token",
        expires_at: 9999999999,
      };

      this.listeners.forEach((l) => l("SIGNED_IN", session));

      return { data: { user: session.user, session }, error: null };
    },

    signOut: async () => {
      if (typeof window === "undefined") return { error: null };
      localStorage.removeItem("mock_current_user_id");
      this.listeners.forEach((l) => l("SIGNED_OUT", null));
      return { error: null };
    },

    resetPasswordForEmail: async (email: string, options: any) => {
      return { data: {}, error: null };
    },

    updateUser: async ({ password }: any) => {
      if (typeof window === "undefined") return { data: { user: null }, error: { message: "SSR environment" } };
      const currentUserId = localStorage.getItem("mock_current_user_id");
      if (!currentUserId) return { data: { user: null }, error: { message: "Not authenticated" } };

      const users = JSON.parse(localStorage.getItem("mock_users") || "[]");
      const userIdx = users.findIndex((u: any) => u.id === currentUserId);
      if (userIdx !== -1) {
        users[userIdx].password = password;
        localStorage.setItem("mock_users", JSON.stringify(users));
        return { data: { user: { id: currentUserId, email: users[userIdx].email } }, error: null };
      }
      return { data: { user: null }, error: { message: "User not found" } };
    }
  };

  from = (table: string) => {
    const getItems = () => {
      if (typeof window === "undefined") return [];
      const data = localStorage.getItem(`mock_db_${table}`);
      return data ? JSON.parse(data) : [];
    };

    const setItems = (items: any[]) => {
      if (typeof window === "undefined") return;
      localStorage.setItem(`mock_db_${table}`, JSON.stringify(items));
    };

    let queryFilters: Array<(item: any) => boolean> = [];
    let queryOrder: { field: string; ascending: boolean } | null = null;

    const builder = {
      select: (fields?: string) => {
        return builder;
      },
      insert: (data: any) => {
        const items = getItems();
        const records = Array.isArray(data) ? data : [data];
        const newRecords = records.map((r) => {
          const id = r.id || "rec_" + Math.random().toString(36).substr(2, 9);
          return {
            id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...r,
          };
        });
        setItems([...items, ...newRecords]);

        const returnBuilder = {
          select: () => {
            return {
              single: async () => ({ data: newRecords[0], error: null }),
              maybeSingle: async () => ({ data: newRecords[0], error: null }),
              then: (resolve: any) => resolve({ data: newRecords, error: null }),
            };
          },
          then: (resolve: any) => resolve({ data: newRecords, error: null }),
        };
        return returnBuilder;
      },
      update: (data: any) => {
        const executeUpdate = () => {
          const items = getItems();
          let updatedCount = 0;
          const updatedItems = items.map((item: any) => {
            const matches = queryFilters.every((filter: any) => filter(item));
            if (matches) {
              updatedCount++;
              return {
                ...item,
                ...data,
                updated_at: new Date().toISOString(),
              };
            }
            return item;
          });
          setItems(updatedItems);
          return { data: data, error: null, count: updatedCount };
        };

        const returnBuilder = {
          eq: (field: string, value: any) => {
            queryFilters.push((item: any) => item[field] === value);
            return returnBuilder;
          },
          then: (resolve: any) => resolve(executeUpdate()),
        };
        return returnBuilder;
      },
      upsert: (data: any, options?: any) => {
        const items = getItems();
        const records = Array.isArray(data) ? data : [data];
        const onConflictKey = options?.onConflict || "user_id";

        const updatedItems = [...items];
        records.forEach((rec: any) => {
          const matchIdx = updatedItems.findIndex((item: any) => item[onConflictKey] === rec[onConflictKey]);
          if (matchIdx !== -1) {
            updatedItems[matchIdx] = {
              ...updatedItems[matchIdx],
              ...rec,
              updated_at: new Date().toISOString(),
            };
          } else {
            updatedItems.push({
              id: rec.id || "rec_" + Math.random().toString(36).substr(2, 9),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              ...rec,
            });
          }
        });

        setItems(updatedItems);

        return {
          then: (resolve: any) => resolve({ data: records, error: null }),
        };
      },
      delete: () => {
        const executeDelete = () => {
          const items = getItems();
          const remainingItems = items.filter((item: any) => !queryFilters.every((filter: any) => filter(item)));
          setItems(remainingItems);
          return { data: null, error: null };
        };

        const returnBuilder = {
          eq: (field: string, value: any) => {
            queryFilters.push((item: any) => item[field] === value);
            return returnBuilder;
          },
          then: (resolve: any) => resolve(executeDelete()),
        };
        return returnBuilder;
      },
      eq: (field: string, value: any) => {
        queryFilters.push((item: any) => item[field] === value);
        return builder;
      },
      order: (field: string, options?: any) => {
        queryOrder = { field, ascending: options?.ascending !== false };
        return builder;
      },
      maybeSingle: async () => {
        const items = getItems();
        const filtered = items.filter((item: any) => queryFilters.every((filter: any) => filter(item)));
        return { data: filtered[0] || null, error: null };
      },
      single: async () => {
        const items = getItems();
        const filtered = items.filter((item: any) => queryFilters.every((filter: any) => filter(item)));
        if (filtered.length === 0) {
          return { data: null, error: { message: "No row found" } };
        }
        return { data: filtered[0], error: null };
      },
      then: (resolve: any) => {
        const items = getItems();
        const filtered = items.filter((item: any) => queryFilters.every((filter: any) => filter(item)));
        if (queryOrder) {
          const { field, ascending } = queryOrder;
          filtered.sort((a: any, b: any) => {
            if (a[field] < b[field]) return ascending ? -1 : 1;
            if (a[field] > b[field]) return ascending ? 1 : -1;
            return 0;
          });
        }
        resolve({ data: filtered, error: null });
      }
    };

    return builder;
  };
}

// ----------------------------------------------------
// Exported Client Router
// ----------------------------------------------------
let activeClient: any;

if (isPlaceholder) {
  activeClient = new MockSupabaseClient();
} else {
  const supabaseUrl = rawUrl && rawUrl.startsWith("http") ? rawUrl : "https://placeholder-project.supabase.co";
  // Ensure the anon key looks like a structurally valid JWT string to prevent Supabase SDK initialization errors
  const supabaseAnonKey = rawKey && rawKey.length > 20 ? rawKey : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY3NDU2MDAsImV4cCI6MjAyMjMyMTYwMH0.placeholder";

  try {
    activeClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (err) {
    console.error("Failed to initialize real Supabase client. Falling back to local mock.", err);
    activeClient = new MockSupabaseClient();
  }
}

export const supabase = activeClient;
