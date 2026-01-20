import { GoogleGenAI, Type, Schema } from "@google/genai";
import { InvoiceData, Currency } from "../types";

// Validate API key by making a simple request
export const validateApiKey = async (apiKey: string): Promise<{ valid: boolean; error?: string }> => {
  if (!apiKey || apiKey.trim().length < 10) {
    return { valid: false, error: 'API key çok kısa' };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    // Simple test request
    await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: 'Say "OK" in one word.',
      config: { maxOutputTokens: 5 }
    });
    return { valid: true };
  } catch (error: any) {
    console.error('API Key validation error:', error);
    if (error?.message?.includes('API key not valid')) {
      return { valid: false, error: 'API key geçersiz. Lütfen doğru key girdiğinizden emin olun.' };
    }
    if (error?.message?.includes('quota')) {
      return { valid: false, error: 'API kotası dolmuş. Lütfen başka bir key deneyin.' };
    }
    return { valid: false, error: error?.message || 'API key doğrulanamadı' };
  }
};

// Schema definition for the model output
const invoiceSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    vendor_name: { type: Type.STRING, description: "Name of the vendor or supplier." },
    tax_id: { type: Type.STRING, description: "Tax identification number (VKN/TCKN/VAT ID)." },
    invoice_date: { type: Type.STRING, description: "Date of the invoice in YYYY-MM-DD format." },
    invoice_number: { type: Type.STRING, description: "The unique invoice number." },
    currency: {
      type: Type.STRING,
      enum: ["TRY", "USD", "EUR", "GBP", "UNKNOWN"],
      description: "Currency code detected from the invoice."
    },
    subtotal: { type: Type.NUMBER, description: "The subtotal amount before tax (Matrah)." },
    tax_rate: { type: Type.NUMBER, description: "The tax rate percentage (e.g., 20 for 20%)." },
    tax_amount: { type: Type.NUMBER, description: "The calculated tax amount (KDV Tutarı)." },
    grand_total: { type: Type.NUMBER, description: "The final total amount including tax." },
  },
  required: ["vendor_name", "invoice_date", "subtotal", "grand_total", "currency"],
};

export const extractInvoiceData = async (fileBase64: string, mimeType: string, apiKey: string): Promise<InvoiceData> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please provide your Gemini API key.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash', // Stable model for production use
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: fileBase64
            }
          },
          {
            text: `You are a professional Financial Audit Specialist. 
            Extract data from this invoice document with 100% mathematical accuracy.
            
            Strictly follow these rules:
            1. Extract the Vendor Name, Tax ID, Invoice Date, and Invoice Number.
            2. Detect the currency (TRY, USD, EUR, etc.).
            3. Extract the Subtotal (Matrah), Tax Rate (KDV %), Tax Amount (KDV Tutarı), and Grand Total.
            4. If a field is not present or cannot be inferred, return null for strings or 0 for numbers.
            5. Ensure all number fields are pure floats (no currency symbols).
            6. Return ONLY the JSON object defined in the schema.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: invoiceSchema,
        temperature: 0.1, // Low temperature for factual extraction
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No data returned from Gemini.");
    }

    const data = JSON.parse(text) as InvoiceData;
    return data;

  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw error;
  }
};