
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
using SchoolAPI.Helpers;
using SchoolAPI.Services;
using Serilog;
using Microsoft.AspNetCore.HttpOverrides;
using QuestPDF.Infrastructure;
using SchoolAPI.Interfaces;

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

builder.Services.Configure<CloudinarySettings>(builder.Configuration.GetSection("CloudinarySettings"));
builder.Services.AddScoped<IPhotoService, PhotoService>();

// Register HttpContextAccessor and CurrentUserService so CQRS handlers can use them
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<SchoolAPI.Application.Common.Interfaces.ICurrentUserService, SchoolAPI.Services.CurrentUserService>();
builder.Services.AddScoped<SchoolAPI.Services.ICurrentUserService, SchoolAPI.Services.CurrentUserService>();

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

// Configure Output Caching to use Redis
builder.Services.AddStackExchangeRedisOutputCache(options =>
{
    options.Configuration = builder.Configuration["Redis:Configuration"];
    options.InstanceName = "SchoolAPI:OutputCache:";
});
builder.Services.AddOutputCache();

builder.Services.AddDatabase(builder.Configuration)
        .AddIdentityServices(builder.Configuration)
        .AddJwtAuthentication(builder.Configuration)
        .AddApplicationServices()
        .AddMediatR(builder.Configuration)
        .AddFluentValidation()
        .AddSwagger();


var app = builder.Build();

// Ensure database is created and seed all data automatically
await DbInitializer.InitializeDatabaseAsync(app);

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
app.UseOutputCache();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

// Enforce maintenance mode for non-admins
app.UseMiddleware<MaintenanceModeMiddleware>();

app.MapControllers();

// Use the injected IRecurringJobManager instead of the static class to avoid JobStorage.Current initialization errors
using (var scope = app.Services.CreateScope())
{
    var recurringJobManager = scope.ServiceProvider.GetRequiredService<IRecurringJobManager>();
    recurringJobManager.AddOrUpdate<IMonthlyTransactionReportJob>(
        "monthly-transaction-report",
        job => job.GeneratePreviousMonthReportAsync(),
        Cron.Monthly());
}

await app.RunAsync();
