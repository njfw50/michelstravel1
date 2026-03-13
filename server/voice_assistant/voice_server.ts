import express from 'express';
import type { Request, Response } from 'express';
import WebSocket from 'ws';
import { createServer } from 'http';
import twilio from 'twilio';

const app = express();
const server = createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.VOICE_PORT || 5050;
const OPENAI_API_KEY = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || 'https://api.openai.com/v1';

if (!OPENAI_API_KEY) {
  throw new Error('Missing AI_INTEGRATIONS_OPENAI_API_KEY environment variable');
}

// System message for the AI assistant
const SYSTEM_MESSAGE = `You are a professional flight booking assistant for Michels Travel.

Your responsibilities:
1. Help customers search for flights by asking for:
   - Origin city/airport
   - Destination city/airport
   - Travel dates (departure and return for round trips)
   - Number of passengers
   - Cabin class preference

2. Search for available flights using the search_flights function
3. Present flight options clearly with prices and times
4. Help customers select flights
5. Collect passenger information for booking
6. Process payments securely
7. Confirm bookings

If you cannot help or the customer insists on speaking with a human:
- Politely inform them that an agent will contact them shortly
- Use the escalate_to_human function to notify the owner
- Thank them and end the call

Always be professional, friendly, and patient. Speak clearly in Portuguese or English based on customer preference.

Contact information:
- Company: Michels Travel
- Email: contact@michelstravel.agency
- Phone: +1 (862) 350-1161
- Location: New Jersey, USA`;

// Function definitions for OpenAI Realtime API
const FUNCTIONS = [
  {
    name: 'search_flights',
    description: 'Search for available flights based on origin, destination, dates, and passengers',
    parameters: {
      type: 'object',
      properties: {
        origin: {
          type: 'string',
          description: 'Origin airport IATA code (e.g., JFK, LAX)'
        },
        destination: {
          type: 'string',
          description: 'Destination airport IATA code (e.g., GRU, EWR)'
        },
        departureDate: {
          type: 'string',
          description: 'Departure date in YYYY-MM-DD format'
        },
        returnDate: {
          type: 'string',
          description: 'Return date in YYYY-MM-DD format (optional for one-way)'
        },
        passengers: {
          type: 'integer',
          description: 'Number of passengers',
          default: 1
        },
        cabinClass: {
          type: 'string',
          enum: ['economy', 'premium_economy', 'business', 'first'],
          description: 'Cabin class preference'
        }
      },
      required: ['origin', 'destination', 'departureDate', 'passengers']
    }
  },
  {
    name: 'get_flight_details',
    description: 'Get detailed information about a specific flight offer',
    parameters: {
      type: 'object',
      properties: {
        offerId: {
          type: 'string',
          description: 'The flight offer ID'
        }
      },
      required: ['offerId']
    }
  },
  {
    name: 'create_booking',
    description: 'Create a flight booking with passenger information',
    parameters: {
      type: 'object',
      properties: {
        offerId: {
          type: 'string',
          description: 'The flight offer ID to book'
        },
        passengers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                enum: ['mr', 'mrs', 'ms', 'miss', 'dr']
              },
              givenName: { type: 'string' },
              familyName: { type: 'string' },
              bornOn: { type: 'string', description: 'Date of birth in YYYY-MM-DD format' },
              gender: { type: 'string', enum: ['m', 'f'] },
              email: { type: 'string' },
              phoneNumber: { type: 'string' }
            },
            required: ['title', 'givenName', 'familyName', 'bornOn', 'gender', 'email', 'phoneNumber']
          }
        },
        contactEmail: { type: 'string' },
        contactPhone: { type: 'string' }
      },
      required: ['offerId', 'passengers', 'contactEmail', 'contactPhone']
    }
  },
  {
    name: 'escalate_to_human',
    description: 'Escalate the conversation to a human agent when the AI cannot help or customer requests it',
    parameters: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description: 'Brief reason for escalation'
        },
        customerPhone: {
          type: 'string',
          description: 'Customer phone number if available'
        },
        summary: {
          type: 'string',
          description: 'Brief summary of the conversation so far'
        }
      },
      required: ['reason']
    }
  }
];

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Michels Travel Voice Assistant is running!' });
});

// Incoming call endpoint - returns TwiML
app.all('/incoming-call', (req: Request, res: Response) => {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();
  
  // Greet the caller
  response.say({
    voice: 'Polly.Camila',
    language: 'pt-BR'
  }, 'Olá! Bem-vindo à Michels Travel. Por favor, aguarde enquanto eu conecto você ao nosso assistente de reservas.');
  
  // Connect to Media Stream
  const connect = response.connect();
  connect.stream({
    url: `wss://${req.headers.host}/media-stream`
  });
  
  res.type('text/xml');
  res.send(response.toString());
});

// WebSocket handler for media stream
wss.on('connection', (ws: WebSocket) => {
  console.log('[Voice] New WebSocket connection');
  
  let openaiWs: WebSocket | null = null;
  let streamSid: string | null = null;
  let callSid: string | null = null;
  
  // Connect to OpenAI Realtime API
  const connectToOpenAI = async () => {
    const url = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17';
    
    openaiWs = new WebSocket(url, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'realtime=v1'
      }
    });
    
    openaiWs.on('open', () => {
      console.log('[OpenAI] Connected to Realtime API');
      
      // Configure session
      const sessionUpdate = {
        type: 'session.update',
        session: {
          turn_detection: { type: 'server_vad' },
          input_audio_format: 'pcm16',
          output_audio_format: 'pcm16',
          voice: 'alloy',
          instructions: SYSTEM_MESSAGE,
          modalities: ['text', 'audio'],
          temperature: 0.8,
          tools: FUNCTIONS.map(fn => ({
            type: 'function',
            name: fn.name,
            description: fn.description,
            parameters: fn.parameters
          }))
        }
      };
      
      openaiWs?.send(JSON.stringify(sessionUpdate));
    });
    
    openaiWs.on('message', async (data: Buffer) => {
      try {
        const response = JSON.parse(data.toString());
        
        // Log important events
        if (['session.created', 'session.updated', 'response.done', 'error'].includes(response.type)) {
          console.log(`[OpenAI] Event: ${response.type}`);
        }
        
        // Handle audio response
        if (response.type === 'response.audio.delta' && response.delta) {
          // Convert PCM16 to mulaw and send to Twilio
          const audioData = Buffer.from(response.delta, 'base64');
          const mulawData = pcm16ToMulaw(audioData);
          
          ws.send(JSON.stringify({
            event: 'media',
            streamSid: streamSid,
            media: {
              payload: mulawData.toString('base64')
            }
          }));
        }
        
        // Handle function calls
        if (response.type === 'response.function_call_arguments.done') {
          const functionName = response.name;
          const args = JSON.parse(response.arguments);
          
          console.log(`[Function Call] ${functionName}`, args);
          
          let result: any;
          
          try {
            switch (functionName) {
              case 'search_flights':
                result = await handleSearchFlights(args);
                break;
              case 'get_flight_details':
                result = await handleGetFlightDetails(args);
                break;
              case 'create_booking':
                result = await handleCreateBooking(args);
                break;
              case 'escalate_to_human':
                result = await handleEscalation(args, callSid);
                break;
              default:
                result = { error: 'Unknown function' };
            }
          } catch (error: any) {
            result = { error: error.message };
          }
          
          // Send function result back to OpenAI
          openaiWs?.send(JSON.stringify({
            type: 'conversation.item.create',
            item: {
              type: 'function_call_output',
              call_id: response.call_id,
              output: JSON.stringify(result)
            }
          }));
          
          // Trigger response generation
          openaiWs?.send(JSON.stringify({ type: 'response.create' }));
        }
        
      } catch (error) {
        console.error('[OpenAI] Error processing message:', error);
      }
    });
    
    openaiWs.on('error', (error) => {
      console.error('[OpenAI] WebSocket error:', error);
    });
    
    openaiWs.on('close', () => {
      console.log('[OpenAI] WebSocket closed');
    });
  };
  
  // Handle messages from Twilio
  ws.on('message', async (message: string) => {
    try {
      const msg = JSON.parse(message);
      
      switch (msg.event) {
        case 'start':
          streamSid = msg.start.streamSid;
          callSid = msg.start.callSid;
          console.log(`[Twilio] Stream started: ${streamSid}`);
          await connectToOpenAI();
          break;
          
        case 'media':
          if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
            // Convert mulaw to PCM16 and send to OpenAI
            const mulawData = Buffer.from(msg.media.payload, 'base64');
            const pcm16Data = mulawToPcm16(mulawData);
            
            openaiWs.send(JSON.stringify({
              type: 'input_audio_buffer.append',
              audio: pcm16Data.toString('base64')
            }));
          }
          break;
          
        case 'stop':
          console.log('[Twilio] Stream stopped');
          if (openaiWs) {
            openaiWs.close();
          }
          break;
      }
    } catch (error) {
      console.error('[Twilio] Error processing message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('[Voice] WebSocket connection closed');
    if (openaiWs) {
      openaiWs.close();
    }
  });
});

// Audio conversion functions
function pcm16ToMulaw(pcm16Buffer: Buffer): Buffer {
  // Simplified conversion - in production, use a proper audio library
  const mulaw = Buffer.alloc(pcm16Buffer.length / 2);
  for (let i = 0; i < mulaw.length; i++) {
    const sample = pcm16Buffer.readInt16LE(i * 2);
    mulaw[i] = linearToMulaw(sample);
  }
  return mulaw;
}

function mulawToPcm16(mulawBuffer: Buffer): Buffer {
  const pcm16 = Buffer.alloc(mulawBuffer.length * 2);
  for (let i = 0; i < mulawBuffer.length; i++) {
    const sample = mulawToLinear(mulawBuffer[i]);
    pcm16.writeInt16LE(sample, i * 2);
  }
  return pcm16;
}

function linearToMulaw(sample: number): number {
  const MULAW_MAX = 0x1FFF;
  const MULAW_BIAS = 33;
  let sign = (sample >> 8) & 0x80;
  if (sign) sample = -sample;
  if (sample > MULAW_MAX) sample = MULAW_MAX;
  sample += MULAW_BIAS;
  let exponent = 7;
  for (let expMask = 0x4000; (sample & expMask) === 0 && exponent > 0; exponent--, expMask >>= 1);
  const mantissa = (sample >> (exponent + 3)) & 0x0F;
  return ~(sign | (exponent << 4) | mantissa);
}

function mulawToLinear(mulawByte: number): number {
  mulawByte = ~mulawByte;
  const sign = mulawByte & 0x80;
  const exponent = (mulawByte >> 4) & 0x07;
  const mantissa = mulawByte & 0x0F;
  let sample = ((mantissa << 3) + 0x84) << exponent;
  return sign ? -sample : sample;
}

// Function handlers
async function handleSearchFlights(args: any) {
  try {
    const response = await fetch(`http://localhost:${process.env.PORT || 5000}/api/flights/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: args.origin,
        destination: args.destination,
        departureDate: args.departureDate,
        returnDate: args.returnDate,
        passengers: args.passengers || 1,
        cabinClass: args.cabinClass || 'economy'
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { error: data.error || 'Failed to search flights' };
    }
    
    // Return simplified flight data for the AI
    return {
      success: true,
      flights: data.slice(0, 5).map((flight: any) => ({
        id: flight.id,
        airline: flight.airline,
        price: flight.price,
        currency: flight.currency,
        duration: flight.duration,
        stops: flight.stops,
        departureTime: flight.departureTime,
        arrivalTime: flight.arrivalTime
      }))
    };
  } catch (error: any) {
    return { error: error.message };
  }
}

async function handleGetFlightDetails(args: any) {
  try {
    const response = await fetch(`http://localhost:${process.env.PORT || 5000}/api/flights/${args.offerId}`);
    const data = await response.json();
    
    if (!response.ok) {
      return { error: data.error || 'Failed to get flight details' };
    }
    
    return { success: true, flight: data };
  } catch (error: any) {
    return { error: error.message };
  }
}

async function handleCreateBooking(args: any) {
  try {
    const response = await fetch(`http://localhost:${process.env.PORT || 5000}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        flightId: args.offerId,
        passengers: args.passengers,
        contactEmail: args.contactEmail,
        contactPhone: args.contactPhone
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { error: data.error || 'Failed to create booking' };
    }
    
    return {
      success: true,
      bookingId: data.id,
      referenceCode: data.referenceCode,
      paymentUrl: data.paymentUrl,
      message: 'Booking created successfully. Payment link will be sent via SMS.'
    };
  } catch (error: any) {
    return { error: error.message };
  }
}

async function handleEscalation(args: any, callSid: string | null) {
  console.log('[Escalation] Customer needs human assistance:', args);
  
  // Send notification via Facebook Messenger (will implement in next phase)
  try {
    await fetch(`http://localhost:${process.env.PORT || 5000}/api/voice/escalate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reason: args.reason,
        customerPhone: args.customerPhone,
        summary: args.summary,
        callSid: callSid
      })
    });
  } catch (error) {
    console.error('[Escalation] Failed to send notification:', error);
  }
  
  return {
    success: true,
    message: 'Your request has been forwarded to our team. An agent will contact you shortly.'
  };
}

// Start server
server.listen(PORT, () => {
  console.log(`[Voice Assistant] Server running on port ${PORT}`);
  console.log(`[Voice Assistant] Webhook URL: http://localhost:${PORT}/incoming-call`);
});
