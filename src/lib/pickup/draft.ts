import { useSyncExternalStore } from "react";
import { createStore } from "@/lib/state/stores";

export type PickupDraft = {
  method: "self" | "other" | "ojek";
  note: string;
  noteExtras: string[];
  estimate: string;
  waitLocation: string;
  pickerName: string;
  relation: string;
  driverName: string;
  platform: "Gojek" | "Grab" | "Maxim" | "InDrive";
  plate: string;
};

export const DRAFT_INITIAL: PickupDraft = {
  method: "self",
  note: "",
  noteExtras: [],
  estimate: "sudah",
  waitLocation: "Gerbang Utama",
  pickerName: "",
  relation: "Kakek",
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
