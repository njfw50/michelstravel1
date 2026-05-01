const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'server', 'stripeService.ts');
let content = fs.readFileSync(file, 'utf8');

// Inject capture_method: 'manual'
content = content.replace(
  "statement_descriptor_suffix: (metadata.referenceCode || '').substring(0, 22),",
  "statement_descriptor_suffix: (metadata.referenceCode || '').substring(0, 22),\n        capture_method: 'manual',"
);

// Inject new methods
content = content.replace(
  "export const stripeService = new StripeService();",
  `  async capturePayment(paymentIntentId: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.paymentIntents.capture(paymentIntentId);
  }

  async cancelPayment(paymentIntentId: string, cancellationReason: "duplicate" | "fraudulent" | "requested_by_customer" | "abandoned" = "abandoned") {
    const stripe = await getUncachableStripeClient();
    return await stripe.paymentIntents.cancel(paymentIntentId, { cancellation_reason: cancellationReason });
  }
}

export const stripeService = new StripeService();`
);

fs.writeFileSync(file, content, 'utf8');
console.log('Stripe service patched successfully.');
