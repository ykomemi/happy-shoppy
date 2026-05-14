import { useState, useEffect } from 'react';
import { supabase } from './supabase';

const FAMILY_ID = 'family_komemi';

function load(key, def) {
  try { return JSON.parse(localStorage.getItem(key)) ?? def; } catch { return def; }
}
function persist(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

export function useShoppingList(listType = "family") {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState(() => listType === "my" ? load("myListItems", []) : []);
  const [history, setHistory] = useState(() => listType === "my" ? load("myListHistory", []) : []);
  const [loading, setLoading] = useState(() => listType !== "my");

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
    if (listType === "my") {
      setItems(load("myListItems", []));
      setHistory(load("myListHistory", []));
      setLoading(false);
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

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
  }, [user, listType]);

  async function addItem(name, qty = '', emoji = '🛒') {
    if (listType === "my") {
      const newItem = {
        id: `my-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name, qty, emoji, done: false,
        added_by: user?.user_metadata?.full_name || 'Someone',
        created_at: new Date().toISOString(),
      };
      const updated = [newItem, ...load("myListItems", [])];
      persist("myListItems", updated);
      setItems(updated);
      return newItem;
    }
    const { data } = await supabase.from('items').insert({
      family_id: FAMILY_ID,
      name, qty, emoji,
      done: false,
      added_by: user?.user_metadata?.full_name || 'Someone',
    }).select().single();
    return data;
  }

  async function toggleItem(id, currentDone) {
    if (listType === "my") {
      const updated = load("myListItems", []).map(item =>
        item.id === id
          ? { ...item, done: !currentDone, done_by: !currentDone ? (user?.user_metadata?.full_name || 'Someone') : null }
          : item
      );
      persist("myListItems", updated);
      setItems(updated);
      return;
    }
    await supabase.from('items').update({
      done: !currentDone,
      done_by: !currentDone
        ? (user?.user_metadata?.full_name || 'Someone')
        : null,
    }).eq('id', id);
  }

  async function deleteItem(id) {
    if (listType === "my") {
      const updated = load("myListItems", []).filter(item => item.id !== id);
      persist("myListItems", updated);
      setItems(updated);
      return;
    }
    await supabase.from('items').delete().eq('id', id);
  }

  async function clearItems(historyLimit) {
    if (items.length === 0) return;
    if (listType === "my") {
      const currentItems = load("myListItems", []);
      const entry = {
        id: `hist-${Date.now()}`,
        date: new Date().toLocaleDateString('en-GB',
          { day: 'numeric', month: 'short', year: 'numeric' }),
        items: currentItems,
        saved_by: user?.user_metadata?.full_name || 'Someone',
        created_at: new Date().toISOString(),
      };
      const updatedHistory = [entry, ...load("myListHistory", [])].slice(0, historyLimit);
      persist("myListHistory", updatedHistory);
      persist("myListItems", []);
      setHistory(updatedHistory);
      setItems([]);
      return;
    }
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
    if (listType === "my") {
      const restoredItems = entry.items.map((item, i) => ({
        id: `my-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 5)}`,
        name: item.name,
        qty: item.qty || '',
        emoji: item.emoji || '🛒',
        done: false,
        added_by: user?.user_metadata?.full_name || 'Someone',
        created_at: new Date().toISOString(),
      }));
      persist("myListItems", restoredItems);
      setItems(restoredItems);
      return;
    }
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

  async function addItemToFamily(name, qty = '', emoji = '🛒') {
    const { data } = await supabase.from('items').insert({
      family_id: FAMILY_ID,
      name, qty, emoji,
      done: false,
      added_by: user?.user_metadata?.full_name || 'Someone',
    }).select().single();
    return data;
  }

  const login = () => supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  });

  const logout = () => supabase.auth.signOut();

  return {
    user, loading, items, history,
    addItem, toggleItem, deleteItem,
    clearItems, restoreHistory, addItemToFamily,
    login, logout
  };
}
