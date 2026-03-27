using Scalar.AspNetCore;
using schoolAPI.Extensions;
using SchoolAPI.Contracts;
using SchoolAPI.Extensions;
using SchoolAPI.Helpers;
using SchoolAPI.Interfaces;
using SchoolAPI.Middleware;
using SchoolAPI.Services;
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

builder.Services.AddScoped<ClassService>();
builder.Services.AddScoped<IPhotoService, PhotoService>();

#region Angular
// builder.Services.AddSpaStaticFile(configuration=>{
//     configuration.RootPath = "ClientApp/dist";
// });
#endregion Angular

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
#region registering some separate services from ServiceCollection.cs,
builder.Services
    .AddApplicationServices()
    // .AddIdentityCore(builder.Configuration)
    .AddIdentityServices(builder.Configuration)
    .AddJwtAuthentication(builder.Configuration)
    .AddDatabase(builder.Configuration)
    .AddMediatR(builder.Configuration)
    // .ConfigureJwt(builder.Configuration)
    .AddFluentValidation()
    // .AddAutoMapper()
    .AddSwagger();
#endregion
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
#region Additional services comments
// Adding Jwt from extension method (our on custom method)
builder.Services.ConfigureIdentity();
builder.Services.ConfigureCors();
// builder.Services.Configure<CloudinarySettings>(builder.Configuration.GetSection("CloudinarySettings"));
// builder.Services.ConfigureJwt(builder.Configuration);



// builder.Services.AddAuthentication().AddBearerToken();
// adding the authorization service from the asp.net core identity
// builder.Services.AddIdentityApiEndpoints<AppUser>()
// .AddEntityFrameworkStores<SchoolDbContext>();


// builder.Services.AddEndpointsApiExplorer();
// builder.Services.AddOpenApi();
#endregion
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

#region apps
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
#region Angualr
// app.UseSpa(spa => {
//     spa.Options.SourcePth = "";
//     if (app.Environment.IsDevelopment())
//     {
//         spa.UseAngularCliServer(npmScript: "serve");   
//     }
// });
#endregion Angular

app.UseHttpsRedirection();
app.UseRouting();
app.UseExceptionHandler();
app.UseAuthentication();
app.UseAuthorization();


app.Use(async (ctx, next) =>
{
    ctx.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    ctx.Response.Headers.Append("X-Frame-Options", "DENY");
    ctx.Response.Headers.Append("X-Xss-Protection", "1; mode=block");
    ctx.Response.Headers.Append("Strict-Transport-Security", "max-age=31536000"); // HSTS
    await next();
});
//seem like to mapping 


app.MapControllers();

// @Mr.Neil cumming do seeding data base on migration
// using var scope = app.Services.CreateScope();

// var services = scope.ServiceProvider;
// try
// {
//     var context = services.GetRequiredService<SchoolAPI.Data.SchoolDbContext>();
//     await context.Database.MigrateAsync();
//     //todo: create a seed class within static method ("SeedUserAsync")
//     // await Seed.SeedUserAsync(context);
// }
// catch (Exception ex)
// {
//     var customLogger = services.GetRequiredService<ILogger<Program>>();
//     customLogger.LogError(ex, "An error occurred during migration");
// }
// style for using minimal API in asp.net core web Api dotnet 10
// app.MapGet("/minimal-get", () =>
// {
//     throw new NotImplementedException();
// }); 
#region Testing with c#'s 
// some c# Vs-Code short-Cut/ Commands
//  dotnet add migration "Migration_Name"
//  dotnet ef database update
// Alt + F12 : Peeking in vs-Code
// 
#endregion

app.Run();
// app.RunAsync();
#endregion