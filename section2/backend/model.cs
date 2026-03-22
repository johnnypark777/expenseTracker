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