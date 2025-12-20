
using System.Text.Json;

public class CustomMiddleware : IMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        try
        {
            // Call the next middleware in the pipeline
            await next(context);
            Console.WriteLine("Request processed successfully.");
        }
        catch (Exception ex)
        {
            // Handle the exception and return a custom response
            context.Response.StatusCode = 500; // Internal Server Error
            context.Response.ContentType = "application/json";
            var result = JsonSerializer.Serialize(new { error = ex.Message });
            await context.Response.WriteAsync(result);
        }
    }
}
