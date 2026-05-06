import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { getUser } from '@/lib/storage'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google,
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string)?.trim().toLowerCase()
        const password = credentials?.password as string
        if (!email || !password) return null

        const user = await getUser(email)
        if (!user) return null

        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) return null

        return { id: email, email, name: user.username, image: null }
      },
    }),
  ],
  pages: { signIn: '/login' },
  callbacks: {
    jwt({ token, account, profile }) {
      if (account?.provider === 'google' && profile) {
        token.picture = (profile as { picture?: string }).picture ?? null
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.image = (token.picture as string | null | undefined) ?? null
      }
      return session
    },
  },
})
