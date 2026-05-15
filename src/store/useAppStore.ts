import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Company, AppSettings } from "@/types";

interface AppState {
  company: Company | null;
  settings: AppSettings;
  isOnboarded: boolean;
  theme: "light" | "dark" | "system";
  sidebarCollapsed: boolean;

  setCompany: (c: Company | null) => void;
  setSettings: (s: Partial<AppSettings>) => void;
  setOnboarded: (v: boolean) => void;
  setTheme: (t: "light" | "dark" | "system") => void;
  setSidebarCollapsed: (v: boolean) => void;
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

      setCompany: (c) => set({ company: c }),
      setSettings: (s) =>
        set((state) => ({ settings: { ...state.settings, ...s } })),
      setOnboarded: (v) => set({ isOnboarded: v }),
      setTheme: (t) => set({ theme: t }),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
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
