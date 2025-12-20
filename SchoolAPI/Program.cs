using System.Diagnostics;
using System.Runtime.ExceptionServices;
using System.Runtime.Serialization.Formatters.Binary;
using System.Security.AccessControl;
using System.Text;
using System.Xml.Serialization;
using MassTransit.SagaStateMachine;
using MassTransit.Transports.Components;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.CodeAnalysis;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using Microsoft.Identity.Client;
using OfficeOpenXml.FormulaParsing.FormulaExpressions;
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

// in older version 
// app.UseEndpoints(endpoints =>
// {
//     endpoints.MapControllers();
//  });

app.MapControllers();
using var scope = app.Services.CreateScope();
var services = scope.ServiceProvider;

// some c# lesson codes
#region Testing with c#'s 
// SingleTon in dependency Injection. 
// Monostate\
// public class CEO
// {
//     private static string name;
//     private static int age;
//     public string Name
//     {
//         get => name;
//         set => name = value;
//     }
//     public int Age
//     {
//         get => age;
//         set => age = value;
//     }
//     public override string ToString()
//     {
//         return $"{nameof(Name)} : {Name}, {nameof(Age)} :{Age}";
//     }
// }


// public class Demo
// {
//     static void Main(string[] args)
//     {
//         var ceo = new CEO();
//         ceo.Name = "Adam Smith";
//         ceo.Age = 50;
//     }
// }
// SOLID:

#region S
// Single Response Principle.
// public class EmailSender
// {
//     public void SendEmail(string email, string message)
//     {
//         Console.WriteLine($"Sending email to {email} :{message}");
//     }
// }


// public class User
// {
//     public string UserName { get; set; }
//     public string Email { get; set; }

//     public void Register()
//     {
//         // Register logic goes here

//         // Send email...
//         EmailSender emailSender = new();
//         emailSender.SendEmail(Email, "Welcome to our platform.");
//     }
//     // 
// }

// public record UserService
// {
//     public void Register(User user)
//     {
//         // Register user logic...


//         // Send email...
//         EmailSender emailSender = new EmailSender();
//         emailSender.SendEmail(user.Email, "Welcome to our platform.");
//     }
// }

// app.MapGet("/", () => "Hello world!");
// app.MapPost("/create", () => "hello world");           

#endregion

#region O..
// software entities (classes, modules, functions. etc.) should be open for extension,
// but close for modification


// public enum ShapeType
// {
//     Circle,
//     Rectangle
// }
// public abstract class Shape
// {

//     // the abstract keyword allow us to create method without body
//     public abstract double CalculateArea();
//     // {
//     // switch (Type)
//     // {
//     //     case ShapeType.Circle:
//     //         return Math.PI * Math.Pow(Radius, 2);
//     //     case ShapeType.Rectangle:
//     //         return Length * Width;
//     //     default:
//     //         throw new InvalidOperationException("Unsupported Shape Type.");
//     // }
//     // }
// }

// public class Circle : Shape
// {
//     public double Radius { get; set; }


//     // override method, override to the base/parent's method
//     public override double CalculateArea()
//     {
//         return Math.PI * Math.Pow(Radius, 2);
//     }
// }

// public class Rectangle : Shape
// {
//     public double Width { get; set; }
//     public double Length { get; set; }

//     public override double CalculateArea()
//     {
//         return Width * Length;
//     }
// }
#endregion

#region L
// Liskov Substitution Principle (LSP):
// "Object of the supper class be replaceable with objects of its sub class without
// effecting the correctness of the program."
// public abstract class Shape
// {
//     public abstract double Area { get; }

// }
// public class Rectangle : Shape
// {
//     public virtual double Width { get; set; }
//     public virtual double Height { get; set; }
//     public override double Area => throw new NotImplementedException();
// }

// // public class Square : Rectangle
// public class Square : Shape
// {
//     // public override double Width
//     // {
//     //     get => base.Width;
//     //     set => base.Width = value;
//     // }
//     // public override double Height
//     // {
//     //     get => base.Height;
//     //     set => base.Height = base.Width = value;
//     // }

//     public double SideLength { get; set; }

//     public override double Area => SideLength * SideLength;
// }
// public class demo
// {
//     public static void Main(string[] args)
//     {
//         // var rect = new Rectangle();
//         // rect.Height = 10;
//         // rect.Width = 5;
//         // var sq = new Square();
//         // sq.Height = 20;
//         // sq.Width = 5;
//         // Console.WriteLine($"The expect Area {rect.Area}"); //result: 50
//         // Console.WriteLine($"The expect Area {sq.Area}"); //result :  25

//         // ***
//         Shape rectangle = new Rectangle { Width = 4, Height = 5 };
//         Console.WriteLine(rectangle.Area);

//         Shape square = new Square { SideLength = 5 };
//         Console.WriteLine(square.Area);



//     }
// }



#endregion 

#region I
// Interface Segregation Principle(ISP)

// "Client should not be forced to depend on interfaces they do not use."

// public interface IShape
// public interface IShape3D
// {
//     double Area();
//     double Volume();
// }
// public interface IShape2D
// {
//     double Area();
// }

// // public class Circle : IShape
// public class Circle : IShape2D
// {
//     public double Radius { get; set; }
//     public double Area()
//     {
//         return Math.PI * Math.Pow(Radius, 2);
//     }

// }

// public class Sphere : IShape3D
// {
//     public double Radius { get; set; }
//     public double Area()
//     {
//         return 4 * Math.PI * Math.Pow(Radius, 2);
//     }

//     public double Volume()
//     {
//         return (4.0 / 3.0) * Math.PI * Math.Pow(Radius, 3);
//     }
// }

// public class Demo
// {
//     static void Main(string[] args)
//     {
//         var circle = new Circle();
//         circle.Radius = 10;
//         Console.WriteLine(circle.Area());
//         var sphere = new Sphere();
//         sphere.Radius = 10;
//         Console.WriteLine(sphere.Area());
//         Console.WriteLine(sphere.Volume());

//     }
// }


#endregion
#region D
// Dependency Inversion Principle(DIP)

// "High-Level module should not depend on low level modules.both should depend one abstraction."
// public interface IEngine { void Start(); }


// // low level module
// public class Engine : IEngine
// {
//     public void Start()
//     {
//         Console.WriteLine("Engine started.");
//     }

// }
// // high level module
// public class Car
// {
//     private IEngine engine;
//     public Car(IEngine engine)
//     {
//         // this.engine = new Engine();
//         this.engine = engine;
//     }


//     public void Start()
//     {
//         engine.Start();
//         Console.WriteLine("Car started.");
//     }
// }
// public class Demo
// {
//     static void Main(string[] args)
//     {
//         var car = new Car(new Engine());
//     }
// }

#endregion
#endregion
// some c# lesson codes
app.Run();
// app.RunAsync();   