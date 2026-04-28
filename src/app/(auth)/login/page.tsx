import { login } from '@/actions/auth'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-sm p-8">
      <h1 className="text-2xl font-bold mb-1">Hobby Tracker</h1>
      <p className="text-gray-500 text-sm mb-8">Track your daily habits.</p>

      <form action={login} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Username
          </label>
          <input
            name="userId"
            required
            autoFocus
            placeholder="Enter your username"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Password
          </label>
          <input
            name="password"
            type="password"
            placeholder="Enter your password"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <button
          type="submit"
          className="mt-2 w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          Log In
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-blue-600 hover:underline font-medium">
          Sign up
        </Link>
      </p>
    </div>
  )
}
