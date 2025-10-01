"use server";

import { suggestReorderQuantity } from "@/ai/flows/suggest-reorder-quantity";
import type { Product } from "@/lib/types";
import { z } from "zod";

const ReorderSuggestionSchema = z.object({
  productName: z.string(),
  currentStock: z.number(),
  stockMinimum: z.number(),
});

export async function getReorderSuggestion(data: FormData) {
  try {
    const validatedData = ReorderSuggestionSchema.parse({
      productName: data.get("productName"),
      currentStock: Number(data.get("currentStock")),
      stockMinimum: Number(data.get("stockMinimum")),
    });

    // In a real application, these values would come from historical sales data.
    const averageSalesPerDay = Math.round(Math.random() * 5 + 2); // Random between 2 and 7
    const daysToRestock = Math.round(Math.random() * 7 + 3); // Random between 3 and 10

    const suggestion = await suggestReorderQuantity({
      ...validatedData,
      averageSalesPerDay,
      daysToRestock,
    });

    return { success: true, data: suggestion };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Invalid input data." };
    }
    return { success: false, error: "Failed to get suggestion from AI." };
  }
}
