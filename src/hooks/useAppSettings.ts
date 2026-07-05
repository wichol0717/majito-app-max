import { useEffect, useState } from "react";
import { supabase } from "@/api/supabase";

export interface AppSettings {
  whatsapp_number: string;
  bank_name: string;
  bank_account: string;
  bank_holder: string;
  shipping_cost: number;
  low_stock_threshold: number;
}

const DEFAULTS: AppSettings = {
  whatsapp_number: "5217831450929",
  bank_name: "BBVA BANCOMER",
  bank_account: "4152 3144 9119 3861",
  bank_holder: "Luis Ricardo Villalobos Fortun",
  shipping_cost: 80,
  low_stock_threshold: 3,
};

let cached: AppSettings | null = null;

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(cached ?? DEFAULTS);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    if (cached) return;
    supabase
      .from("app_settings")
      .select("key,value")
      .then(({ data }) => {
        if (data) {
          const merged: AppSettings = { ...DEFAULTS };
          for (const row of data) {
            const k = row.key as keyof AppSettings;
            // value is stored as jsonb (string or number)
            (merged as any)[k] = row.value as never;
          }
          cached = merged;
          setSettings(merged);
        }
        setLoading(false);
      });
  }, []);

  return { settings, loading };
}

export function invalidateSettingsCache() {
  cached = null;
}