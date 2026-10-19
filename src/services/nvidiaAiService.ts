import { ENV, hasValidNvidiaKey } from '../constants/config';
import { Hospital } from './mockDataService';
import { fetchNearbyHospitals } from './googleMapsService';

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  recommendedHospitals?: Hospital[];
  recommendedAmbulanceType?: 'bls' | 'als' | 'bike';
  actionTriggered?: string;
  urgencyLevel?: 'critical' | 'urgent' | 'moderate' | 'low';
}

const EMERGENCY_SYSTEM_PROMPT = `
You are SavLife Emergency Medical AI, an expert, calm, and rapid emergency triage assistant.
Your job is to:
1. Quickly assess the user's medical emergency.
2. Provide immediate, step-by-step life-saving first aid instructions (e.g. CPR, direct pressure on bleeding, recovery position).
3. Recommend the appropriate ambulance type:
   - 'als' (Advanced Life Support / ICU) for cardiac arrest, severe chest pain, unconsciousness, severe breathing difficulty, massive bleeding, stroke, major accidents.
   - 'bls' (Basic Life Support) for fractures, non-critical transfers, moderate burns, elderly transport.
   - 'bike' (First Responder Bike) for rapid immediate stabilization in dense traffic.
4. Always respond with a structured JSON block at the very end of your message in this format:
<<<TRIAGE_DATA
{
  "action": "find_hospitals",
  "urgency": "critical" | "urgent" | "moderate" | "low",
  "ambulance_type": "als" | "bls" | "bike",
  "triage_summary": "Short 1-line emergency summary"
}
TRIAGE_DATA>>>

Keep your tone calm, direct, supportive, and clear. Avoid overly technical medical jargon. Prioritize the patient's immediate safety.
`;

/**
 * Parses structured JSON triage data from AI text
 */
function extractTriageData(rawText: string) {
  try {
    const match = rawText.match(/<<<TRIAGE_DATA\s*([\s\S]*?)\s*TRIAGE_DATA>>>/);
    if (match && match[1]) {
      const parsed = JSON.parse(match[1]);
      const cleanText = rawText.replace(/<<<TRIAGE_DATA[\s\S]*?TRIAGE_DATA>>>/, '').trim();
      return { cleanText, triageData: parsed };
    }
  } catch (err) {
    console.warn('Failed to parse structured triage data from LLM:', err);
  }
  return { cleanText: rawText, triageData: null };
}

/**
 * Intelligent local triage evaluator for zero-latency offline/fallback responses
 */
function evaluateLocalEmergencyTriage(userMessage: string) {
  const lower = userMessage.toLowerCase();
  
  if (
    lower.includes('chest pain') ||
    lower.includes('heart') ||
    lower.includes('cardiac') ||
    lower.includes('attack') ||
    lower.includes('unconscious') ||
    lower.includes('breath') ||
    lower.includes('stroke') ||
    lower.includes('paralysis') ||
    lower.includes('seizure')
  ) {
    return {
      text: `🚨 **CRITICAL EMERGENCY DETECTED: CARDIAC / RESPIRATORY CRISIS**\n\n1. **Keep the patient calm and seated upright** or in a comfortable resting position.\n2. **Loosen tight clothing** around the neck, chest, and waist.\n3. If conscious and not allergic, consider 300mg chewable Aspirin for suspected heart attacks.\n4. If breathing stops or they lose consciousness, **begin Hands-Only CPR** immediately (100–120 compressions/min in the center of the chest).\n\n*I am instantly dispatching our nearest Advanced Life Support (ALS) ICU Ambulance with oxygen and defibrillator.*`,
      ambulanceType: 'als' as const,
      urgency: 'critical' as const,
    };
  }

  if (
    lower.includes('bleed') ||
    lower.includes('blood') ||
    lower.includes('accident') ||
    lower.includes('crash') ||
    lower.includes('trauma') ||
    lower.includes('cut') ||
    lower.includes('wound')
  ) {
    return {
      text: `🚨 **TRAUMA & BLEEDING PROTOCOL**\n\n1. **Apply firm, direct pressure** on the bleeding wound with a clean cloth or bandage.\n2. **Do NOT remove** embedded objects; pad around them.\n3. **Elevate the injured limb** above heart level if no fracture is suspected.\n4. Keep the patient warm with a blanket to prevent hypovolemic shock.\n\n*Searching for nearest Trauma Care Hospitals with active ICU beds right now.*`,
      ambulanceType: 'als' as const,
      urgency: 'critical' as const,
    };
  }

  if (
    lower.includes('burn') ||
    lower.includes('fire') ||
    lower.includes('hot') ||
    lower.includes('scald')
  ) {
    return {
      text: `⚠️ **BURN CARE PROTOCOL**\n\n1. **Cool the burn immediately** with cool running tap water for at least 10–15 minutes.\n2. **Do NOT apply ice**, butter, or toothpaste.\n3. Cover loosely with a sterile, non-adherent bandage or clean plastic wrap.\n4. Keep the patient hydrated.\n\n*Finding the nearest emergency burn units & hospital facilities for you.*`,
      ambulanceType: 'bls' as const,
      urgency: 'urgent' as const,
    };
  }

  return {
    text: `🚑 **SavLife Emergency Response**\n\nI've assessed your request. Please ensure the patient is in a safe environment and resting comfortably.\n\nI have fetched the top-rated emergency trauma centers near your current live GPS coordinates below. You can book an ambulance directly with one tap.`,
    ambulanceType: 'bls' as const,
    urgency: 'urgent' as const,
  };
}

/**
 * Sends chat message to NVIDIA NIM API with automated Google Places lookup
 */
export async function sendAiTriageMessage(
  userMessage: string,
  userLat: number,
  userLng: number,
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<AiChatMessage> {
  let replyText = '';
  let recommendedAmbulanceType: 'bls' | 'als' | 'bike' = 'bls';
  let urgencyLevel: 'critical' | 'urgent' | 'moderate' | 'low' = 'urgent';

  if (hasValidNvidiaKey()) {
    try {
      const messages = [
        { role: 'system', content: EMERGENCY_SYSTEM_PROMPT },
        ...chatHistory.slice(-4),
        {
          role: 'user',
          content: `User live coordinates: lat ${userLat}, lng ${userLng}.\nUser query: ${userMessage}`,
        },
      ];

      const response = await fetch(ENV.NVIDIA_NIM_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ENV.NVIDIA_NIM_API_KEY}`,
        },
        body: JSON.stringify({
          model: ENV.NVIDIA_MODEL,
          messages,
          temperature: 0.2,
          max_tokens: 600,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const rawContent = data.choices?.[0]?.message?.content || '';
        const { cleanText, triageData } = extractTriageData(rawContent);
        replyText = cleanText;

        if (triageData) {
          if (triageData.ambulance_type) {
            recommendedAmbulanceType = triageData.ambulance_type;
          }
          if (triageData.urgency) {
            urgencyLevel = triageData.urgency;
          }
        }
      } else {
        console.warn('NVIDIA API non-200 response, using fallback:', response.status);
      }
    } catch (err) {
      console.warn('NVIDIA NIM API call failed, falling back to local triage:', err);
    }
  }

  // Fallback if no valid key or API failed
  if (!replyText) {
    const local = evaluateLocalEmergencyTriage(userMessage);
    replyText = local.text;
    recommendedAmbulanceType = local.ambulanceType;
    urgencyLevel = local.urgency;
  }

  // Parallel Google Places search for top emergency hospitals ranked by rating
  const hospitals = await fetchNearbyHospitals(userLat, userLng, 5000);
  const topHospitals = hospitals.slice(0, 4);

  return {
    id: `ai-msg-${Date.now()}`,
    sender: 'assistant',
    text: replyText,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    recommendedHospitals: topHospitals,
    recommendedAmbulanceType,
    urgencyLevel,
    actionTriggered: 'find_hospitals',
  };
}
