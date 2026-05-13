using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;

namespace SchoolAPI.Middleware;

public class MaintenanceModeMiddleware
{
    private readonly RequestDelegate _next;

    public MaintenanceModeMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, IApplicationDbContext dbContext)
    {
        // Allow access to auth, settings, and swagger routes even during maintenance
        var path = context.Request.Path.Value ?? string.Empty;
        if (path.StartsWith("/api/auth") || path.StartsWith("/api/settings") || path.StartsWith("/swagger") || path.StartsWith("/scalar"))
        {
            await _next(context);
            return;
        }

        var settings = await dbContext.SystemSettings.FirstOrDefaultAsync();
        if (settings != null && settings.MaintenanceMode)
        {
            var user = context.User;
            var isAdmin = user.IsInRole("Admin") || user.IsInRole("SuperAdmin");

            if (!isAdmin)
            {
                context.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsJsonAsync(new { message = "The system is currently undergoing maintenance. Please try again later." });
                return;
            }
        }

        await _next(context);
    }
}