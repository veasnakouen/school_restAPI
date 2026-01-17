using System.ComponentModel.DataAnnotations.Schema;
using System.Diagnostics;
using System.Runtime.ExceptionServices;
using System.Runtime.Serialization.Formatters.Binary;
using System.Security.AccessControl;
using System.Text;
using System.Xml.Serialization;
using Humanizer;
using MassTransit.Futures.Contracts;
using MassTransit.SagaStateMachine;
using MassTransit.Transports.Components;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.CodeAnalysis;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using Microsoft.EntityFrameworkCore.Query;
using Microsoft.Identity.Client;
using OfficeOpenXml.FormulaParsing.FormulaExpressions;
using OfficeOpenXml.FormulaParsing.Utilities;
using OfficeOpenXml.Packaging.Ionic.Zip;
using Scalar.AspNetCore;
using schoolAPI.Extensions;
using SchoolAPI.Contracts;
using SchoolAPI.Extensions;
using SchoolAPI.Middleware;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// JwtSettings profile in appSettings.json file
// var connectionString = builder.Configuration.GetConnectionString("DefaultConnectionString");



// Add services to the container.
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JwtSettings"));
var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
if (string.IsNullOrEmpty(jwtSettings.Secret))
{
    throw new InvalidCastException("JWT SecretKey is missing. Please check 'JwtSettings:Key' in configuration.");
}

// CQRS
// builder.Services.AddMediatR(configuration=>configuration.RegisterServicesFromAssembly(typeof(Program).Assembly));

//builder.Services.ConfigureHttpJsonOptions(options =>
// {
//     options.SerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
// });

var logger = new LoggerConfiguration()
    .WriteTo.Console()
    // .WriteTo.File("logs/schoolapi-.log", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Services.AddScoped<ClassService>();

// Add Logging
builder.Logging
    .ClearProviders()
    .AddSerilog(logger)
    .AddConsole()
    .AddDebug();


#region some removable code comments
// builder.Services.AddControllers(options => options.Filters.Add(new ValidateModelAttribute()));
// builder.Services.AddTransient<CustomMiddleware>();

// builder.Services.AddOpenApi();
// Adding Database context
// builder.Services.AddDbContext<SchoolDbContext>(opt => opt.UseNpgsql(connectionString));

// From ApplicationServices.cs
// builder.Services.AddHttpContextAccessor();
// builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
// builder.Services.AddProblemDetails();

// Add Identity
// builder.Services.AddIdentity<AppUser, IdentityRole>()
//     .AddEntityFrameworkStores<SchoolDbContext>()
//     .AddDefaultTokenProviders();

// secure api endpoints
// builder.Services.AddIdentityApiEndpoints<AppUser>()
//     .AddEntityFrameworkStores<SchoolDbContext>();
#endregion

// registering custom ServiceCollection.cs,
builder.Services
    .AddApplicationServices()
    // .AddIdentityCore(builder.Configuration)
    .AddIdentityServices(builder.Configuration)
    .AddJwtAuthentication(builder.Configuration)
    .AddDatabase(builder.Configuration)
    .AddMediatR(builder.Configuration)
    // .ConfigureJwt(builder.Configuration)
    .AddFluentValidation()
    .AddAutoMapper()
    .AddSwagger();

builder.Services.AddServices();
#region some optional code
//Register AutoMapper
// builder.Services.AddAutoMapper(typeof(Program).Assembly);
// builder.Services.AddAutoMapper(typeof(MappingProfile));

// builder.Services.AddAuthentication(opt =>
// {
//     opt.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
//     opt.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
//     opt.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
// }).AddJwtBearer(opt =>
//     {
//         opt.SaveToken = true;
//         opt.RequireHttpsMetadata = true;
//         opt.TokenValidationParameters = new TokenValidationParameters
//         {
//             ValidateIssuer = true,
//             ValidateAudience = true,
//             ValidateLifetime = true,
//             ValidateIssuerSigningKey = true,
//             ValidAudience = JWTSetting["validAudience"],
//             ValidIssuer = JWTSetting["validAudience"],
//             IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JWTSetting.GetSection("SecurityKey").Value!))
//         };
//     });

// 🔥Internal configure IdentityRoles 
// builder.services.AddIdentityRoles<AppUser, IdentityRole>(
//     option =>
//     {
//         option.Password.Required = true;
//         option.Password.RequiredLowerCase = true;
//         option.Password.RequiredUpperCase = true;
//         option.Password.RequiredNAlphanumeric = true;
//         option.Password.RequiredLength = 12;

//     })
//     .AddEntityFrameworkStores<SchoolDbContext>();

// internal configure JwtBearer
// builder.Services.AddAuthentication(option=>
// {
//     option.DefaultAuthenticateScheme =
//     option.DefaultChallengeScheme =
//     option.DefaultForbidScheme =
//     option.DefaultScheme =
//     option.DefaultSignInScheme =
//     option.DefaultSignOutScheme = JwtBearerDefaults.AuthenticationScheme;
// }).AddJwtBearer(option=>
//     {option.TokenValidationParameters
//         {
//             ValidateIssuer = true;
//             ValidIssuer = builder.Configuration["JwtSettings:Issuer"];
//             ValidateAudience = true;
//             ValidAudience = TagStructure.configuration["JwtSettings:Audience"];
//             ValidateIssuersigningKey = true;
//             IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["JwtSettings:Secret"]!));


//         }
//     }); 
#endregion

// Adding Jwt from extension method (our on custom method)
builder.Services.ConfigureIdentity();
builder.Services.ConfigureCors();
// builder.Services.ConfigureJwt(builder.Configuration);

// 
// 
// builder.Services.AddAuthentication().AddBearerToken();
// adding the authorization service from the asp.net core identity
// builder.Services.AddIdentityApiEndpoints<AppUser>()
// .AddEntityFrameworkStores<SchoolDbContext>();


// builder.Services.AddEndpointsApiExplorer();
// builder.Services.AddOpenApi();

var app = builder.Build();
// 🪧 Register middleware
app.UseMiddleware<ExceptionMiddleware>();

#region some comments
//these lines for swagger with authentication, it will add the lock button on the top right corner
// builder.Services.AddSwaggerGen(options=>
//     {
//         options.AddSecurityDefinition("Bearer", new OpenApiSecurityRequirement
//         {
//             Name = "Authorization",
//             Type = SecuritySchemeType.Http,
//             Scheme = "Bearer",
//             BearerFormat = "JWT",
//             In = ParameterLocation.Header,
//             Description = "JWT Authorization header using the Bearer scheme.",
//         });
//         options.AddSecurityRequirement(new OpenApiSecurityRequirement
//         {
//             {
//                 new OpenApiSecurityScheme
//                 {
//                     Reference = new OpenApiReference
//                     {
//                         Type = ReferenceType.SecurityScheme,
//                         Id = "Bearer"
//                     }
//                 },
//                 new string[] {}
//                 // new List<string>();
//             }
//         });
//     }
// );


//Seed Roles and admin,
//from WebApplicationExtension.cs
// await app.SeedDataAsync();
#endregion 


// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{

    // swagger only in development
    app.UseSwagger();
    app.UseSwaggerUI();

    // scalar UI
    app.MapScalarApiReference();
    // TODO: check some configure with scalar
    app.MapOpenApi();
}


app.UseCors("CorePolicy");
// app.UseCors(x => x.AllowAnyHeader().AllowAnyMethod().WithOrigins("http://localhost:4200"));

app.UseHttpsRedirection();
app.UseRouting();
app.UseExceptionHandler();
app.UseAuthentication();
app.UseAuthorization();

// Header
app.Use(async (ctx, next) =>
{
    ctx.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    ctx.Response.Headers.Append("X-Frame-Options", "DENY");
    ctx.Response.Headers.Append("X-Xss-Protection", "1; mode=block");
    ctx.Response.Headers.Append("Strict-Transport-Security", "max-age=31536000"); // HSTS
    await next();
});



app.MapControllers();
using var scope = app.Services.CreateScope();
var services = scope.ServiceProvider;

// some c# lesson codes
#region Testing with c#'s 

#endregion
// some c# lesson codess
app.Run();
// app.RunAsync();   