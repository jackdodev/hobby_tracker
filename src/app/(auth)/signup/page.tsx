import { signup } from '@/actions/auth'

type Props = { searchParams: Promise<{ error?: string }> }

const ERROR_MESSAGES: Record<string, string> = {
  email_required: 'Email is required.',
  invalid_email: 'Please enter a valid email address.',
  email_taken: 'An account with that email already exists.',
  username_required: 'Display name is required.',
  password_too_short: 'Password must be at least 8 characters.',
  passwords_mismatch: 'Passwords do not match.',
}

export default async function SignupPage({ searchParams }: Props) {
  const { error } = await searchParams

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-sm p-8">
      <h1 className="text-2xl font-bold mb-1">Create account</h1>
      <p className="text-gray-500 text-sm mb-8">Start tracking your hobbies today.</p>

      {error && (
        <p className="mb-4 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
          {ERROR_MESSAGES[error] ?? 'Something went wrong. Please try again.'}
        </p>
      )}

      <form action={signup} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Email
          </label>
          <input
            name="email"
            type="email"
            required
            autoFocus
            placeholder="you@example.com"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Display Name
          </label>
          <input
            name="username"
            required
            placeholder="How you'll appear in the app"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Password
          </label>
          <input
            name="password"
            type="password"
            required
            placeholder="At least 8 characters"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Confirm Password
          </label>
          <input
            name="confirm"
            type="password"
            required
            placeholder="Repeat your password"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <button
          type="submit"
          className="mt-2 w-full px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Create Account
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <a href="/login" className="text-indigo-600 font-medium hover:underline">
          Log in
        </a>
      </p>
    </div>
  )
}
