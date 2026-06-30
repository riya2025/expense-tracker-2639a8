import React, { useState, useEffect } from 'react';
import { BrowserRouter, BrowserRouter as Router, Link, Navigate, Route, Routes } from 'react-router-dom';

export default function App() {
  const [expenses, setExpenses] = useState(() => {
    try {
      const saved = localStorage.getItem('expenses');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterCategory, setFilterCategory] = useState('All');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }, [expenses]);

  const categories = ['Food', 'Transport', 'Entertainment', 'Utilities', 'Health', 'Other'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description.trim() || !amount) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    if (editingId !== null) {
      setExpenses(expenses.map(exp => 
        exp.id === editingId 
          ? { ...exp, description: description.trim(), amount: numAmount, category, date }
          : exp
      ));
      setEditingId(null);
    } else {
      const newExpense = {
        id: Date.now(),
        description: description.trim(),
        amount: numAmount,
        category,
        date
      };
      setExpenses([newExpense, ...expenses]);
    }

    setDescription('');
    setAmount('');
    setCategory('Food');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const handleEdit = (expense) => {
    setEditingId(expense.id);
    setDescription(expense.description);
    setAmount(expense.amount.toString());
    setCategory(expense.category);
    setDate(expense.date);
  };

  const handleDelete = (id) => {
    setExpenses(expenses.filter(exp => exp.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setDescription('');
      setAmount('');
      setCategory('Food');
      setDate(new Date().toISOString().split('T')[0]);
    }
  };

  const filteredExpenses = filterCategory === 'All'
    ? expenses
    : expenses.filter(exp => exp.category === filterCategory);

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  const categoryTotals = categories.map(cat => ({
    category: cat,
    total: expenses.filter(exp => exp.category === cat).reduce((sum, exp) => sum + exp.amount, 0)
  })).filter(ct => ct.total > 0);

  const maxCategoryTotal = Math.max(...categoryTotals.map(ct => ct.total), 1);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const styles = {
    container: {
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#333'
    },
    header: {
      textAlign: 'center',
      marginBottom: '30px',
      color: '#2c3e50'
    },
    card: {
      backgroundColor: '#fff',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    },
    form: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '12px'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column'
    },
    label: {
      marginBottom: '4px',
      fontWeight: '600',
      fontSize: '14px',
      color: '#555'
    },
    input: {
      padding: '10px 12px',
      borderRadius: '8px',
      border: '1px solid #ddd',
      fontSize: '14px',
      outline: 'none',
      transition: 'border-color 0.2s'
    },
    button: {
      padding: '10px 20px',
      borderRadius: '8px',
      border: 'none',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'background-color 0.2s, transform 0.1s'
    },
    primaryButton: {
      backgroundColor: '#3498db',
      color: '#fff',
      gridColumn: '1 / -1'
    },
    dangerButton: {
      backgroundColor: '#e74c3c',
      color: '#fff',
      padding: '6px 12px',
      fontSize: '12px'
    },
    editButton: {
      backgroundColor: '#f39c12',
      color: '#fff',
      padding: '6px 12px',
      fontSize: '12px',
      marginRight: '6px'
    },
    cancelButton: {
      backgroundColor: '#95a5a6',
      color: '#fff',
      gridColumn: '1 / -1'
    },
    summary: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '20px'
    },
    summaryCard: {
      backgroundColor: '#fff',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      textAlign: 'center'
    },
    summaryAmount: {
      fontSize: '28px',
      fontWeight: '700',
      margin: '8px 0 4px'
    },
    summaryLabel: {
      fontSize: '14px',
      color: '#777'
    },
    filterRow: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
      marginBottom: '16px'
    },
    filterButton: {
      padding: '6px 14px',
      borderRadius: '20px',
      border: '1px solid #ddd',
      backgroundColor: '#fff',
      cursor: 'pointer',
      fontSize: '13px',
      transition: 'all 0.2s'
    },
    activeFilter: {
      backgroundColor: '#3498db',
      color: '#fff',
      border: '1px solid #3498db'
    },
    expenseItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '14px 0',
      borderBottom: '1px solid #eee'
    },
    expenseInfo: {
      flex: 1
    },
    expenseDesc: {
      fontWeight: '600',
      fontSize: '16px',
      marginBottom: '4px'
    },
    expenseMeta: {
      fontSize: '13px',
      color: '#888'
    },
    expenseAmount: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#e74c3c',
      marginRight: '12px'
    },
    categoryBadge: {
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '600',
      marginRight: '8px'
    },
    barChart: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      marginTop: '12px'
    },
    barRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    barLabel: {
      width: '100px',
      fontSize: '13px',
      textAlign: 'right',
      color: '#555'
    },
    barTrack: {
      flex: 1,
      height: '20px',
      backgroundColor: '#f0f0f0',
      borderRadius: '10px',
      overflow: 'hidden'
    },
    barFill: {
      height: '100%',
      borderRadius: '10px',
      transition: 'width 0.3s ease'
    },
    barValue: {
      width: '80px',
      fontSize: '13px',
      color: '#555'
    },
    emptyState: {
      textAlign: 'center',
      padding: '40px 20px',
      color: '#aaa'
    },
    nav: {
      display: 'flex',
      gap: '16px',
      justifyContent: 'center',
      marginBottom: '24px'
    },
    navLink: {
      textDecoration: 'none',
      padding: '8px 20px',
      borderRadius: '8px',
      color: '#555',
      fontWeight: '600',
      transition: 'all 0.2s'
    },
    activeNavLink: {
      backgroundColor: '#3498db',
      color: '#fff'
    }
  };

  const getCategoryColor = (cat) => {
    const colors = {
      Food: '#e74c3c',
      Transport: '#3498db',
      Entertainment: '#9b59b6',
      Utilities: '#f39c12',
      Health: '#2ecc71',
      Other: '#95a5a6'
    };
    return colors[cat] || '#95a5a6';
  };

  function Dashboard() {
    return (
      <div>
        {/* Summary Cards */}
        <div style={styles.summary}>
          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>Total Expenses</div>
            <div style={{ ...styles.summaryAmount, color: '#e74c3c' }}>{formatCurrency(totalExpenses)}</div>
            <div style={styles.summaryLabel}>{filteredExpenses.length} transaction{filteredExpenses.length !== 1 ? 's' : ''}</div>
          </div>
          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>Average per Transaction</div>
            <div style={{ ...styles.summaryAmount, color: '#f39c12' }}>
              {formatCurrency(filteredExpenses.length > 0 ? totalExpenses / filteredExpenses.length : 0)}
            </div>
            <div style={styles.summaryLabel}>per transaction</div>
          </div>
          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>Highest Single Expense</div>
            <div style={{ ...styles.summaryAmount, color: '#9b59b6' }}>
              {formatCurrency(filteredExpenses.length > 0 ? Math.max(...filteredExpenses.map(e => e.amount)) : 0)}
            </div>
            <div style={styles.summaryLabel}>max amount</div>
          </div>
        </div>

        {/* Category Breakdown */}
        {categoryTotals.length > 0 && (
          <div style={styles.card}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#2c3e50' }}>Category Breakdown</h3>
            <div style={styles.barChart}>
              {categoryTotals.map(ct => (
                <div key={ct.category} style={styles.barRow}>
                  <span style={styles.barLabel}>{ct.category}</span>
                  <div style={styles.barTrack}>
                    <div style={{
                      ...styles.barFill,
                      width: `${(ct.total / maxCategoryTotal) * 100}%`,
                      backgroundColor: getCategoryColor(ct.category)
                    }} />
                  </div>
                  <span style={styles.barValue}>{formatCurrency(ct.total)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  function AddExpense() {
    return (
      <div style={styles.card}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#2c3e50' }}>
          {editingId ? 'Edit Expense' : 'Add New Expense'}
        </h3>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <input
              style={styles.input}
              type="text"
              placeholder="e.g., Grocery shopping"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Amount ($)</label>
            <input
              style={styles.input}
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Category</label>
            <select
              style={styles.input}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Date</label>
            <input
              style={styles.input}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            style={{
              ...styles.button,
              ...styles.primaryButton,
              padding: '12px'
            }}
          >
            {editingId ? 'Update Expense' : 'Add Expense'}
          </button>
          {editingId && (
            <button
              type="button"
              style={{
                ...styles.button,
                ...styles.cancelButton,
                padding: '12px'
              }}
              onClick={() => {
                setEditingId(null);
                setDescription('');
                setAmount('');
                setCategory('Food');
                setDate(new Date().toISOString().split('T')[0]);
              }}
            >
              Cancel Editing
            </button>
          )}
        </form>
      </div>
    );
  }

  function ExpenseList() {
    return (
      <div style={styles.card}>
        <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#2c3e50' }}>Expenses</h3>

        {/* Filter Buttons */}
        <div style={styles.filterRow}>
          <button
            style={{
              ...styles.filterButton,
              ...(filterCategory === 'All' ? styles.activeFilter : {})
            }}
            onClick={() => setFilterCategory('All')}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              style={{
                ...styles.filterButton,
                ...(filterCategory === cat ? styles.activeFilter : {})
              }}
              onClick={() => setFilterCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Expense Items */}
        {filteredExpenses.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={{ fontSize: '40px', margin: '0 0 8px' }}>📭</p>
            <p>No expenses found. Add your first expense!</p>
          </div>
        ) : (
          filteredExpenses.map(expense => (
            <div key={expense.id} style={styles.expenseItem}>
              <div style={styles.expenseInfo}>
                <div style={styles.expenseDesc}>
                  <span
                    style={{
                      ...styles.categoryBadge,
                      backgroundColor: getCategoryColor(expense.category),
                      color: '#fff'
                    }}
                  >
                    {expense.category}
                  </span>
                  {expense.description}
                </div>
                <div style={styles.expenseMeta}>{expense.date}</div>
              </div>
              <div style={styles.expenseAmount}>{formatCurrency(expense.amount)}</div>
              <div>
                <button
                  style={{ ...styles.button, ...styles.editButton }}
                  onClick={() => handleEdit(expense)}
                >
                  Edit
                </button>
                <button
                  style={{ ...styles.button, ...styles.dangerButton }}
                  onClick={() => handleDelete(expense.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <Router>
      <div style={styles.container}>
        <h1 style={styles.header}>💰 Expense Tracker</h1>

        {/* Navigation */}
        <nav style={styles.nav}>
          <Link
            to="/"
            style={styles.navLink}
            activeStyle={styles.activeNavLink}
          >
            Dashboard
          </Link>
          <Link
            to="/add"
            style={styles.navLink}
            activeStyle={styles.activeNavLink}
          >
            Add Expense
          </Link>
          <Link
            to="/list"
            style={styles.navLink}
            activeStyle={styles.activeNavLink}
          >
            Expenses
          </Link>
        </nav>

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/add" element={<AddExpense />} />
          <Route path="/list" element={<ExpenseList />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}