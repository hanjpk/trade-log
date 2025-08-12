import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Explicitly define the type for the second argument's shape
type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params
    const trade = await prisma.trade.findFirst({
      where: {
        id: id,
      },
    })

    if (!trade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
    }

    return NextResponse.json(trade)
  } catch (error) {
    console.error('Error fetching trade:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}