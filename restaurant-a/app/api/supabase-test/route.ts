import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      {
        success: false,
        message: 'Supabase environment variables are missing',
      },
      { status: 500 }
    )
  }

  const supabase = createClient(
    supabaseUrl,
    supabaseKey
  )

  const { data, error } = await supabase.auth.getSession()

  if (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    message: 'Supabase connected successfully!',
    session: data.session,
  })
}