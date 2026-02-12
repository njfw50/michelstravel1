
import { storage } from './storage';
import { getUncachableStripeClient } from './stripeClient';

export class StripeService {
  async createCustomer(email: string, userId: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.customers.create({
      email,
      metadata: { userId },
    });
  }

  async createCheckoutSession(customerId: string, priceId: string, successUrl: string, cancelUrl: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
  }

  async createFlightCheckoutSession(
    customerId: string | undefined, 
    amount: number, 
    currency: string, 
    successUrl: string, 
    cancelUrl: string,
    metadata: any
  ) {
    const stripe = await getUncachableStripeClient();
    
    const passengerSummary = metadata.passengers 
      ? metadata.passengers.map((p: any) => `${p.givenName} ${p.familyName}`).join(', ')
      : '';

    const flightDescription = [
      metadata.airline ? `${metadata.airline}` : '',
      metadata.flightNumber ? `Flight ${metadata.flightNumber}` : '',
      metadata.origin && metadata.destination ? `${metadata.origin} → ${metadata.destination}` : '',
      metadata.departureDate ? `Departure: ${metadata.departureDate}` : '',
      passengerSummary ? `Passengers: ${passengerSummary}` : '',
    ].filter(Boolean).join(' | ');

    const sessionConfig: any = {
      line_items: [{
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: `Michels Travel - ${metadata.origin || ''} → ${metadata.destination || ''}`,
            description: flightDescription || `Flight Booking #${metadata.bookingId}`,
            images: metadata.airlineLogo ? [metadata.airlineLogo] : [],
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      billing_address_collection: 'required',
      phone_number_collection: {
        enabled: true,
      },
      payment_method_types: ['card'],
      metadata: {
        bookingId: String(metadata.bookingId),
        referenceCode: metadata.referenceCode || '',
        origin: metadata.origin || '',
        destination: metadata.destination || '',
        airline: metadata.airline || '',
        flightNumber: metadata.flightNumber || '',
        departureDate: metadata.departureDate || '',
        returnDate: metadata.returnDate || '',
        passengerCount: String(metadata.passengerCount || 1),
        cabinClass: metadata.cabinClass || 'economy',
        contactEmail: metadata.contactEmail || '',
        contactPhone: metadata.contactPhone || '',
      },
      client_reference_id: String(metadata.bookingId),
      allow_promotion_codes: true,
      locale: metadata.locale || 'auto',
      expires_after: 1800,
      custom_text: {
        submit: {
          message: `Michels Travel - ${metadata.referenceCode || ''} | ${metadata.origin || ''} → ${metadata.destination || ''}`,
        },
      },
      payment_intent_data: {
        description: `Michels Travel Booking ${metadata.referenceCode || '#' + metadata.bookingId}: ${metadata.origin || ''} → ${metadata.destination || ''}`,
        metadata: {
          bookingId: String(metadata.bookingId),
          referenceCode: metadata.referenceCode || '',
        },
        receipt_email: metadata.contactEmail || undefined,
      },
    };

    if (customerId) {
      sessionConfig.customer = customerId;
    } else if (metadata.contactEmail) {
      sessionConfig.customer_email = metadata.contactEmail;
    }

    return await stripe.checkout.sessions.create(sessionConfig);
  }

  async createCustomerPortalSession(customerId: string, returnUrl: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  async getProduct(productId: string) {
    return await storage.getProduct(productId);
  }

  async getSubscription(subscriptionId: string) {
    return await storage.getSubscription(subscriptionId);
  }
}

export const stripeService = new StripeService();
