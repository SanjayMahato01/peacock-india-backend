import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import { setCookie } from 'hono/cookie'
import bcrypt from 'bcryptjs' // Fixed import
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'
import { validate } from '../middleware/validation'
import { loginSchema, signupSchema } from '../validation/schemas'

const app = new Hono()

// Signup route
app.post('/signup', validate(signupSchema), async (c) => {
  try {
    const validatedData = c.get('validatedBody')

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return c.json({ 
        error: 'User with this email already exists',
        details: [{ message: 'Email already registered' }]
      }, 400)
    }

    // Hash password - FIXED: using bcrypt directly
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
      }
    })

    // Generate JWT token
    const token = await sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!
    )

    // Set cookie - FIXED: using setCookie function
    setCookie(c, 'auth_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 86400, // 24 hours
      path: '/',
    })

    return c.json({
      message: 'User created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      token
    })

  } catch (error) {
    console.error('Signup error:', error)
    return c.json({ 
      error: 'Internal server error',
      details: [{ message: 'Something went wrong' }]
    }, 500)
  }
})

// Login route
app.post('/login', validate(loginSchema), async (c) => {
  try {
    const validatedData = c.get('validatedBody')

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (!user) {
      return c.json({ 
        error: 'Invalid email or password',
        details: [{ message: 'Invalid credentials' }]
      }, 401)
    }

    // Verify password - FIXED: using bcrypt directly
    const isValidPassword = await bcrypt.compare(validatedData.password, user.password)

    if (!isValidPassword) {
      return c.json({ 
        error: 'Invalid email or password',
        details: [{ message: 'Invalid credentials' }]
      }, 401)
    }

    // Generate JWT token
    const token = await sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!
    )

    // Set cookie - FIXED: using setCookie function
    setCookie(c, 'auth_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 86400, // 24 hours
      path: '/',
    })

    return c.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      token
    })

  } catch (error) {
    console.error('Login error:', error)
    return c.json({ 
      error: 'Internal server error',
      details: [{ message: 'Something went wrong' }]
    }, 500)
  }
})

// Logout route
app.post('/logout', (c) => {
  setCookie(c, 'auth_token', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 0, // Expire immediately
    path: '/',
  })
  return c.json({ message: 'Logged out successfully' })
})

// Get current user
app.get('/me', authMiddleware, async (c) => {
  const payload = c.get('jwtPayload')
  
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  })

  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  return c.json({ user })
})

export default app