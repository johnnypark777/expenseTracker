// expense-tracker.js


// Question: Why is everything wrapped into a const? Is this some sort of deliberate design choice?
// Suggestion: Is this a way to make a class? Why choose const over class? Let's use class, since I find it
// easier to grasp what's going on.
// If it's to get around the "this problem", then we can just use () => {} instead of function(){}

class ExpenseTracker {
  userId = null;
  // Suggestion: I suggest removing this class variable and pass into the renderExpenses
  // Resolved: Looking at the code, looks we need this for caching. A comment explaining this would be nice.
  expenses = [];

  // Suggestion: Best practice to just use declare and define methods before calling that method
  // Praise: good naming
  renderExpenses(data) {
    const list = document.getElementById('expense-list');
    list.innerHTML = '';
    data.forEach(expense => {
      // Question (I'll call this Question A): Have you looked the best practices of vanillaJS on modifying the html? 
      // I'll have to double check, but I don't think hardcoding tags into the HTML is best practice, it can be
      // quite confusing since part of the html tags now lives in the javascript file 
      const item = document.createElement('li');
      item.innerHTML = `<b>${expense.category}</b>: $${expense.amount} — ${expense.date}`;
      list.appendChild(item);
    });
  }

  addExpense() {
    const category = document.getElementById('category-input').value;
    const amount = document.getElementById('amount-input').value;
    const date = document.getElementById('date-input').value;
    fetch('/api/expenses', {
      method: 'POST',
      body: JSON.stringify({ userId: this.userId, category, amount, date }),
    })
    // Suggestion (I'll call this suggestion B): I prefer making direct use of await/async promises instead of calling ".then(..)"
    // const res = await fetch('api/expenses)...;
    // const newExpense = await res.json();
      .then(res => res.json())
      .then(newExpense => {
        this.expenses.push(newExpense);
        this.renderExpenses();
        this.loadSummary();
        document.getElementById('add-form').reset();
      });
  }

  loadExpenses() {
    const category = document.getElementById('category-filter').value;
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    fetch(`/api/expenses?userId=${this.userId}&category=${category}&startDate=${startDate}&endDate=${endDate}`)
      // Suggestion ("lets call this suggestion A"): It may be redundant but method: 'GET' would be nice to have consistency in style
      .then(res => res.json())
      // suggestion B applies here
      .then(data => {
        // Suggestion: Instead of modifying the class variable, we can just directly pass in the parameter (and maybe return the data (TODO: double check this))
        // For example: return data;
        this.expenses = data;
        this.renderExpenses(data);
      });
  }

  loadSummary() {
    // Question: Has this loadSummary been tested called? When I look at the backend code, it doesn't seem to have that API written.
    // Perhaps there is a API defined, it's just not modified in this PR since this is a snippet
    // I'll assume it works and has been tested
    fetch(`/api/expenses/summary?userId=${this.userId}`)
    // suggestion A applies here as well
      .then(res => res.json())
      .then(data => {
        const container = document.getElementById('summary-content');
        // Question A applies here as well. There is probably a better to modify a value of html output rather than
        // accessing it through "innerHTML". Like getElementById is one way. 
        container.innerHTML = '';
        Object.entries(data.totals).forEach(([cat, total]) => {
          container.innerHTML += `<p>${cat}: $${total.toFixed(2)}</p>`;
        });
        container.innerHTML += `<strong>Total: $${data.grandTotal.toFixed(2)}</strong>`;
      });
  }

  init(userId) {
    this.userId = userId;
    document.getElementById('add-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.addExpense();
    });
    // Nitpick: make this () => {this.loadExpenses()} into a helper function to save some lines
    document.getElementById('category-filter').addEventListener('change', () => {
      this.loadExpenses();
    });
    document.getElementById('start-date').addEventListener('change', () => {
      this.loadExpenses();
    });
    document.getElementById('end-date').addEventListener('change', () => {
      this.loadExpenses();
    });

    this.loadExpenses();
    this.loadSummary();
  }
}

const expenseTracker = {
  userId: null,
  expenses: [],
  init(userId) {
    this.userId = userId;
    document.getElementById('add-form').addEventListener('submit', function(e) {
      e.preventDefault();
      expenseTracker.addExpense();
    });
    document.getElementById('category-filter').addEventListener('change', function() {
      expenseTracker.loadExpenses();
    });
    document.getElementById('start-date').addEventListener('change', function() {
      expenseTracker.loadExpenses();
    });
    document.getElementById('end-date').addEventListener('change', function() {
      expenseTracker.loadExpenses();
    });
    this.loadExpenses();
    this.loadSummary();
  },
  loadExpenses() {
    const category  = document.getElementById('category-filter').value;
    const startDate = document.getElementById('start-date').value;
    const endDate   = document.getElementById('end-date').value;
    fetch(`/api/expenses?userId=${this.userId}&category=${category}&startDate=${startDate}&endDate=${endDate}`)
      .then(res => res.json())
      .then(data => {
        this.expenses = data;
        this.renderExpenses();
      });
  },
  addExpense() {
    const category = document.getElementById('category-input').value;
    const amount   = document.getElementById('amount-input').value;
    const date     = document.getElementById('date-input').value;
    fetch('/api/expenses', {
      method: 'POST',
      body: JSON.stringify({ userId: this.userId, category, amount, date }),
    })
      .then(res => res.json())
      .then(newExpense => {
        this.expenses.push(newExpense);
        this.renderExpenses();
        this.loadSummary();
        document.getElementById('add-form').reset();
      });
  },
  renderExpenses() {
    const list = document.getElementById('expense-list');
    list.innerHTML = '';
    this.expenses.forEach(expense => {
      const item = document.createElement('li');
      item.innerHTML = `<b>${expense.category}</b>: $${expense.amount} — ${expense.date}`;
      list.appendChild(item);
    });
  },
  loadSummary() {
    fetch(`/api/expenses/summary?userId=${this.userId}`)
      .then(res => res.json())
      .then(data => {
        const container = document.getElementById('summary-content');
        container.innerHTML = '';
        Object.entries(data.totals).forEach(([cat, total]) => {
          container.innerHTML += `<p>${cat}: $${total.toFixed(2)}</p>`;
        });
        container.innerHTML += `<strong>Total: $${data.grandTotal.toFixed(2)}</strong>`;
      });
  }
}