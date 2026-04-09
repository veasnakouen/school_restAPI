
using Microsoft.AspNetCore.Authorization;
using SchoolAPI.Authorization;
using SchoolAPI.Data;
using Scalar.AspNetCore;
using Hangfire;
using schoolAPI.Extensions;
using SchoolAPI.Contracts;
using SchoolAPI.Extensions;
using SchoolAPI.Middleware;
using SchoolAPI.Services.Reporting;
using Serilog;
using Microsoft.AspNetCore.HttpOverrides;
using QuestPDF.Infrastructure;

var builder = WebApplication.CreateBuilder(args);



// Register PermissionHandler for policy-based authorization
builder.Services.AddSingleton<IAuthorizationHandler, PermissionHandler>();

// Register all services (including DbContext) before seeding and policy registration




// Load secrets.json for local development (contains credentials, never commit to source control)
if (builder.Environment.IsDevelopment())
{
    builder.Configuration.AddJsonFile("secrets.json", optional: true, reloadOnChange: false);
}

// Add services to the container.
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JwtSettings"));
var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
if (string.IsNullOrEmpty(jwtSettings?.Secret))
{
    throw new InvalidOperationException("JWT SecretKey is missing. Please check 'JwtSettings:Secret' in configuration.");
}


#region Serilog comments
var logger = new LoggerConfiguration()
    .WriteTo.Console()
    // .WriteTo.File("logs/schoolapi-.log", rollingInterval: RollingInterval.Day)
    .CreateLogger();

// Add Logging
builder.Logging
    .ClearProviders()
    .AddSerilog(logger)
    .AddConsole()
    .AddDebug();

#endregion

QuestPDF.Settings.License = LicenseType.Community;

builder.Services.AddServices();
builder.Services.ConfigureCors();
builder.Services.ConfigureEpplus();
builder.Services.AddRateLimiting();
builder.Services.AddHangfireServices(builder.Configuration);
builder.Services.AddStackExchangeRedisCache(options =>
{
    var redisConfiguration = builder.Configuration["Redis:Configuration"];
    if (string.IsNullOrWhiteSpace(redisConfiguration))
    {
        throw new InvalidOperationException("Redis configuration is missing. Set 'Redis:Configuration' in configuration or user secrets.");
    }

    options.Configuration = redisConfiguration;
    options.InstanceName = "SchoolAPI:";
});
builder.Services.AddDatabase(builder.Configuration)
        .AddIdentityServices(builder.Configuration)
        .AddJwtAuthentication(builder.Configuration)
        .AddApplicationServices()
        .AddMediatR(builder.Configuration)
        .AddFluentValidation()
        .AddSwagger();


var app = builder.Build();


// After app is built, seed permissions and register policies
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<SchoolDbContext>();
    await DbInitializer.SeedPermissionsAsync(db);
    var permissions = db.Permissions.Select(p => p.Name).ToList();
    var authOptions = app.Services.GetRequiredService<Microsoft.AspNetCore.Authorization.IAuthorizationPolicyProvider>() as Microsoft.AspNetCore.Authorization.AuthorizationOptions;
    var serviceProvider = app.Services;
    var authorizationOptions = serviceProvider.GetService<Microsoft.Extensions.Options.IOptions<Microsoft.AspNetCore.Authorization.AuthorizationOptions>>()?.Value;
    if (authorizationOptions != null)
    {
        foreach (var perm in permissions)
        {
            if (authorizationOptions.GetPolicy(perm) == null)
                authorizationOptions.AddPolicy(perm, policy => policy.Requirements.Add(new PermissionRequirement(perm)));
        }
    }
}

// Security headers — applied first so all responses are covered
app.Use(async (ctx, next) =>
{
    ctx.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    ctx.Response.Headers.Append("X-Frame-Options", "DENY");
    ctx.Response.Headers.Append("X-Xss-Protection", "1; mode=block");
    ctx.Response.Headers.Append("Strict-Transport-Security", "max-age=31536000"); // HSTS
    await next();
});

// Global exception handling middleware
app.UseMiddleware<ExceptionMiddleware>();
app.UseForwardedHeaders();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    // swagger only in development
    app.UseSwagger();
    app.UseSwaggerUI();
    // scalar UI
    app.MapScalarApiReference();
    app.MapOpenApi().AllowAnonymous();
    app.UseHangfireDashboard("/hangfire");
}

app.UseHttpsRedirection();
app.UseRouting();
app.UseCors("CorePolicy");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

RecurringJob.AddOrUpdate<IMonthlyTransactionReportJob>(
    "monthly-transaction-report",
    job => job.GeneratePreviousMonthReportAsync(),
    Cron.Monthly(1, 0, 0));

// Apply migrations and seed roles + admin user
await app.SeedDataAsync();

await app.RunAsync();
