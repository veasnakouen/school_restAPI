using System.Text;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using SchoolAPI.Contracts;
using SchoolAPI.Data;
using SchoolAPI.Entities;
using SchoolAPI.Interfaces;
using SchoolAPI.RequestHelper;
using SchoolAPI.Services;
using IoPath = System.IO.Path;

namespace SchoolAPI.Extensions
{
    // collection of services to be added to the DI container  
    public static class ServiceCollectionExtensions
    {



        // 🔧 Add Database/DbContext :register the connection string 
        public static IServiceCollection AddDatabase(this IServiceCollection services, IConfiguration configuration)
        {
            var connectionString = configuration.GetConnectionString("DefaultConnectionString");
            services.AddDbContext<SchoolDbContext>(options =>
                //  Use with sqlServer
                // options.UseSqlServer(configuration.GetConnectionString("DefaultConnection"),
                //                     b => b.MigrationsAssembly("SchoolAPI"))
                // options.UseSqlite("");
                options.UseNpgsql(connectionString)
                );
            var info = Path.Combine("Data", "SchoolDatabase.db");

            return services;
        }

        // auto mapper
        public static IServiceCollection AddAutoMapper(this IServiceCollection service)
        {
            service.AddAutoMapper(typeof(MappingProfile));
            return service;
        }

        // 🔧 Core configure 
        public static void ConfigureCors(this IServiceCollection services)
        {
            services.AddCors(option =>
            {
                option.AddPolicy(name: "CorePolicy", builder =>
                {
                    builder.WithOrigins("*")
                    .AllowAnyOrigin()
                    .AllowAnyMethod()
                    .AllowAnyHeader();
                });
            });
        }


        //🔧 inject identityCore package in middleware 
        // TODO : Do more checking on this point 
        public static IServiceCollection AddIdentityCore(this IServiceCollection service, IConfiguration configuration)
        {
            service.AddIdentityCore<AppUser>(
                opt =>
                {
                    // these are 
                    opt.Password.RequireDigit = true;
                    // options.Password.RequireUppercase = false;
                    // options.Password.RequireLowercase = false;
                    opt.Password.RequireNonAlphanumeric = false;
                    opt.Password.RequiredUniqueChars = 1;
                    opt.Password.RequiredLength = 6;

                    opt.User.RequireUniqueEmail = true;
                    opt.SignIn.RequireConfirmedEmail = false;
                }
            )

            .AddRoles<AppRole>()
            .AddRoleManager<RoleManager<AppRole>>()
            .AddEntityFrameworkStores<SchoolDbContext>()
            .AddDefaultTokenProviders()
            .AddRoleValidator<RoleManager<AppRole>>()
            .AddTokenProvider<DataProtectorTokenProvider<AppUser>>("SchoolAPI")
            .AddEntityFrameworkStores<SchoolDbContext>(); //"SchoolAPI" is provider's name
            return service;
        }

        // 🔧 Add Identity options
        public static IServiceCollection AddIdentityServices(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddIdentity<AppUser, IdentityRole>(options =>
                {
                    // these are 
                    // options.SignIn.RequireConfirmedAccount = true;
                    // options.SignIn.RequireConfirmedPhoneNumber = true;
                    options.Password.RequireDigit = true;
                    // options.Password.RequireUppercase = false;
                    // options.Password.RequireLowercase = false;
                    options.Password.RequireNonAlphanumeric = false;
                    options.User.RequireUniqueEmail = true;
                    options.SignIn.RequireConfirmedEmail = false;
                    options.Password.RequiredLength = 6;
                    options.Password.RequiredUniqueChars = 1;

                    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
                    options.Lockout.MaxFailedAccessAttempts = 5;
                    options.Lockout.AllowedForNewUsers = true;
                })
                .AddEntityFrameworkStores<SchoolDbContext>()
                .AddDefaultTokenProviders();


            return services;
        }


        //  Add JWT Authentication
        public static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
        {
            services.Configure<JwtSettings>(configuration.GetSection("JwtSettings"));
            // services.Configure<IdentityOptions>(opt =>
            // {
            //     opt.Password.RequireDigit = true;
            //     opt.Password.RequireLowercase = true;
            //     opt.Password.RequireNonAlphanumeric = false;
            //     opt.Password.RequireUppercase = true;
            //     opt.Password.RequiredLength = 6;
            //     opt.Password.RequiredUniqueChars = 1;

            //     opt.User.AllowedUserNameCharacters =
            //     "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._@+";
            //     opt.User.RequireUniqueEmail = true;
            //     opt.SignIn.RequireConfirmedEmail = false;

            //     opt.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
            //     opt.Lockout.MaxFailedAccessAttempts = 5;    
            //     opt.Lockout.AllowedForNewUsers = true;


            // });

            // read/access to appSettings.json 
            var jwtSettings = configuration.GetSection("JwtSettings").Get<JwtSettings>();
            if (string.IsNullOrEmpty(jwtSettings?.Secret))
                throw new InvalidOperationException("JWT Secret is missing.");

            services.AddScoped<ITokenService, TokenService>();
            // Token with Nailcummgin  tutorial
            services.AddScoped<ITokenServices, TokenServices>();
            // services.AddScoped<JwtHandler>();

            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                // options.DefaultScheme=
            })
            .AddJwtBearer(options =>
            {
                options.SaveToken = false;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtSettings.Issuer,
                    ValidAudience = jwtSettings.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Secret))
                };

                // options.Events = new JwtBearerEvents
                // {
                //     OnChallenge = context =>
                //     {
                //         context.HandleResponse();
                //         context.Response.StatusCode = 401;
                //         context.Response.ContentType = "application/json";
                //         var result = System.Text.Json.JsonSerializer.Serialize(new
                //         {
                //             message = "You are not authorized to access this resource, Please do authentication."
                //         });
                //         return context.Response.WriteAsync(result);
                //     }
                // };

            });
            // additional
            services.AddAuthorization(options =>
            {
                options.FallbackPolicy = new AuthorizationPolicyBuilder()
                    .AddAuthenticationSchemes(JwtBearerDefaults.AuthenticationScheme)
                    .RequireAuthenticatedUser()
                    .Build();
            });

            return services;
        }

        // 🔧 Add Application Services (logging, etc.)
        public static IServiceCollection AddApplicationServices(this IServiceCollection services)
        {
            services.AddControllers();
            services.AddEndpointsApiExplorer();
            return services;
        }


        // 🔧 Add Swagger
        public static IServiceCollection AddSwagger(this IServiceCollection services)
        {
            services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo { Title = "SchoolAPI", Version = "v2" });
                // c.AddSecurityDefinition(JwtBearerDefaults.AuthenticationScheme, new OpenApiSecurityScheme
                c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    In = ParameterLocation.Header,
                    Description = "Please enter token with Bearer",
                    Name = "Authorization",
                    Type = SecuritySchemeType.Http,
                    BearerFormat = "JWT",
                    Scheme = "bearer"
                });
                c.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            },
                            Scheme = "auth2",
                            Name="Bearer",
                            In=ParameterLocation.Header,
                        },
                        Array.Empty<string>()
                    }
                });
                c.AddServer(new OpenApiServer
                {
                    Url = "http://localhost:5000",
                    Description = "Development Server"
                });
            });

            return services;
        }


        //   Add MediatR
        public static IServiceCollection AddMediatR(this IServiceCollection services, IConfiguration configure)
        {
            services.AddMediatR(configuration => configuration.RegisterServicesFromAssembly(typeof(Program).Assembly));
            return services;
        }

        // ReadExcel File Service
        public static IServiceCollection AddEpplus(this IServiceCollection service)
        {
            // TODO : do checking more for configure and using EPPLUS in asp.net core web api for read file from excel 
            service.AddEpplus();
            return service;
        }

        // FluentValidation : Normally used with minimal API but can be used here as well
        public static IServiceCollection AddFluentValidation(this IServiceCollection services)
        {
            services.AddValidatorsFromAssemblyContaining<Program>();
            return services;
        }
    }
}