
import { storage } from './storage';
import { getUncachableStripeClient } from './stripeClient';

/**
 * StripeService: Handles direct Stripe API operations
 * Pattern: Use Stripe client for write operations, storage for read operations
 */
export class StripeService {
  // Create customer in Stripe
  async createCustomer(email: string, userId: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.customers.create({
      email,
      metadata: { userId },
    });
  }

  // Create checkout session
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

  // Create checkout session for flight booking (one-time payment)
  async createFlightCheckoutSession(
    customerId: string | undefined, 
    amount: number, 
    currency: string, 
    successUrl: string, 
    cancelUrl: string,
    metadata: any
  ) {
    const stripe = await getUncachableStripeClient();
    
    const sessionConfig: any = {
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: currency,
          product_data: {
            name: `Flight Booking #${metadata.bookingId}`,
            description: `Flight from ${metadata.origin || 'Origin'} to ${metadata.destination || 'Destination'}`,
            // images: [metadata.airlineLogo], // Optional: Add airline logo if available
          },
          unit_amount: Math.round(amount * 100), // Stripe expects cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: metadata,
      client_reference_id: metadata.bookingId.toString(),
    };

    if (customerId) {
      sessionConfig.customer = customerId;
    } else {
        // For guest checkout, prefill email if available
        if (metadata.contactEmail) {
            sessionConfig.customer_email = metadata.contactEmail;
        }
    }

    return await stripe.checkout.sessions.create(sessionConfig);
  }

  // Create customer portal session
  async createCustomerPortalSession(customerId: string, returnUrl: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  // Read operations - delegate to storage (queries PostgreSQL)
  async getProduct(productId: string) {
    return await storage.getProduct(productId);
  }

  async getSubscription(subscriptionId: string) {
    return await storage.getSubscription(subscriptionId);
  }
}

export const stripeService = new StripeService();
