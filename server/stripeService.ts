
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
      ? metadata.passengers.map((p: any) => `${p.givenName || p.firstName || ''} ${p.familyName || p.lastName || ''}`).join(', ')
      : '';

    // Enhanced flight description with more details
    const flightDescription = [
      metadata.airline ? `${metadata.airline}` : '',
      metadata.flightNumber ? `Flight ${metadata.flightNumber}` : '',
      metadata.origin && metadata.destination ? `${metadata.origin} → ${metadata.destination}` : '',
      metadata.departureDate ? `Departure: ${metadata.departureDate}` : '',
      metadata.returnDate ? `Return: ${metadata.returnDate}` : '',
      metadata.cabinClass ? `Class: ${metadata.cabinClass}` : '',
      passengerSummary ? `Passengers: ${passengerSummary}` : '',
    ].filter(Boolean).join(' | ');

    const expiresAt = Math.floor(Date.now() / 1000) + 1800;

    const sessionConfig: any = {
      payment_method_types: ['card', 'pix'],
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
      invoice_creation: {
        enabled: true,
        invoice_data: {
          description: `Flight Booking ${metadata.referenceCode || '#' + metadata.bookingId}`,
          custom_fields: [
            { name: 'Booking Reference', value: metadata.referenceCode || `MT-${metadata.bookingId}` },
            { name: 'Flight Number', value: metadata.flightNumber || 'N/A' },
            { name: 'Route', value: `${metadata.origin || ''} → ${metadata.destination || ''}` },
            { name: 'Departure Date', value: metadata.departureDate || 'N/A' },
          ].concat(metadata.returnDate ? [{ name: 'Return Date', value: metadata.returnDate }] : []),
          footer: 'Thank you for choosing Michels Travel. Have a great flight! For support, contact us at contact@michelstravel.agency or +1 (862) 350-1161',
          metadata: {
            bookingId: String(metadata.bookingId),
            referenceCode: metadata.referenceCode || '',
            flightType: metadata.returnDate ? 'round_trip' : 'one_way',
          },
        },
      },
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
      expires_at: expiresAt,
      custom_text: {
        submit: {
          message: `Michels Travel - ${metadata.referenceCode || ''} | ${metadata.origin || ''} → ${metadata.destination || ''}`,
        },
        after_submit: {
          message: `Your booking reference is ${metadata.referenceCode || ''}. You will receive a confirmation email shortly.`,
        },
      },
      payment_intent_data: {
        description: [
          `Michels Travel - Booking ${metadata.referenceCode || '#' + metadata.bookingId}`,
          '',
          `OUTBOUND: ${metadata.origin || ''} → ${metadata.destination || ''}`,
          `Departure: ${metadata.departureDate || 'N/A'}`,
          metadata.airline ? `Airline: ${metadata.airline} ${metadata.flightNumber || ''}` : '',
          '',
          metadata.returnDate ? `RETURN: ${metadata.destination || ''} → ${metadata.origin || ''}` : '',
          metadata.returnDate ? `Return: ${metadata.returnDate}` : '',
          '',
          `Passengers: ${metadata.passengerCount || 1} (${metadata.cabinClass || 'economy'})`,
          passengerSummary ? `Names: ${passengerSummary}` : '',
        ].filter(Boolean).join('\n'),
        statement_descriptor: 'MICHELS TRAVEL',
        statement_descriptor_suffix: (metadata.referenceCode || '').substring(0, 22),
        metadata: {
          bookingId: String(metadata.bookingId),
          referenceCode: metadata.referenceCode || '',
          origin: metadata.origin || '',
          destination: metadata.destination || '',
          departureDate: metadata.departureDate || '',
          returnDate: metadata.returnDate || '',
          passengerCount: String(metadata.passengerCount || 1),
        },
        receipt_email: metadata.contactEmail || undefined,
      },
      consent_collection: {
        terms_of_service: 'none',
      },
    };

    if (customerId) {
      sessionConfig.customer = customerId;
      sessionConfig.customer_update = {
        address: 'auto',
        name: 'auto',
      };
    } else if (metadata.contactEmail) {
      sessionConfig.customer_email = metadata.contactEmail;
      sessionConfig.customer_creation = 'always';
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
