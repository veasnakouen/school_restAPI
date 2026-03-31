using Scalar.AspNetCore;
using schoolAPI.Extensions;
using SchoolAPI.Contracts;
using SchoolAPI.Extensions;
using SchoolAPI.Middleware;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

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

builder.Services.AddServices();
builder.Services.ConfigureCors();
builder.Services.AddDatabase(builder.Configuration)
        .AddIdentityServices(builder.Configuration)
        .AddJwtAuthentication(builder.Configuration)
        .AddApplicationServices()
        .AddMediatR(builder.Configuration)
        .AddFluentValidation()
        .AddSwagger();

var app = builder.Build();

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

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    // swagger only in development
    app.UseSwagger();
    app.UseSwaggerUI();
    // scalar UI
    app.MapScalarApiReference();
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseRouting();
app.UseCors("CorePolicy");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Apply migrations and seed roles + admin user
await app.SeedDataAsync();

await app.RunAsync();
