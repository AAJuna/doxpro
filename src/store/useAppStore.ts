import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Company, AppSettings, LocalUser } from "@/types";

interface AppState {
  company: Company | null;
  settings: AppSettings;
  isOnboarded: boolean;
  theme: "light" | "dark" | "system";
  sidebarCollapsed: boolean;
  /** Currently signed-in user. NULL means Solo Free mode (no account). */
  currentUser: LocalUser | null;

  setCompany: (c: Company | null) => void;
  setSettings: (s: Partial<AppSettings>) => void;
  setOnboarded: (v: boolean) => void;
  setTheme: (t: "light" | "dark" | "system") => void;
  setSidebarCollapsed: (v: boolean) => void;
  setCurrentUser: (u: LocalUser | null) => void;
}

const defaultSettings: AppSettings = {
  defaultCurrency: "IDR",
  defaultTaxRate: 11,
  numberingScheme: "{TYPE}/{YYYY}/{MM}/{SEQ}",
  language: "id",
  theme: "system",
  cloudSyncEnabled: false,
  autoBackupEnabled: true,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      company: null,
      settings: defaultSettings,
      isOnboarded: false,
      theme: "system",
      sidebarCollapsed: false,
      currentUser: null,

      setCompany: (c) => set({ company: c }),
      setSettings: (s) =>
        set((state) => ({ settings: { ...state.settings, ...s } })),
      setOnboarded: (v) => set({ isOnboarded: v }),
      setTheme: (t) => set({ theme: t }),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      setCurrentUser: (u) => set({ currentUser: u }),
    }),
    {
      name: "doxpro-app",
      partialize: (s) => ({
        settings: s.settings,
        theme: s.theme,
        sidebarCollapsed: s.sidebarCollapsed,
      }),
    },
  ),
);
