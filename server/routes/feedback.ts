import fs from "fs";
import path from "path";
import { Router } from "express";

const router = Router();

const FILE_PATH = path.join(process.cwd(), "feedback.json");

// Ensure file exists
if (!fs.existsSync(FILE_PATH)) {
  fs.writeFileSync(FILE_PATH, JSON.stringify([]));
}

router.post("/feedback", (req, res) => {
  try {
    const feedback = req.body;

    const existing = JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"));
    existing.push({
      ...feedback,
      timestamp: Date.now()
    });

    fs.writeFileSync(FILE_PATH, JSON.stringify(existing, null, 2));

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save feedback" });
  }
});

export default router;
