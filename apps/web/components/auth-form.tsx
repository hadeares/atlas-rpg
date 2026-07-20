'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { saveSession } from '@/lib/auth';
import { AuthSession } from '@/lib/types';

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const session = await apiRequest<AuthSession>(`/auth/${mode === 'login' ? 'login' : 'register'}`, {
        method: 'POST',
        authenticated: false,
        body: JSON.stringify(
          mode === 'login'
            ? { email, password }
            : { email, displayName, password }
        )
      });

      saveSession(session);
      router.push('/campaigns');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Não foi possível entrar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="brand-mark">AC</div>
        <p className="eyebrow">Atlas das Cinzas</p>
        <h1>{mode === 'login' ? 'Entrar no Atlas' : 'Criar conta'}</h1>
        <p className="muted">
          {mode === 'login'
            ? 'Entre como jogador, mestre ou administrador.'
            : 'Cadastre uma conta comum. Depois, em cada campanha, ela poderá participar como jogador ou mestre.'}
        </p>

        <form onSubmit={handleSubmit} className="form-stack">
          {mode === 'register' && (
            <label>
              Nome
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                minLength={2}
                maxLength={120}
                required
              />
            </label>
          )}

          <label>
            E-mail
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label>
            Senha
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
          </label>

          {error && <p className="error-message">{error}</p>}

          <button className="primary-button" disabled={loading}>
            {loading ? 'Processando...' : mode === 'login' ? 'Entrar' : 'Criar minha conta'}
          </button>
        </form>

        <p className="auth-switch">
          {mode === 'login' ? 'Ainda não possui conta?' : 'Já possui conta?'}{' '}
          <Link href={mode === 'login' ? '/register' : '/login'}>
            {mode === 'login' ? 'Criar agora' : 'Entrar'}
          </Link>
        </p>
      </section>
    </main>
  );
}
