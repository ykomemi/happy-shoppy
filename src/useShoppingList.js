import { useState, useEffect } from 'react';
import { supabase } from './supabase';

const FAMILY_ID = 'family_komemi';

export function useShoppingList() {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    supabase.from('families')
      .upsert({ id: FAMILY_ID })
      .then(() => {});

    supabase.from('items')
      .select('*')
      .eq('family_id', FAMILY_ID)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setItems(data || []);
        setLoading(false);
      });

    const channel = supabase
      .channel('items-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'items',
        filter: `family_id=eq.${FAMILY_ID}`
      }, () => {
        supabase.from('items')
          .select('*')
          .eq('family_id', FAMILY_ID)
          .order('created_at', { ascending: false })
          .then(({ data }) => setItems(data || []));
      })
      .subscribe();

    supabase.from('history')
      .select('*')
      .eq('family_id', FAMILY_ID)
      .order('created_at', { ascending: false })
      .then(({ data }) => setHistory(data || []));

    return () => supabase.removeChannel(channel);
  }, [user]);

  async function addItem(name, qty = '', emoji = '🛒') {
    const { data } = await supabase.from('items').insert({
      family_id: FAMILY_ID,
      name, qty, emoji,
      done: false,
      added_by: user?.user_metadata?.full_name || 'Someone',
    }).select().single();
    return data;
  }

  async function toggleItem(id, currentDone) {
    await supabase.from('items').update({
      done: !currentDone,
      done_by: !currentDone
        ? (user?.user_metadata?.full_name || 'Someone')
        : null,
    }).eq('id', id);
  }

  async function deleteItem(id) {
    await supabase.from('items').delete().eq('id', id);
  }

  async function clearItems(historyLimit) {
    if (items.length === 0) return;
    await supabase.from('history').insert({
      family_id: FAMILY_ID,
      date: new Date().toLocaleDateString('en-GB',
        { day: 'numeric', month: 'short', year: 'numeric' }),
      items: items,
      saved_by: user?.user_metadata?.full_name || 'Someone',
    });
    const { data: allHistory } = await supabase
      .from('history')
      .select('id, created_at')
      .eq('family_id', FAMILY_ID)
      .order('created_at', { ascending: false });
    if (allHistory && allHistory.length > historyLimit) {
      const toDelete = allHistory.slice(historyLimit).map(h => h.id);
      await supabase.from('history').delete().in('id', toDelete);
    }
    await supabase.from('items')
      .delete()
      .eq('family_id', FAMILY_ID);
    const { data } = await supabase.from('history')
      .select('*')
      .eq('family_id', FAMILY_ID)
      .order('created_at', { ascending: false });
    setHistory(data || []);
  }

  async function restoreHistory(entry) {
    if (!entry.items?.length) return;
    const newItems = entry.items.map(item => ({
      family_id: FAMILY_ID,
      name: item.name,
      qty: item.qty || '',
      emoji: item.emoji || '🛒',
      done: false,
      added_by: user?.user_metadata?.full_name || 'Someone',
    }));
    await supabase.from('items').insert(newItems);
  }

  const login = () => supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  });

  const logout = () => supabase.auth.signOut();

  return {
    user, loading, items, history,
    addItem, toggleItem, deleteItem,
    clearItems, restoreHistory, login, logout
  };
}
