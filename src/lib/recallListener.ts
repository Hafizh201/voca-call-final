import { supabase } from "@/lib/supabase";
import { toWib } from "@/lib/pickup/history";

export function initRecallListener() {
  const processed = new Set<string>(); // store recall id (primary key) as string
  console.log('[RecallListener] Initializing recall listener');

  const channel = supabase
    .channel('recall-changes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'recall' },
      (payload) => {
        const { id, id_pemanggilan, pemanggilan_ke, text_pemanggilan, waktu_pemanggilan } = payload.new as RecallRow;
        console.log('[RecallListener] Received recall insert:', { id, id_pemanggilan, pemanggilan_ke, text_pemanggilan });
        // Optional: ensure we don't process duplicates (though INSERT event should be unique)
        if (processed.has(id)) {
          console.log('[RecallListener] Duplicate recall id ignored:', id);
          return;
        }
        processed.add(id);
        console.log('[RecallListener] Processing new recall id:', id);

        // Speak the text
        utter(text_pemanggilan);
      }
    )
    .subscribe();

  console.log('[RecallListener] Subscribed to recall changes');

  // Return unsubscribe function
  return () => {
    console.log('[RecallListener] Unsubscribing from recall changes');
    supabase.removeChannel(channel);
  };
}

type RecallRow = {
  id: string;
  id_pemanggilan: number;
  pemanggilan_ke: number;
  text_pemanggilan: string;
  waktu_pemanggilan: string; // ISO timestamp
};

function utter(text: string) {
  if ('speechSynthesis' in window) {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'id-ID';
    // optional: set voice, rate, pitch
    window.speechSynthesis.speak(utter);
    console.log('[RecallListener] Utterance queued:', text);
  } else {
    console.warn('SpeechSynthesis not supported');
  }
}