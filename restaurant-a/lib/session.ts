// lib/session.ts
import 'server-only'
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
 
export type SessionUser = { id: number; email: string; role: 'admin' | 'user' }
 
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions)
  const su: any = session?.user
  if (!su?.id || !su?.email) return null
 
  return {
    id: Number(su.id),
    email: su.email,
    role: su.role === 'admin' ? 'admin' : 'user',
  }
}
 
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}
 
export async function requireUser() {
  const u = await getSessionUser()
  if (!u) throw new HttpError(401, 'ابتدا وارد حساب شوید')
  return u
}
 
export async function requireAdmin() {
  const u = await requireUser()
  if (u.role !== 'admin') throw new HttpError(403, 'فقط ادمین')
  return u
}
 
export function handleError(e: unknown) {
  if (e instanceof HttpError) {
    return NextResponse.json({ error: e.message }, { status: e.status })
  }
  if (e instanceof ZodError) {
    return NextResponse.json({ error: 'داده نامعتبر', issues: e.issues }, { status: 400 })
  }
  console.error(e)
  return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
}