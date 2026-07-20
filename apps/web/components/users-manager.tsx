'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { readSession } from '@/lib/auth';
import { UserData, UserRole } from '@/lib/types';

export function UsersManager() {
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('USER');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('USER');
  const [editActive, setEditActive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const session = readSession();
    if (!session) {
      router.replace('/login');
      return;
    }
    if (session.user.role !== 'ADMIN') {
      router.replace('/campaigns');
      return;
    }
    void loadUsers();
  }, [router]);

  async function loadUsers() {
    setError('');
    try {
      setUsers(await apiRequest<UserData[]>('/users'));
    } catch (caughtError) {
      setError(readError(caughtError));
    }
  }

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const user = await apiRequest<UserData>('/users', {
        method: 'POST',
        body: JSON.stringify({ email, displayName, password, role })
      });
      setUsers((current) => [user, ...current]);
      setEmail('');
      setDisplayName('');
      setPassword('');
      setRole('USER');
    } catch (caughtError) {
      setError(readError(caughtError));
    } finally {
      setBusy(false);
    }
  }

  function startEdit(user: UserData) {
    setEditingId(user.id);
    setEditName(user.displayName);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditActive(user.isActive);
  }

  async function saveUser(userId: string) {
    setBusy(true);
    setError('');
    try {
      const updated = await apiRequest<UserData>(`/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ displayName: editName, email: editEmail, role: editRole, isActive: editActive })
      });
      setUsers((current) => current.map((user) => user.id === userId ? updated : user));
      setEditingId(null);
    } catch (caughtError) {
      setError(readError(caughtError));
    } finally {
      setBusy(false);
    }
  }

  async function removeUser(user: UserData) {
    if (!window.confirm(`Excluir permanentemente o usuário ${user.displayName}?`)) return;
    setBusy(true);
    setError('');
    try {
      await apiRequest(`/users/${user.id}`, { method: 'DELETE' });
      setUsers((current) => current.filter((item) => item.id !== user.id));
    } catch (caughtError) {
      setError(readError(caughtError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <div><p className="eyebrow">Administração</p><h1>Usuários</h1></div>
        <Link className="ghost-button button-link" href="/campaigns">Voltar às campanhas</Link>
      </header>

      {error && <p className="global-error">{error}</p>}

      <section className="dashboard-grid users-grid">
        <div className="panel">
          <div className="section-heading"><div><p className="eyebrow">Cadastro completo</p><h2>Contas do sistema</h2></div><button className="ghost-button" onClick={() => void loadUsers()}>Atualizar</button></div>
          <div className="user-list">
            {users.map((user) => (
              <article className="user-card" key={user.id}>
                {editingId === user.id ? (
                  <div className="form-stack compact-form">
                    <label>Nome<input value={editName} onChange={(event) => setEditName(event.target.value)} /></label>
                    <label>E-mail<input type="email" value={editEmail} onChange={(event) => setEditEmail(event.target.value)} /></label>
                    <label>Perfil do sistema<select value={editRole} onChange={(event) => setEditRole(event.target.value as UserRole)}><option value="USER">Usuário padrão</option><option value="ADMIN">Administrador</option></select></label>
                    <label className="checkbox-label"><input type="checkbox" checked={editActive} onChange={(event) => setEditActive(event.target.checked)} />Conta ativa</label>
                    <div className="row-actions"><button className="primary-button" onClick={() => void saveUser(user.id)} disabled={busy}>Salvar</button><button className="ghost-button" onClick={() => setEditingId(null)}>Cancelar</button></div>
                  </div>
                ) : (
                  <>
                    <div><h3>{user.displayName}</h3><p>{user.email}</p></div>
                    <div className="campaign-meta"><span>{user.role === 'ADMIN' ? 'Administrador' : 'Usuário padrão'}</span><span>{user.isActive ? 'Ativo' : 'Inativo'}</span></div>
                    <div className="row-actions"><button className="ghost-button" onClick={() => startEdit(user)}>Editar</button><button className="danger-button" onClick={() => void removeUser(user)} disabled={busy}>Excluir</button></div>
                  </>
                )}
              </article>
            ))}
          </div>
        </div>

        <aside className="panel">
          <p className="eyebrow">Nova conta</p>
          <h2>Cadastrar conta</h2>
          <form className="form-stack" onSubmit={createUser}>
            <label>Nome<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required minLength={2} /></label>
            <label>E-mail<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
            <label>Senha inicial<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} /></label>
            <label>Perfil do sistema<select value={role} onChange={(event) => setRole(event.target.value as UserRole)}><option value="USER">Usuário padrão</option><option value="ADMIN">Administrador</option></select></label>
            <p className="helper-text">A conta padrão pode ser jogador em uma campanha e mestre em outra. O papel é definido quando ela é adicionada a cada campanha.</p><button className="primary-button" disabled={busy}>Criar conta</button>
          </form>
        </aside>
      </section>
    </main>
  );
}

function readError(error: unknown) {
  return error instanceof Error ? error.message : 'Não foi possível concluir a operação.';
}
