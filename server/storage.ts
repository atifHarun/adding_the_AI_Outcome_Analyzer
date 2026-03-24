import type { Express } from "express";
import { type Server } from "http";

export interface IStorage {
  // No database needed for this application, so this interface is empty.
  // We keep it to maintain compatibility with the template.
}

export class MemStorage implements IStorage {
  constructor() {}
}

export const storage = new MemStorage();
