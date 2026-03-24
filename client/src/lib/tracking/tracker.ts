import { identity } from "@/lib/identity/identity";

const TRACK_KEY = "aeris_events";

export const tracker = {
  track: (event: string, data: Record<string, any> = {}) => {
    const payload = {
      user_id: identity.getUserId(),
      event,
      timestamp: Date.now(),
      ...data
    };

    const existing = JSON.parse(localStorage.getItem(TRACK_KEY) || "[]");
    localStorage.setItem(TRACK_KEY, JSON.stringify([...existing, payload]));

    console.log("Tracked:", payload);
  }
};
