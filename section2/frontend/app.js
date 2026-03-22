// Paste this at the top of app.js — do not modify
const api = {
  getExpenses: (userId, filters = {}) => {
    const params = new URLSearchParams(
      Object.fromEntries(Object.entries({ userId, ...filters }).filter(([, v]) => v !== ''))
    );
    return fetch(`/api/expenses?${params}`).then(r => {
      if (!r.ok) throw new Error('Failed to load expenses');
      return r.json();
    });
  },

  createExpense: (data) =>
    fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => {
      if (!r.ok) return r.json().then(e => { throw new Error(e.message); });
      return r.json();
    }),

  getSummary: (userId) =>
    fetch(`/api/expenses/summary?userId=${userId}`).then(r => r.json()),
};

const expenseTracker = {
  userId: null,
  // Caching expenses here so that we don't need to call getExpenses API when reloading expenses after adding a new expense.
  cachedExpenses: [],

  async init(userId) {
    this.userId = userId;

    document.getElementById('category-filter').addEventListener('change', async () => {
      await expenseTracker.loadExpenses();
    });
    document.getElementById('start-date').addEventListener('change', async () => {
      await expenseTracker.loadExpenses();
    });
    document.getElementById('end-date').addEventListener('change', async () => {
      await expenseTracker.loadExpenses();
    });

    document.getElementById('add-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await expenseTracker.addExpense();
    });

    //As per requirement loading expenses and summary in parallel
    await Promise.all([this.loadExpenses(), this.loadSummary()]);
  },

  // data is optional property for caching expenses
  renderExpenses(data) {
    const list = document.getElementById('expense-list');

    // Note: Using innerHTML is not ideal but for the time being going with it
    list.innerHTML = '';

    if (data === undefined) {
      data = this.cachedExpenses;
    }

    data.forEach(expense => {
      const item = document.createElement('li');
      item.innerHTML = `<b>${expense.category}</b>: $${expense.amount} — ${expense.date}`;
      list.appendChild(item);
    });
  },

  renderCategories(data) {
    const categoryOptions = document.getElementById('category-filter');
    data.forEach((expense) => {
      categoryOptions.innerHTML += `<option value=${expense.category}>${expense.category}</option>`;
    });
  },

  async loadExpenses() {
    const category = document.getElementById('category-filter').value;
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
   
    let data;

    const status = document.getElementById('status');

    try {
      const response = api.getExpenses(this.userId, { category, startDate, endDate });
      status.innerHTML = `<p> Loading... </p>`;
      await response;
      data = await response.json();
      this.cachedExpenses = data;
    } catch {
      
      status.innerHTML = `<p> Failed to get expenses. Please retry. </p>`;
      status.innerHTML += `<Button commandFor="retry" command="retryClicked" value=clicked>`
      document.getElementById('retry').addEventListener('retryClicked', async () => {
        await this.loadExpenses();
      });
    
    }

    status.innerHTML = '';
    
    this.renderExpenses(data);
    this.renderCategories(data);
  },
  
  async addExpense() {
    const category = document.getElementById('category-input').value;
    const amount = document.getElementById('amount-input').value;
    const date = document.getElementById('date-input').value;

    const categoryError = document.getElementById('category-error');
    const amountError = document.getElementById('amount-error');
    const dateError = document.getElementById('date-error');
    const formApiError = document.getElementById('form-api-error');

    if (category == null) {
      categoryError.innerHTML = '<p>Invalid category value</p>';
      return;
    }
    
    if (amount <= 0) {
      amountError.innerHTML = '<p>Invalid amount value. Please input a positive number</p>';
      return;
    } 
    
    if (date.valueAsNumber > Date.now()) {
      dateError.innerHTML = '<p>Invalid date value. Please input a date earlier than what is current time</p>';
      return;
    }
    categoryError.innerHTML = '';
    amountError.innerHTML = '';
    dateError.innerHTML = '';

    let newExpense;
    try {
      const response = await api.createExpense({ userId: this.userId, category, amount, date });
      newExpense = await response.json();
    } catch (err) {
      formApiError.innerHTML = `<p> Error occurred while submitting form. Error: ${JSON.stringify(err.message ?? err)}</p>`;
      return;
    }

    this.cachedExpenses.push(newExpense);
    // Not passing in a parameter to avoid calling getExpenses API.
    this.renderExpenses();
    await this.loadSummary();
    
    formApiError.innerHTML = '';
    document.getElementById('add-form').reset();
  },

  async loadSummary() {
    const response = await api.getSummary(this.userId);
    const data = await response.json();
    const container = document.getElementById('summary-content');
    container.innerHTML = '';
    Object.entries(data.totals).forEach(([cat, total]) => {
      container.innerHTML += `<p>${cat}: $${total.toFixed(2)}</p>`;
    });
    container.innerHTML += `<strong>Total: $${data.grandTotal.toFixed(2)}</strong>`;
  }
}
