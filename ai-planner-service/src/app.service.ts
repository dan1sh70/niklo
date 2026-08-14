import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  private openai: OpenAI | null = null;
  private genAI: GoogleGenerativeAI | null = null;

  constructor(private configService: ConfigService) {
    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
    }

    const geminiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (geminiKey) {
      this.genAI = new GoogleGenerativeAI(geminiKey);
    }
  }

  async planJourney(requestData: any) {
    const provider = this.configService.get<string>('AI_PROVIDER', 'gemini');
    
    if (provider === 'gemini' && this.genAI) {
      return this.planWithGemini(requestData);
    } else if (provider === 'openai' && this.openai) {
      return this.planWithOpenAI(requestData);
    }
    
    // Fallback to mock if API keys are missing
    this.logger.warn('No AI API keys configured, falling back to mock response.');
    return this.mockPlanJourney(requestData);
  }

  private async planWithGemini(requestData: any) {
    if (!this.genAI) return this.mockPlanJourney(requestData);

    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro", generationConfig: { responseMimeType: "application/json" } });
    const prompt = `Plan a multi-modal journey from ${requestData.origin} to ${requestData.destination}. 
Return a JSON object with this schema: { journey_id: string, origin: string, destination: string, estimated_total_cost: number, currency: string, legs: [{ leg_id: number, mode: string, provider: string, from: string, to: string, duration_mins: number, price: number }], ai_insights: string[] }`;
    
    try {
      const result = await model.generateContent(prompt);
      return JSON.parse(result.response.text());
    } catch (e) {
      this.logger.error('Gemini generation failed', e);
      return this.mockPlanJourney(requestData);
    }
  }

  private async planWithOpenAI(requestData: any) {
    if (!this.openai) return this.mockPlanJourney(requestData);

    const prompt = `Plan a multi-modal journey from ${requestData.origin} to ${requestData.destination}. 
Return a JSON object with this schema: { journey_id: string, origin: string, destination: string, estimated_total_cost: number, currency: string, legs: [{ leg_id: number, mode: string, provider: string, from: string, to: string, duration_mins: number, price: number }], ai_insights: string[] }`;

    try {
      const completion = await this.openai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'gpt-4o',
        response_format: { type: 'json_object' }
      });
      return JSON.parse(completion.choices[0].message.content || '{}');
    } catch (e) {
      this.logger.error('OpenAI generation failed', e);
      return this.mockPlanJourney(requestData);
    }
  }

  private mockPlanJourney(requestData: any) {
    return {
      journey_id: `journey-${Date.now()}`,
      origin: requestData.origin || 'Bangalore',
      destination: requestData.destination || 'Goa',
      estimated_total_cost: 4500,
      currency: 'INR',
      legs: [
        { leg_id: 1, mode: 'cab', provider: 'Niklo Ride', from: 'Home', to: 'Majestic Bus Stand', duration_mins: 45, price: 350 },
        { leg_id: 2, mode: 'bus', provider: 'National Travels', from: 'Majestic Bus Stand', to: 'Panjim Bus Stand', duration_mins: 720, price: 1500 }
      ],
      ai_insights: ['Booking a cab 1 hour prior to bus departure is recommended due to traffic.']
    };
  }

  bookMultimodal(bookingData: any) {
    return {
      success: true,
      message: 'Multi-modal booking initiated successfully',
      booking_reference: `MM-${Date.now()}`,
      status: 'pending_confirmation',
      booked_legs: bookingData.legs || []
    };
  }

  getSavedJourneys(userId: string) {
    return {
      user_id: userId,
      saved_journeys: [
        { id: 'saved-1', name: 'Weekend trip to Goa', origin: 'Bangalore', destination: 'Goa', saved_at: new Date() }
      ]
    };
  }

  saveJourney(journeyData: any) {
    return {
      success: true,
      message: 'Journey saved successfully',
      saved_journey: { id: `saved-${Date.now()}`, ...journeyData, saved_at: new Date() }
    };
  }

  deleteSavedJourney(id: string) {
    return { success: true, message: `Saved journey ${id} removed successfully` };
  }

  getAlerts(userId: string) {
    return { user_id: userId, preferences: { price_drop_alerts: true, weather_alerts: true, traffic_alerts: false } };
  }

  updateAlerts(alertData: any) {
    return { success: true, message: 'Alert preferences updated successfully', updated_preferences: alertData.preferences || {} };
  }

  optimizeSchedule(scheduleData: any) {
    return {
      original_departure: scheduleData.departure_time,
      suggested_departure: new Date(new Date(scheduleData.departure_time).getTime() - 1800000), // 30 mins earlier
      reason: 'Heavy traffic expected on the route to boarding point.',
      confidence_score: 0.85
    };
  }
}
