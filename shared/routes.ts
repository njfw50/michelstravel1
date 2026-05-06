import { z } from 'zod';
import { insertBookingSchema, bookings, flightSearches, siteSettings, blogPosts, insertSiteSettingsSchema, insertBlogPostSchema } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  flights: {
    search: {
      method: 'GET' as const,
      path: '/api/flights/search' as const,
      input: z.object({
        origin: z.string(),
        destination: z.string(),
        date: z.string(),
        returnDate: z.string().optional(),
        passengers: z.string().optional(),
        adults: z.string().optional(),
        children: z.string().optional(),
        infants: z.string().optional(),
        cabinClass: z.string().optional(),
      }),
      responses: {
        200: z.array(z.object({
          id: z.string(),
          airline: z.string(),
          flightNumber: z.string(),
          departureTime: z.string(),
          arrivalTime: z.string(),
          duration: z.string(),
          price: z.number(),
          currency: z.string(),
          stops: z.number(),
          logoUrl: z.string().nullable().optional(),
          aircraftType: z.string().nullable().optional(),
          originCity: z.string().nullable().optional(),
          destinationCity: z.string().nullable().optional(),
          originCode: z.string().nullable().optional(),
          destinationCode: z.string().nullable().optional(),
          cabinClass: z.string().nullable().optional(),
          taxAmount: z.string().nullable().optional(),
          baseAmount: z.string().nullable().optional(),
          passengerIdentityDocumentsRequired: z.boolean().optional(),
          slices: z.array(z.object({
            duration: z.string(),
            originCode: z.string(),
            originCity: z.string().nullable(),
            destinationCode: z.string(),
            destinationCity: z.string().nullable(),
            segments: z.array(z.object({
              segmentId: z.string(),
              carrierCode: z.string(),
              carrierName: z.string(),
              flightNumber: z.string(),
              aircraftType: z.string().nullable(),
              departureTime: z.string(),
              arrivalTime: z.string(),
              duration: z.string(),
              originCode: z.string(),
              originName: z.string(),
              originCity: z.string().nullable(),
              originTerminal: z.string().nullable(),
              destinationCode: z.string(),
              destinationName: z.string(),
              destinationCity: z.string().nullable(),
              destinationTerminal: z.string().nullable(),
            })),
          })).optional(),
          passengers: z.array(z.object({
            passengerId: z.string(),
            passengerType: z.string(),
            cabinClass: z.string(),
            cabinClassName: z.string(),
            baggages: z.array(z.object({
              type: z.string(),
              quantity: z.number(),
            })),
            fareBrandName: z.string().nullable(),
          })).optional(),
          conditions: z.object({
            changeBeforeDeparture: z.object({
              allowed: z.boolean(),
              penaltyAmount: z.string().optional(),
              penaltyCurrency: z.string().optional(),
            }).nullable().optional(),
            refundBeforeDeparture: z.object({
              allowed: z.boolean(),
              penaltyAmount: z.string().optional(),
              penaltyCurrency: z.string().optional(),
            }).nullable().optional(),
          }).nullable().optional(),
        })),
        400: errorSchemas.validation,
      },
    },
    popular: {
      method: 'GET' as const,
      path: '/api/flights/popular' as const,
      responses: {
        200: z.array(z.custom<typeof flightSearches.$inferSelect>()),
      },
    },
  },
  bookings: {
    create: {
      method: 'POST' as const,
      path: '/api/bookings' as const,
      input: insertBookingSchema,
      responses: {
        201: z.object({
          booking: z.custom<typeof bookings.$inferSelect>(),
          clientSecret: z.string(),
        }),
        400: errorSchemas.validation,
      },
    },
    list: { // User's own bookings
      method: 'GET' as const,
      path: '/api/bookings' as const,
      responses: {
        200: z.array(z.custom<typeof bookings.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/bookings/:id' as const,
      responses: {
        200: z.custom<typeof bookings.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  admin: {
    dashboard_stats: {
      method: 'GET' as const,
      path: '/api/admin/stats' as const,
      responses: {
        200: z.object({
          totalBookings: z.number(),
          totalRevenue: z.number(),
          totalCommission: z.number(),
          recentSearches: z.number(),
          searchesToday: z.number().optional(),
          revenueToday: z.number().optional(),
          dailyRevenue: z.array(z.object({
            date: z.string(),
            revenue: z.number(),
            bookings: z.number(),
            commission: z.number(),
          })).optional(),
          statusBreakdown: z.record(z.number()).optional(),
          ticketStatusBreakdown: z.record(z.number()).optional(),
          topRoutes: z.array(z.object({
            route: z.string(),
            count: z.number(),
            revenue: z.number(),
          })).optional(),
          pendingPayments: z.number().optional(),
          confirmedBookings: z.number().optional(),
          cancelledBookings: z.number().optional(),
          avgBookingValue: z.number().optional(),
        }),
        401: errorSchemas.unauthorized,
      },
    },
    settings_get: {
      method: 'GET' as const,
      path: '/api/admin/settings' as const,
      responses: {
        200: z.custom<typeof siteSettings.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    settings_update: {
      method: 'POST' as const, // Using POST for update/upsert simplification
      path: '/api/admin/settings' as const,
      input: insertSiteSettingsSchema,
      responses: {
        200: z.custom<typeof siteSettings.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    bookings_all: {
      method: 'GET' as const,
      path: '/api/admin/bookings' as const,
      responses: {
        200: z.array(z.custom<typeof bookings.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    test_mode_preflight: {
      method: 'GET' as const,
      path: '/api/admin/test-mode/preflight' as const,
      input: z.object({
        target: z.enum(['test', 'production']),
      }),
      responses: {
        200: z.object({
          targetMode: z.string(),
          ready: z.boolean(),
          duffelReady: z.boolean(),
          stripeReady: z.boolean(),
          issues: z.array(z.string()),
        }),
        401: errorSchemas.unauthorized,
      },
    },
    test_mode_toggle: {
      method: 'POST' as const,
      path: '/api/admin/test-mode' as const,
      input: z.object({
        testMode: z.boolean(),
        confirmed: z.boolean(),
      }),
      responses: {
        200: z.object({
          testMode: z.boolean(),
          activeTokenIsTest: z.boolean(),
          stripeSynced: z.boolean(),
          message: z.string(),
        }),
        401: errorSchemas.unauthorized,
      },
    },
    featured_deals: {
      list: {
        method: 'GET' as const,
        path: '/api/admin/featured-deals' as const,
        responses: {
          200: z.array(z.custom<typeof featuredDeals.$inferSelect>()),
          401: errorSchemas.unauthorized,
        },
      },
      create: {
        method: 'POST' as const,
        path: '/api/admin/featured-deals' as const,
        input: insertFeaturedDealSchema,
        responses: {
          201: z.custom<typeof featuredDeals.$inferSelect>(),
          400: errorSchemas.validation,
          401: errorSchemas.unauthorized,
        },
      },
      update: {
        method: 'PATCH' as const,
        path: '/api/admin/featured-deals/:id' as const,
        input: insertFeaturedDealSchema.partial(),
        responses: {
          200: z.custom<typeof featuredDeals.$inferSelect>(),
          400: errorSchemas.validation,
          401: errorSchemas.unauthorized,
          404: errorSchemas.notFound,
        },
      },
      delete: {
        method: 'DELETE' as const,
        path: '/api/admin/featured-deals/:id' as const,
        responses: {
          200: z.object({ success: z.boolean() }),
          401: errorSchemas.unauthorized,
          404: errorSchemas.notFound,
        },
      },
    },
  },
  blog: {
    list: {
      method: 'GET' as const,
      path: '/api/blog' as const,
      responses: {
        200: z.array(z.custom<typeof blogPosts.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/blog/:slug' as const,
      responses: {
        200: z.custom<typeof blogPosts.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    // Admin only
    create: {
      method: 'POST' as const,
      path: '/api/admin/blog' as const,
      input: insertBlogPostSchema,
      responses: {
        201: z.custom<typeof blogPosts.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
