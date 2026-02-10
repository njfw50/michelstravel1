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
          checkoutUrl: z.string(),
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
