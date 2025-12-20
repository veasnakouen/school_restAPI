using System.Net;
using System.Text.Json;

namespace SchoolAPI.Middleware;

public class ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger, IHostEnvironment env)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            // throw new NullReferenceException("Null reference exception from middleware");
            logger.LogError(ex, "{message}", ex.Message);
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            var response = env.IsDevelopment()
                ? new Errors.ApiException(context.Response.StatusCode, ex.Message, ex.StackTrace?.ToString())
                : new Errors.ApiException(context.Response.StatusCode, "Internal Server Error", null);

            var options = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };

            var json = JsonSerializer.Serialize(response, options);
            await context.Response.WriteAsync(json);

        }
    }
}