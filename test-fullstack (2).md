# Senior Developer Hiring Test — Fullstack Track (C# + JavaScript)

**Estimated Time: 1 – 1.5 hours**

## Instructions

- This test has three sections. Attempt all three.
- You may reference documentation (Microsoft Docs, MDN), but all code you submit must be your own.
- For the coding exercise, write both the backend (C#) and frontend (vanilla JavaScript) portions. Runnable code is preferred but not required — clear, well-structured code with comments is acceptable.
- Assume .NET 8 / ASP.NET Core for backend, plain ES2020+ JavaScript (no frameworks) for frontend.

---

## Section 1: Code Review (suggested time: 15–20 minutes)

Below are two files from a production application — a C# API controller and the vanilla JavaScript module that consumes it. Review **both** and:

1. **Identify all bugs, security issues, and code quality problems in each file.** List each one with a brief explanation.
2. **Provide corrected versions** of both files.

### Backend (C#)

```csharp
[ApiController]
[Route("api/[controller]")]
public class ExpensesController : ControllerBase
{
    private readonly string _connString = "Server=db;Database=Finance;User=admin;Password=p@ssw0rd;";

    [HttpGet]
    public IActionResult GetAll(string userId)
    {
        using var conn = new provide(_connString);
        conn.Open();

        var cmd = new SqlCommand(
            $"SELECT * FROM Expenses WHERE UserId = '{userId}'", conn);
        var reader = cmd.ExecuteReader();

        var expenses = new List<Expense>();
        while (reader.Read())
            expenses.Add(new Expense
            {
                Id       = (int)reader["Id"],
                UserId   = reader["UserId"].ToString(),
                Amount   = (decimal)reader["Amount"],
                Category = reader["Category"].ToString(),
                Date     = (DateTime)reader["Date"]
            });

        return Ok(expenses);
    }

    [HttpPost]
    public IActionResult Create([FromBody] Expense expense)
    {
        expense.Date = DateTime.Now;

        using var conn = new SqlConnection(_connString);
        conn.Open();

        var cmd = new SqlCommand(
            $"INSERT INTO Expenses (UserId, Amount, Category, Date) " +
            $"VALUES ('{expense.UserId}', {expense.Amount}, '{expense.Category}', '{expense.Date}')",
            conn);
        cmd.ExecuteNonQuery();

        return Ok(expense);
    }
}
```

### Frontend (JavaScript)

```js
// expense-tracker.js
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
};
```

---

## Section 2: Coding Exercise (suggested time: 40–50 minutes)

### Task: Expense Tracker — Fullstack Feature

Implement the backend API and the vanilla JavaScript UI for a personal expense tracker.

**Do not modify the provided models, `DataStore` class, `api` client, or HTML scaffold.**

---

### Provided Backend Code (C#)

```csharp
// Models — do not modify
public record Expense(int Id, string UserId, string Category, decimal Amount, DateOnly Date);

public record CreateExpenseRequest(
    string  UserId,
    string  Category,
    decimal Amount,
    DateOnly Date);

// In-memory store — do not modify
public static class DataStore
{
    private static readonly object _lock = new();

    public static readonly List<Expense> Expenses = new()
    {
        new(1,  "user-1", "Food",          12.50m, new DateOnly(2025, 1,  5)),
        new(2,  "user-1", "Transport",     35.00m, new DateOnly(2025, 1,  7)),
        new(3,  "user-2", "Food",          22.00m, new DateOnly(2025, 1,  8)),
        new(4,  "user-1", "Entertainment", 60.00m, new DateOnly(2025, 1, 10)),
        new(5,  "user-2", "Transport",     15.00m, new DateOnly(2025, 1, 12)),
        new(6,  "user-1", "Food",          18.75m, new DateOnly(2025, 1, 15)),
        new(7,  "user-1", "Utilities",    120.00m, new DateOnly(2025, 1, 18)),
        new(8,  "user-2", "Entertainment", 45.00m, new DateOnly(2025, 1, 20)),
        new(9,  "user-1", "Food",           9.99m, new DateOnly(2025, 1, 22)),
        new(10, "user-2", "Food",          30.00m, new DateOnly(2025, 1, 25)),
    };

    private static int _nextId = 11;
    public static int NextId() { lock (_lock) { return _nextId++; } }
}
```

### Backend Requirements

Implement `ExpensesController` with the following three endpoints:

---

**`GET /api/expenses`**

- Required query param: `userId` — return `400` if missing or empty.
- Optional query params:
  - `category` — filter by category (case-insensitive)
  - `startDate` / `endDate` (DateOnly) — filter by date range (inclusive)
- Returns matching expenses sorted by date **descending**.

---

**`POST /api/expenses`**

- Creates a new expense from `CreateExpenseRequest`.
- **Validation rules:**
  - `UserId`: required
  - `Category`: required
  - `Amount`: must be greater than `0`
  - `Date`: cannot be in the future
- Returns `201 Created` with the new expense in the response body.
- Returns `400 Bad Request` with a meaningful error message if validation fails.

---

**`GET /api/expenses/summary`**

- Required query param: `userId` — return `400` if missing.
- Returns totals grouped by category and a grand total, e.g.:

```json
{
  "totals": {
    "Food": 41.24,
    "Transport": 35.00,
    "Utilities": 120.00
  },
  "grandTotal": 196.24
}
```

---

### Provided Frontend Code

#### HTML Scaffold — `index.html` (do not modify)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Expense Tracker</title>
</head>
<body>
  <h1>Expense Tracker</h1>

  <section id="filters">
    <select id="category-filter"><option value="">All Categories</option></select>
    <label>From: <input type="date" id="start-date" /></label>
    <label>To:   <input type="date" id="end-date"   /></label>
  </section>

  <div id="status"></div>

  <div id="layout">
    <section id="expense-panel">
      <h2>Expenses</h2>
      <ul id="expense-list"></ul>
    </section>

    <section id="summary-panel">
      <h2>Summary</h2>
      <div id="summary-content"></div>
    </section>
  </div>

  <section id="form-section">
    <h2>Add Expense</h2>
    <form id="add-form">
      <div>
        <label>Category <input type="text"   id="category-input" /></label>
        <span id="category-error"></span>
      </div>
      <div>
        <label>Amount   <input type="number" id="amount-input" step="0.01" /></label>
        <span id="amount-error"></span>
      </div>
      <div>
        <label>Date     <input type="date"   id="date-input" /></label>
        <span id="date-error"></span>
      </div>
      <div id="form-api-error"></div>
      <button type="submit">Add Expense</button>
    </form>
  </section>

  <script src="app.js"></script>
</body>
</html>
```

#### API Client — `api` object (do not modify)

```js
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
```

### Frontend Requirements

Implement `expenseTracker` in `app.js` and call `expenseTracker.init('user-1')` on `DOMContentLoaded`.

All DOM interaction must target the element IDs defined in the HTML scaffold.

---

**Initialization**

- On `init`, load the expense list and summary **in parallel**.
- Attach change listeners to `#category-filter`, `#start-date`, and `#end-date` so any change re-fetches the expense list.

---

**Expense List**

- Render each expense in `#expense-list` showing: date, category, and amount.
- Populate `#category-filter` options dynamically from the data — do not hardcode category names; include "All Categories" as the default option.
- While a fetch is in-flight, show a loading message in `#status`; clear it on completion.
- If the fetch fails, show an error message in `#status` with a **Retry** button that re-triggers the load.

---

**Add Expense Form**

- On submit, validate inputs client-side **before** calling the API, matching the server rules:
  - Category: required
  - Amount: must be a positive number
  - Date: cannot be in the future
- Display per-field error messages in the corresponding `#*-error` spans.
- On a successful POST, append the new expense to `#expense-list` without refetching the full list, and refresh the summary.
- If the API returns an error, display the message from the response in `#form-api-error`.
- On success, clear all errors and reset the form.

---

**Summary Panel**

- Fetch and render the summary in `#summary-content`, showing each category total and the grand total.
- Refresh the summary after every successful form submission.

---

### Constraints

- Plain JavaScript (ES2020+) — no frameworks, no libraries, no build tools.
- No global variables beyond the `api` client and `expenseTracker` object.
- Backend: no database, no EF Core, no external NuGet packages.

---

## Section 3: System Design Considerations (suggested time: 5–10 minutes)

Answer the following in writing. There is no single correct answer — explain your reasoning and trade-offs.

### Scenario

You are designing a multi-user saas web expense tracking application for small companies up through enterprise sized companies. The requirements are:

- Each employee can log and view their own expenses.
- Managers can view and approve or reject expenses for their direct reports.
- The Finance teams can view all expenses across their organizational units or possibly the whole company and run reports.
- Expenses can have an attached receipt image (photo or PDF), and may need custom fields or tags.

**Address the following:**

1. Identity the key risks related to such an application and a brief description on possible ways to mitigate those risks.
2. Briefly describe a likely tech stack that you would envision would be needed to support this application.
