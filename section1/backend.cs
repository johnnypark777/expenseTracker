//note
//remark
//praise
//issue
//Question: where is using? Centralized import or maybe this is a snippet?

[ApiController]
[Route("api/[controller]")]

// Praise: I like of use of MVC architecture and isolate all the API server URL handling into a concept called "controller"
// Also like the name!
public class ExpensesController : ControllerBase
{
    // Issue: We should never put account and password details in the code. 
    // Another issue (Let's call it Issue A): To adhere the single responsibility principle, I strongly to recommend to take out the database connection stuff and
    // put it into a "database service". And for some reason that doesn't exist then I think we should add that as part of this PR.
    // This also avoids having this endpoint fail due to a database failure. 

    private readonly string _connString = "Server=db;Database=Finance;User=admin;Password=p@ssw0rd;";

    [HttpGet]
    public IActionResult GetAll(string userId)
    {
        // Again with the issue A, this connection to the database should not be handled within the controller
        // We want the setup of the database and its SQL commands to be separated and wrapped to be used in this controller

        using var conn = new provide(_connString);
        conn.Open();

        // Question (let's call it Question A): How often is this API used? If it's used often (say, more than 10+ per second), then I think we should avoid
        // calling database every so, and keep a in-memory cache in the "databaseService".
        // Then as for the database, we can listen to whenever a new item is added or any update has been made, and update that cache that accordingly
        // If we are quite confident that this server is going to reasonably live reliably, then we can just save a snapshot of this cache to database every 5 minutes,
        //  or whenever new change is made whichever is longer.  
        var cmd = new SqlCommand(
            $"SELECT * FROM Expenses WHERE UserId = '{userId}'", conn);
        var reader = cmd.ExecuteReader();

        var expenses = new List<Expense>();
        // This should be something like "databaseService".getAllLists() and return a List of Expense

        // Suggestion: This probably might be ok but I'm thinking we can get stuck in this stuck in this loop
        // But I would add a fallback to get out of this loop and throw an error, some sort of time out thing.
        // Again, this should be dealt in within the databaseService, not in the controller.
        while (reader.Read())
            expenses.Add(new Expense
            {
                Id       = (int)reader["Id"],
                UserId   = reader["UserId"].ToString(),
                Amount   = (decimal)reader["Amount"],
                Category = reader["Category"].ToString(),
                Date     = (DateTime)reader["Date"]
            });
        
        //  
        /* Suggestion code:
        Try{
        List<Expense> expenses = databaseService.getAllExpenses();
        OK(expenses)
        } catch(Exception ex) {
        Error("Exception occurred" + ex.Message)
        }
        */


        // Suggestion (non-blocking) (I'll call this suggestion A): But easier debugging purposes, we should wrap a try catch with various exceptions so that we can easily
        // debug what the problem is either locally through a debugger, or through looking a logs of say, customer escalation
        // Example:
        /*
        try {
        } catch (NotFoundException ex) {
        } catch (UnauthorizedException ex) {
        } catch (Otherexcpetions ex) {
        } 
        .
        .
        .
        catch(Exception ex) {
        Error("unknown exception occurred" + ex.Message)
        }

        */
        return Ok(expenses);
    }

    // Suggestion/Thought: POST might imply you are completely changing the list of expenses but from the name of function, 
    // this might be moreso the addition to the list
    // Probably PATCH?
    [HttpPost]
    public IActionResult Create([FromBody] Expense expense)
    {
        expense.Date = DateTime.Now;

        // Similar to Issue A, put the database stuff out of the controller.
        using var conn = new SqlConnection(_connString);
        conn.Open();

        // Question/Issue: I'm in fact worried about the performance of this call rather than the getAll database
        // question I made in Question A, we would probably want to save this updated list into a cache and then have a sanpshot
        // in the database for say every 5 minutes. 
        var cmd = new SqlCommand(
            $"INSERT INTO Expenses (UserId, Amount, Category, Date) " +
            $"VALUES ('{expense.UserId}', {expense.Amount}, '{expense.Category}', '{expense.Date}')",
            conn);
        cmd.ExecuteNonQuery();

        // suggestion A also applies here
        return Ok(expense);
    }
}