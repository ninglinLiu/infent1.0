import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    // Log the feedback (in production, you would send to your backend/email service)
    console.log('Feedback received:', data)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return NextResponse.json({ 
      success: true, 
      message: 'Feedback received successfully',
      data 
    })
  } catch (error) {
    console.error('Error processing feedback:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to process feedback' },
      { status: 500 }
    )
  }
}
