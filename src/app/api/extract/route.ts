export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import PDFParser from "pdf2json";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ 
        error: "GEMINI_API_KEY is missing. Please add it to your environment variables." 
      }, { status: 500 });
    }

    // 1. Extract raw text from the PDF using pdf2json
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const pdfParser = new PDFParser(null, true);
    const rawText = await new Promise<string>((resolve, reject) => {
      pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
      pdfParser.on("pdfParser_dataReady", () => resolve(pdfParser.getRawTextContent()));
      pdfParser.parseBuffer(buffer);
    });

    // 2. Send the raw text to Gemini for intelligent extraction
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `
      You are an expert Senior Credit Underwriter evaluating an MSME or gig worker's bank statement.
      Analyze the following raw bank statement text and extract/calculate the 6 key metrics below.
      
      CRITICAL INSTRUCTIONS:
      - This system is for MSME commercial working capital.
      - If you detect this is a purely personal/student account (e.g., massive transfers from family members, college fees, food delivery like Swiggy/Zomato), you must PENALIZE the commercial metrics.
      - Personal family transfers should NOT count as "business revenue" or "monthly inflows".
      - If there are no clear B2B vendor payments, payment regularity should be low.
      - If inflows are highly erratic (e.g., one huge transfer from parents, then nothing), revenue stability should be low.
      
      Output ONLY a valid JSON object matching exactly this format, nothing else:
      {
        "upi_monthly_inflow": <number>, // Calculate the average monthly business/commercial inflow over the statement period. Exclude obvious personal family transfers.
        "cash_withdrawal_pct": <number>, // 0-100 percentage. Total ATM/Cash withdrawals divided by total inflows.
        "payment_regularity_pct": <number>, // 0-100 percentage. Evidence of consistent, on-time vendor payouts or EMIs. If personal account, score this < 75.
        "revenue_stability_score": <number>, // 0-100 scale. Are inflows steady month-over-month? High variance = low score (e.g. 50 or less).
        "utility_variance_score": <number>, // 0-100 scale. Consistency of commercial utility payments. If none or erratic, score < 70.
        "digital_vintage_months": <number> // Estimate the age of the account/digital footprint in months based on the statement period (e.g. 12 or 24).
      }

      BANK STATEMENT TEXT:
      ${rawText.substring(0, 30000)} // Limiting text length to avoid token limits just in case
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const aiText = response.text;
    if (!aiText) {
      throw new Error("Empty response from Gemini");
    }

    const aiData = JSON.parse(aiText);

    // Map AI output to the schema expected by the frontend and database
    const metrics = [
      { metric_type: "upi_monthly_inflow", value: Math.round(aiData.upi_monthly_inflow) },
      { metric_type: "cash_withdrawal_pct", value: Math.round(aiData.cash_withdrawal_pct) },
      { metric_type: "payment_regularity_pct", value: Math.round(aiData.payment_regularity_pct) },
      { metric_type: "revenue_stability_score", value: Math.round(aiData.revenue_stability_score) },
      { metric_type: "utility_variance_score", value: Math.round(aiData.utility_variance_score) },
      { metric_type: "digital_vintage_months", value: Math.round(aiData.digital_vintage_months) }
    ];

    return NextResponse.json({ success: true, metrics });

  } catch (err: any) {
    console.error("PDF Extraction Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
