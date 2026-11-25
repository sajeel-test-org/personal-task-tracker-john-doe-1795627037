import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type Task = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  done: boolean;
};

export function TaskBoard({ user }: { user: User }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  async function load() {
    const { data, error } = await supabase
      .from('tasks')
      .select('id,title,description,due_date,done')
      .order('done', { ascending: true })
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setTasks(data as Task[]);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  function reset() {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setDueDate('');
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      due_date: dueDate || null,
    };
    const { error } = editingId
      ? await supabase.from('tasks').update(payload).eq('id', editingId)
      : await supabase.from('tasks').insert(payload);
    if (error) return setError(error.message);
    reset();
    await load();
  }

  async function toggle(t: Task) {
    const { error } = await supabase.from('tasks').update({ done: !t.done }).eq('id', t.id);
    if (error) setError(error.message);
    await load();
  }

  async function remove(t: Task) {
    const { error } = await supabase.from('tasks').delete().eq('id', t.id);
    if (error) setError(error.message);
    if (editingId === t.id) reset();
    await load();
  }

  function edit(t: Task) {
    setEditingId(t.id);
    setTitle(t.title);
    setDescription(t.description ?? '');
    setDueDate(t.due_date ?? '');
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between bg-white px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">My Tasks</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-slate-500 sm:inline">{user.email}</span>
          <button
            onClick={() => supabase.auth.signOut()}
            className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-100"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 p-4">
        <form onSubmit={save} className="space-y-3 rounded-2xl bg-white p-4 shadow">
          <h2 className="font-medium text-slate-800">{editingId ? 'Edit task' : 'New task'}</h2>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm text-slate-600">
              Due{' '}
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="rounded-lg border border-slate-300 px-2 py-1"
              />
            </label>
            <div className="ml-auto flex gap-2">
              {editingId && (
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
                >
                  Cancel
                </button>
              )}
              <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                {editingId ? 'Save changes' : 'Add task'}
              </button>
            </div>
          </div>
        </form>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {loading ? (
          <p className="text-slate-500">Loading…</p>
        ) : tasks.length === 0 ? (
          <p className="text-center text-slate-500">No tasks yet. Add your first one above!</p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((t) => (
              <li key={t.id} className="flex items-start gap-3 rounded-xl bg-white p-4 shadow-sm">
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={() => toggle(t)}
                  className="mt-1 h-5 w-5 accent-indigo-600"
                />
                <div className="min-w-0 flex-1">
                  <p className={`font-medium ${t.done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                    {t.title}
                  </p>
                  {t.description && <p className="text-sm text-slate-600">{t.description}</p>}
                  {t.due_date && (
                    <p
                      className={`text-xs ${!t.done && t.due_date < today ? 'text-red-600' : 'text-slate-500'}`}
                    >
                      Due {t.due_date}
                    </p>
                  )}
                </div>
                <button onClick={() => edit(t)} className="text-sm text-indigo-600 hover:underline">
                  Edit
                </button>
                <button onClick={() => remove(t)} className="text-sm text-red-600 hover:underline">
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
