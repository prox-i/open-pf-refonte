'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { adminLoginSchema, type AdminLoginData } from '@/lib/validations/admin'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  const form = useForm<AdminLoginData>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function handleSubmit(data: AdminLoginData) {
    setError(null)
    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })

    if (result?.error) {
      setError('Email ou mot de passe incorrect.')
      return
    }

    const callbackUrl = searchParams.get('callbackUrl') ?? '/admin'
    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} noValidate className="admin-login-form">
      <div className="form-field">
        <label htmlFor="email">Identifiant</label>
        <input
          id="email"
          type="text"
          autoComplete="username"
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
