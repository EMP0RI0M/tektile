export default function AuthCodeError() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-4">
      <h1 className="text-2xl font-bold text-destructive">DEBUG: Authentication Error</h1>
      <p className="text-muted-foreground max-w-md">
        There was an issue verifying your authentication code. This could be due to an expired link or a configuration error.
      </p>
      <a 
        href="/projects" 
        className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/80 transition-colors"
      >
        Back to Login
      </a>
    </div>
  )
}
