
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.OpenApi.Models;
using SchoolAPI.Authorization;
using SchoolAPI.Data;
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

builder.Services.AddCors(options =>
{
    options.AddPolicy("CorePolicy", policy =>
    {
        // Read the live frontend URL from Render's Environment Variables, fallback to localhost for dev
        var frontendUrl = builder.Configuration["FrontendUrl"] ?? "http://localhost:3000";

        policy.WithOrigins(frontendUrl, "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Critical: SignalR requires AllowCredentials!
    });
});
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

// Enable response compression to significantly reduce JSON payload sizes over the network
builder.Services.AddResponseCompression(options => {
    options.EnableForHttps = true;
});

builder.Services.AddSignalR();

// Configure Swagger FIRST before other services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "SchoolAPI", Version = "v1" });
    
    // Add JWT Bearer authentication
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token.",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddDatabase(builder.Configuration)
        .AddIdentityServices(builder.Configuration)
        .AddJwtAuthentication(builder.Configuration)
        .AddApplicationServices()
        .AddMediatR(builder.Configuration)
        .AddFluentValidation();
        // .AddSwagger(); // Removed - now using direct registration above

// SignalR sends the JWT token in the query string for WebSockets
// We need to extract it so the .NET backend can authorize the connection
builder.Services.PostConfigureAll<JwtBearerOptions>(options =>
{
    var existingOnMessageReceived = options.Events?.OnMessageReceived;
    options.Events ??= new JwtBearerEvents();
    options.Events.OnMessageReceived = async context =>
    {
        if (existingOnMessageReceived != null)
        {
            await existingOnMessageReceived(context);
        }

        var accessToken = context.Request.Query["access_token"];
        var path = context.HttpContext.Request.Path;

        if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
        {
            // Read the token out of the query string
            context.Token = accessToken;
        }
    };
});

var app = builder.Build();

await DbInitializer.InitializeDatabaseAsync(app);

app.UseForwardedHeaders();
app.UseSwagger();
app.UseSwaggerUI();

app.UseRouting();
app.UseCors("CorePolicy");
app.UseResponseCompression();
app.UseOutputCache();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

// Enforce maintenance mode for non-admins
app.UseMiddleware<MaintenanceModeMiddleware>();

app.MapControllers();

app.MapHub<SchoolAPI.Hubs.DashboardHub>("/hubs/dashboard");
app.MapHub<SchoolAPI.Hubs.ChatHub>("/hubs/chat");
app.UseStaticFiles();

// Use the injected IRecurringJobManager instead of the static class to avoid JobStorage.Current initialization errors
using (var scope = app.Services.CreateScope())
{
    try
    {
        var recurringJobManager = scope.ServiceProvider.GetService<IRecurringJobManager>();
        if (recurringJobManager != null)
        {
            recurringJobManager.AddOrUpdate<IMonthlyTransactionReportJob>(
                "monthly-transaction-report",
                job => job.GeneratePreviousMonthReportAsync(),
                Cron.Monthly());
        }
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Could not initialize Hangfire recurring jobs.");
    }
}

try
{
    await app.RunAsync();
}
catch (Exception ex)
{
    app.Logger.LogCritical(ex, "\n❌ FATAL STARTUP ERROR: The application crashed. Please check your Database and Redis Environment Variables in Render!\n");
    throw; // Re-throw the error so the server properly crashes and shows the stack trace
}
