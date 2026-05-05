import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google,
    Credentials({
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      authorize(credentials) {
        const username = (credentials?.username as string)?.trim()
        if (!username) return null
        return { id: username, email: username, name: username, image: null }
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
