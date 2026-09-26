// lib/validators.ts
import { z } from 'zod'

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const roomSchema = z.object({
  name: z.string().min(3).max(80),
  type: z.enum(['standard', 'deluxe', 'suite', 'royal']),
  summary: z.string().min(10).max(160),
  description: z.string().max(2000).optional(),
  price_per_night: z.coerce.number().positive().max(100000),
  capacity: z.coerce.number().int().min(1).max(10),
  beds: z.coerce.number().int().min(1).max(6),
  size_m2: z.coerce.number().int().positive().optional(),
  view: z.string().max(60).optional(),
  amenities: z.array(z.string()).max(20),
  image: z.string().url(),
  gallery: z.array(z.string().url()).max(10).default([]),
})

export const reservationSchema = z.object({
  room_id: z.coerce.number().int().positive(),
  check_in: date,
  check_out: date,
  adults: z.coerce.number().int().min(1).max(10),
  children: z.coerce.number().int().min(0).max(10).default(0),
  special_requests: z.string().max(500).optional(),
})
