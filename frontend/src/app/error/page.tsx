export default function ErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 sm:p-24 bg-gradient-to-br from-red-100 to-red-200 text-red-800">
      <h1 className="text-5xl font-bold mb-4">Oops! Something went wrong.</h1>
      <p className="text-xl text-center mb-8">We couldn't complete your request.</p>
      <p className="text-lg text-center">Please try again or contact support if the issue persists.</p>
      <p className="text-sm mt-4">If you were trying to confirm your email, you might be able to log in now.</p>
    </div>
  )
}
