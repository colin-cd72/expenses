import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');

    // Determine media type
    let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg';
    if (file.type === 'image/png') {
      mediaType = 'image/png';
    } else if (file.type === 'image/gif') {
      mediaType = 'image/gif';
    } else if (file.type === 'image/webp') {
      mediaType = 'image/webp';
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64,
              },
            },
            {
              type: 'text',
              text: `Analyze this receipt image and extract the following information. Return ONLY a valid JSON object with no additional text or markdown formatting.

{
  "date": "YYYY-MM-DD format, use today's date if not visible",
  "vendor": "Business/merchant name",
  "amount": number (total amount as a decimal number, no currency symbol),
  "currency": "USD",
  "category": "One of: Travel, Meals, Supplies, Mileage, Other",
  "paymentMethod": "Credit Card, Debit, Cash, or Unknown",
  "confidence": "high, medium, or low based on how clearly you could read the receipt"
}

Important:
- For amount, extract the TOTAL amount including tax
- If you can't read something clearly, make your best guess and set confidence to "low" or "medium"
- Return ONLY the JSON object, no other text`,
            },
          ],
        },
      ],
    });

    // Extract the text content from the response
    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    // Parse the JSON response
    let parsedData;
    try {
      // Try to extract JSON from the response (in case it's wrapped in markdown code blocks)
      let jsonStr = textContent.text;
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
      parsedData = JSON.parse(jsonStr);
    } catch {
      console.error('Failed to parse Claude response:', textContent.text);
      throw new Error('Failed to parse receipt data');
    }

    return NextResponse.json({
      success: true,
      data: {
        date: parsedData.date || new Date().toISOString().split('T')[0],
        vendor: parsedData.vendor || 'Unknown Vendor',
        amount: typeof parsedData.amount === 'number' ? parsedData.amount : parseFloat(parsedData.amount) || 0,
        currency: parsedData.currency || 'USD',
        category: parsedData.category || 'Other',
        paymentMethod: parsedData.paymentMethod || 'Unknown',
        confidence: parsedData.confidence || 'low',
      },
    });
  } catch (error) {
    console.error('Error parsing receipt:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse receipt' },
      { status: 500 }
    );
  }
}
