using Microsoft.AspNetCore.Mvc;

public record TotalReport(
    Dictionary<string, decimal> totals,
    decimal grandTotal
);

[ApiController]
[Route("api/[controller]")]
public class ExpensesController : ControllerBase
{

    [HttpGet]
    public IActionResult FindMatchingExpense([FromQuery] string? userId, [FromQuery] string? category, [FromQuery] DateOnly? startDate, [FromQuery] DateOnly? endDate)
    {
        // This wouldn't narrow the type, and I know there is a better way, but for the time being instead of looking
        // into the doc I'll leave it as is. 
        if (userId == null)
        {
            return BadRequest("UserId not found");
        }

        List<Expense> expenses = DataStore.Expenses;
        List<Expense> matchingExpenses = expenses.FindAll(expense =>
        {
            return expense.UserId == userId
            && (category == null || expense.Category == category)
            && (startDate == null || expense.Date.CompareTo(startDate) >= 0)
            && (endDate == null || expense.Date.CompareTo(endDate) <= 0);
        });
        matchingExpenses.Sort(delegate (Expense expenseA, Expense expenseB)
        {
            return expenseB.Date.CompareTo(expenseA.Date);
        });

        return Ok(matchingExpenses);
    }

    [HttpPost]
    public IActionResult CreateNewExpense([FromBody] CreateExpenseRequest newExpense)
    {
        if (newExpense.UserId == null)
        {
            return BadRequest("UserId not found");
        }

        if (newExpense.Category == null)
        {
            return BadRequest("Category not found");
        }

        if (newExpense.Amount < 0)
        {
            return BadRequest("Invalid value for Amount. Amount has to be greater than 0. Amount: " + newExpense.Amount);
        } 

        DateTime now = DateTime.Now;
        if (DateOnly.FromDateTime(now).CompareTo(newExpense.Date) > 0)
        {
            return BadRequest("Invalid Date. Date cannot be later than " + now + ". Given that is " + newExpense.Date);
        }

        try
        {
            DataStore.Expenses.Add(new Expense(DataStore.Expenses.Count,newExpense.UserId, newExpense.Category, newExpense.Amount, newExpense.Date));
        }
        catch (Exception ex)
        {
            return Problem("Unknown exception occurred." + ex.Message);
        }
        

        // There is most likely a better way than to hardcode this, but for the time being leaving as is. 
        return Created("api/expenses", newExpense);
    }

    [HttpGet]
    [Route("summary")]
    public IActionResult CreateSummary([FromQuery] string? userId) 
    {
        if(userId == null)
        {
            return BadRequest("UserId not found");
        }

        List<Expense> expenses = DataStore.Expenses;

        Dictionary<string, decimal> totals = [];
        decimal grandTotal = 0;

        List<Expense> matchingExpenses = expenses.FindAll(expense => expense.UserId == userId);
        matchingExpenses.ForEach(expense =>
        {
            totals.TryGetValue(expense.Category, out decimal categoryAmount);
            totals[expense.Category] = categoryAmount + expense.Amount;
            grandTotal += expense.Amount;
        });
        TotalReport report = new(totals, grandTotal);
        return Ok(report);
    }

}