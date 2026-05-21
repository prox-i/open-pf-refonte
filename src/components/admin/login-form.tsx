'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { adminLoginSchema, type AdminLoginData } from '@/lib/validations/admin'
import { loginAction } from '@/lib/actions/login'

export function LoginForm() {
  const [error, setError] = useState<string | null>(null)

  const form = useForm<AdminLoginData>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function handleSubmit(data: AdminLoginData) {
    setError(null)
    const result = await loginAction(data.email, data.password)
    if (result?.error) {
      setError(result.error)
    }
    // On success, loginAction redirects server-side to /admin
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} noValidate className="admin-login-form">
      <div className="form-field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          aria-describedby={error ? 'login-error' : undefined}
          {...form.register('email')}
        />
      </div>
      <div className="form-field">
        <label htmlFor="password">Mot de passe</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          {...form.register('password')}
        />
      </div>
      {error && (
        <p id="login-error" className="field-error" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        className="btn"
        style={{ width: '100%' }}
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? 'Connexion…' : 'Se connecter'}
      </button>
    </form>
  )
}
