import { useSyncExternalStore } from "react";
import { createStore } from "@/lib/state/stores";

export type PickupDraft = {
  /** Row Supabase yang dibuat saat form dibuka; dipakai untuk UPDATE bertahap. */
  idPemanggilan?: string;
  writeMethod?: "self" | "other" | "ojek";
  method: "self" | "other" | "ojek";
  note: string;
  noteExtras: string[];
  estimate: string;
  waitLocation: string;
  pickerName: string;
  driverName: string;
platform: "Gojek" | "Grab" | "Maxim" | "InDrive" | "MaxRide" | "JogjaKita";
  plate: string;
};

export const DRAFT_INITIAL: PickupDraft = {
  method: "self",
  note: "",
  noteExtras: [],
  estimate: "",
  waitLocation: "Gerbang Utama",
  pickerName: "",
  driverName: "",
  platform: "Gojek",
  plate: "",
};

export const draftStore = createStore<PickupDraft>("panggil.draft", DRAFT_INITIAL);

export const getDraft = () => draftStore.get();
export const setDraft = (patch: Partial<PickupDraft>) => draftStore.set(patch);
export const resetDraft = () => draftStore.set(() => ({ ...DRAFT_INITIAL }));

export const useDraft = () =>
  useSyncExternalStore(draftStore.subscribe, draftStore.get, () => DRAFT_INITIAL);
