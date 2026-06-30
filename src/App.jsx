import React, { useState, useEffect, useRef, useMemo, useReducer } from 'react';
import { HashRouter, Routes, Route, Link, NavLink, useNavigate, useParams, Navigate } from 'react-router-dom';

const COLLECTION = 'expenses';

function useExpenses() {
  const [records, setRecords] = useState([]);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const saved = localStorage.getItem(COLLECTION);
    if (saved) {
      try { setRecords(JSON.parse(saved)); } catch(e) { /* ignore */ }
    }
    const apiBase = window.API_BASE;
    if (apiBase) {
      fetch(apiBase + '/api/store/' + COLLECTION)
        .then(r => r.json())
        .then(data => {
          if (isMounted.current && Array.isArray(data)) {
            setRecords(data);
            localStorage.setItem(COLLECTION, JSON.stringify(data));
          }
        })
        .catch(() => {});
    }
    return () => { isMounted.current = false; };
  }, []);

  const persist = (updated) => {
    setRecords(updated);
    localStorage.setItem(COLLECTION, JSON.stringify(updated));
  };

  const addRecord = async (fields) => {
    const apiBase = window.API_BASE;
    const tempId = 'temp_' + Date.now() + '_' + Math.random().toString(36).slice(2);
    const newRec = { id: tempId, ...fields };
    const updated = [...records, newRec];
    persist(updated);
    if (apiBase) {
      try {
        const res = await fetch(apiBase + '/api/store/' + COLLECTION, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: fields })
        });
        const saved = await res.json();
        if (isMounted.current) {
          const final = updated.map(r => r.id === tempId ? saved : r);
          persist(final);
        }
      } catch(e) { /* fallback to local */ }
    }
  };

  const updateRecord = async (id, fields) => {
    const updated = records.map(r => r.id === id ? { ...r, ...fields } : r);
    persist(updated);
    const apiBase = window.API_BASE;
    if (apiBase) {
      try {
        await fetch(apiBase + '/api/store/' + COLLECTION + '/' + id, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: updated.find(r => r.id === id) })
        });
      } catch(e) { /* fallback to local */ }
    }
  };

  const deleteRecord = async (id) => {
    const updated = records.filter(r => r.id !== id);
    persist(updated);
    const apiBase = window.API_BASE;
    if (apiBase) {
      try {
        await fetch(apiBase + '/api/store/' + COLLECTION + '/' + id, { method: 'DELETE' });
      } catch(e) { /* fallback to local */ }
    }
  };

  return { records, addRecord, updateRecord, deleteRecord };
}

function TopBar() {
  return (
    <header className="topbar">
      <div className="container row">
        <Link to="/" className="nav brand">💰 Expense Tracker</Link>
        <nav className="nav">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'nav link active' : 'nav link'}>Dashboard</NavLink>
          <NavLink to="/add" className={({ isActive }) => isActive ? 'nav link active' : 'nav link'}>Add Expense</NavLink>
          <NavLink to="/history" className={({ isActive }) => isActive ? 'nav link active' : 'nav link'}>History</NavLink>
        </nav>
      </div>
    </header>
  );
}

function StatCard({ label, value, className }) {
  return (
    <div className={`card stat box ${className || ''}`}>
      <span className="muted label">{label}</span>
      <span className="stat value">{value}</span>
    </div>
  );
}

function Dashboard({ records }) {
  const total = useMemo(() => records.reduce((s, r) => s + (Number(r.amount) || 0), 0), [records]);
  const thisMonth = useMemo(() => {
    const now = new Date();
    return records.filter(r => {
      const d = new Date(r.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((s, r) => s + (Number(r.amount) || 0), 0);
  }, [records]);
  const recent = useMemo(() => [...records].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5), [records]);

  const catTotals = useMemo(() => {
    const map = {};
    records.forEach(r => {
      const c = r.category || 'Other';
      map[c] = (map[c] || 0) + (Number(r.amount) || 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [records]);

  const maxCatTotal = Math.max(...catTotals.map(c => c[1]), 1);

  return (
    <div className="container">
      <div className="hero">
        <h1>Dashboard</h1>
        <p className="muted">Your expense overview at a glance</p>
      </div>
      <div className="grid stats">
        <StatCard label="Total Expenses" value={`$${total.toFixed(2)}`} className="primary" />
        <StatCard label="This Month" value={`$${thisMonth.toFixed(2)}`} />
        <StatCard label="Transactions" value={records.length} />
      </div>
      <div className="grid two-col">
        <div className="card">
          <h2 className="card title">Recent Expenses</h2>
          {recent.length === 0 && <p className="muted center">No expenses yet. <Link to="/add">Add one</Link></p>}
          <ul className="list">
            {recent.map(r => (
              <li key={r.id} className="list-item row">
                <img className="avatar rec" src={`https://loremflickr.com/80/80/${r.category || 'money'}?lock=${r.id.length}`} alt="" onError={e => { e.target.src = `https://picsum.photos/seed/${r.id}/80/80`; }} />
                <div className="rec info">
                  <strong>{r.description || 'Untitled'}</strong>
                  <span className="muted">{r.category} · {new Date(r.date).toLocaleDateString()}</span>
                </div>
                <span className="badge pill">${Number(r.amount).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h2 className="card title">By Category</h2>
          {catTotals.length === 0 && <p className="muted center">No data yet</p>}
          <ul className="list">
            {catTotals.map(([cat, val]) => (
              <li key={cat} className="list-item">
                <div className="row">
                  <strong>{cat}</strong>
                  <span className="muted">${val.toFixed(2)}</span>
                </div>
                <div className="bar track">
                  <div className="bar fill" style={{ width: `${(val / maxCatTotal) * 100}%` }}></div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function ExpenseForm({ initialData, onSubmit, onCancel }) {
  const [desc, setDesc] = useState(initialData?.description || '');
  const [amount, setAmount] = useState(initialData?.amount || '');
  const [category, setCategory] = useState(initialData?.category || 'Food');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Other'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!desc.trim() || !amount) return;
    onSubmit({ description: desc.trim(), amount: parseFloat(amount), category, date });
  };

  return (
    <form className="card" onSubmit={handleSubmit}>
      <div className="field">
        <label className="label" htmlFor="desc">Description</label>
        <input id="desc" className="input" type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. Groceries" required />
      </div>
      <div className="field">
        <label className="label" htmlFor="amount">Amount ($)</label>
        <input id="amount" className="input" type="number" step="0.01" min="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required />
      </div>
      <div className="field">
        <label className="label" htmlFor="cat">Category</label>
        <select id="cat" className="input" value={category} onChange={e => setCategory(e.target.value)}>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="field">
        <label className="label" htmlFor="date">Date</label>
        <input id="date" className="input" type="date" value={date} onChange={e => setDate(e.target.value)} required />
      </div>
      <div className="row actions">
        <button type="submit" className="btn btn-primary">Save Expense</button>
        {onCancel && <button type="button" className="btn" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}

function AddExpense({ addRecord }) {
  const navigate = useNavigate();
  const handleAdd = async (fields) => {
    await addRecord(fields);
    navigate('/');
  };
  return (
    <div className="container center">
      <div className="hero">
        <h1>Add Expense</h1>
        <p className="muted">Record a new transaction</p>
      </div>
      <div className="wrap narrow">
        <ExpenseForm onSubmit={handleAdd} />
      </div>
    </div>
  );
}

function EditExpense({ records, updateRecord }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const record = records.find(r => r.id === id);
  if (!record) return <Navigate to="/history" replace />;
  const handleUpdate = async (fields) => {
    await updateRecord(id, fields);
    navigate('/history');
  };
  return (
    <div className="container center">
      <div className="hero">
        <h1>Edit Expense</h1>
        <p className="muted">Modify transaction details</p>
      </div>
      <div className="wrap narrow">
        <ExpenseForm initialData={record} onSubmit={handleUpdate} onCancel={() => navigate('/history')} />
      </div>
    </div>
  );
}

function History({ records, deleteRecord }) {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const categories = ['All', 'Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Other'];

  const filtered = useMemo(() => {
    let items = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (filter !== 'All') items = items.filter(r => r.category === filter);
    if (search.trim()) {
      const s = search.toLowerCase();
      items = items.filter(r => (r.description || '').toLowerCase().includes(s));
    }
    return items;
  }, [records, filter, search]);

  const handleDelete = async (id) => {
    if (window.confirm('Delete this expense?')) {
      await deleteRecord(id);
    }
  };

  return (
    <div className="container">
      <div className="hero">
        <h1>History</h1>
        <p className="muted">All your past transactions</p>
      </div>
      <div className="card filters">
        <div className="row wrap">
          {categories.map(c => (
            <button key={c} className={`btn pill ${filter === c ? 'btn-primary active' : ''}`} onClick={() => setFilter(c)}>{c}</button>
          ))}
        </div>
        <div className="field">
          <input className="input" type="text" placeholder="Search expenses..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      {filtered.length === 0 && <div className="card center muted">No expenses found</div>}
      <ul className="list">
        {filtered.map(r => (
          <li key={r.id} className="card list-item row">
            <img className="avatar rec" src={`https://loremflickr.com/100/100/${r.category || 'money'}?lock=${r.id.length}`} alt="" onError={e => { e.target.src = `https://picsum.photos/seed/${r.id}/100/100`; }} />
            <div className="rec info">
              <strong>{r.description || 'Untitled'}</strong>
              <span className="muted">{r.category} · {new Date(r.date).toLocaleDateString()}</span>
            </div>
            <span className="badge pill">${Number(r.amount).toFixed(2)}</span>
            <div className="row actions">
              <Link to={`/edit/${r.id}`} className="btn btn-primary">Edit</Link>
              <button className="btn danger" onClick={() => handleDelete(r.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function App() {
  const { records, addRecord, updateRecord, deleteRecord } = useExpenses();

  return (
    <HashRouter>
      <div className="app">
        <TopBar />
        <main className="container wrap">
          <Routes>
            <Route path="/" element={<Dashboard records={records} />} />
            <Route path="/add" element={<AddExpense addRecord={addRecord} />} />
            <Route path="/history" element={<History records={records} deleteRecord={deleteRecord} />} />
            <Route path="/edit/:id" element={<EditExpense records={records} updateRecord={updateRecord} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}