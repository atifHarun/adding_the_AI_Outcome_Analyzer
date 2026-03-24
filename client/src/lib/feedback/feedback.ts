import { identity } from "@/lib/identity/identity";

const FEEDBACK_KEY = "aeris_feedback";

export const feedback = {
  submit: async ({
    tool,
    rating,
    comment = "",
    scan_id
  }: {
    tool: string;
    rating: number;
    comment?: string;
    scan_id?: string;
  }) => {
    const payload = {
      user_id: identity.getUserId(),
      tool,
      rating,
      comment,
      scan_id
    };

    try {
      await fetch("http://localhost:5000/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      console.log("Feedback sent:", payload);
    } catch (err) {
      console.error("Feedback failed, fallback to localStorage", err);

      // fallback
      const existing = JSON.parse(localStorage.getItem(FEEDBACK_KEY) || "[]");
      localStorage.setItem(FEEDBACK_KEY, JSON.stringify([...existing, payload]));
    }
  }
};
