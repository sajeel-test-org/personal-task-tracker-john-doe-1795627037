import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { AuthForm } from '@/components/AuthForm';
import { TaskBoard } from '@/components/TaskBoard';

export const Route = createFileRoute('/')({ component: HomePage });

function HomePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!ready) return <div className="p-8 text-slate-500">Loading…</div>;
  return session ? <TaskBoard user={session.user} /> : <AuthForm />;
}
