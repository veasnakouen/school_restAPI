using System.Text;
using FluentValidation;
using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using SchoolAPI.Contracts;
using SchoolAPI.Authorization;
using SchoolAPI.Data;
using SchoolAPI.Constant;
using SchoolAPI.Entities;
using SchoolAPI.Helpers;
using SchoolAPI.Interfaces;
using SchoolAPI.Services;
using SchoolAPI.Services.Reporting;
using System.Security.Claims;
using System.Threading.RateLimiting;

namespace SchoolAPI.Extensions
{
    // collection of services to be added to the DI container  
    public static class ServiceCollectionExtensions
    {
        private const string BearerScheme = "Bearer";

        // 🔧 Add Database/DbContext :register the connection string 
        public static IServiceCollection AddDatabase(this IServiceCollection services, IConfiguration configuration)
        {
            var connectionString = configuration.GetConnectionString("DefaultConnection");
            services.AddDbContext<SchoolDbContext>(options =>
                options.UseNpgsql(connectionString)
                );
            // Register IApplicationDbContext
            services.AddScoped<SchoolAPI.Application.Common.Interfaces.IApplicationDbContext, SchoolDbContext>();

            return services;
        }

        // auto mapper
        public static IServiceCollection AddAutoMapper(this IServiceCollection service)
        {
            service.AddAutoMapper(cfg => { }, typeof(Program).Assembly);
            return service;
        }

        // 🔧 Core configure 
        public static void ConfigureCors(this IServiceCollection services)
        {
            services.AddCors(option =>
            {
                option.AddPolicy(name: "CorePolicy", builder =>
                {
                    builder.AllowAnyOrigin()
                    .AllowAnyMethod()
                    .AllowAnyHeader();
                });
            });
        }


        public static IServiceCollection AddIdentityCore(this IServiceCollection service, IConfiguration configuration)
        {
            service.AddIdentityCore<AppUser>(
                opt =>
                {
                    opt.Password.RequireDigit = true;
                    opt.Password.RequireNonAlphanumeric = false;
                    opt.Password.RequiredUniqueChars = 1;
                    opt.Password.RequiredLength = 6;
                    opt.User.RequireUniqueEmail = true;
                    opt.SignIn.RequireConfirmedEmail = false;
                }
            )
            .AddRoles<IdentityRole>()
            .AddRoleManager<RoleManager<IdentityRole>>()
            .AddEntityFrameworkStores<SchoolDbContext>()
            .AddDefaultTokenProviders()
            .AddRoleValidator<RoleManager<IdentityRole>>()
            .AddTokenProvider<DataProtectorTokenProvider<AppUser>>("SchoolAPI")
            .AddEntityFrameworkStores<SchoolDbContext>();
            return service;
        }

        // 🔧 Add Identity options with full ASP.NET Core Identity features
        public static IServiceCollection AddIdentityServices(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddIdentity<AppUser, AppRole>(options =>
                {
                    // Password settings
                    options.Password.RequireDigit = true;
                    options.Password.RequireLowercase = true;
                    options.Password.RequireUppercase = true;
                    options.Password.RequireNonAlphanumeric = false;
                    options.Password.RequiredLength = 8;
                    options.Password.RequiredUniqueChars = 1;

                    // User settings
                    options.User.RequireUniqueEmail = true;
                    options.User.AllowedUserNameCharacters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._@+";

                    // SignIn settings
                    options.SignIn.RequireConfirmedEmail = false;
                    options.SignIn.RequireConfirmedPhoneNumber = false;
                    options.SignIn.RequireConfirmedAccount = false;

                    // Lockout settings
                    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
                    options.Lockout.MaxFailedAccessAttempts = 5;
                    options.Lockout.AllowedForNewUsers = true;

                    // Account settings
                })
                .AddEntityFrameworkStores<SchoolDbContext>()
                .AddDefaultTokenProviders()
                .AddRoles<AppRole>()
                .AddRoleManager<RoleManager<AppRole>>()
                .AddUserManager<UserManager<AppUser>>()
                .AddSignInManager<SignInManager<AppUser>>();

            return services;
        }

        //  Add JWT Authentication
        public static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
        {
            services.Configure<JwtSettings>(configuration.GetSection("JwtSettings"));

            var jwtSettings = configuration.GetSection("JwtSettings").Get<JwtSettings>();
            if (string.IsNullOrEmpty(jwtSettings?.Secret))
                throw new InvalidOperationException("JWT Secret is missing.");

            services.AddScoped<ITokenService, TokenService>();

            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(BearerScheme, options =>
            {
                var isDevelopment = string.Equals(
                    configuration["ASPNETCORE_ENVIRONMENT"],
                    "Development",
                    StringComparison.OrdinalIgnoreCase);

                options.RequireHttpsMetadata = !isDevelopment;
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
            });

            services.AddAuthorization(options =>
            {
                options.FallbackPolicy = new AuthorizationPolicyBuilder()
                    .AddAuthenticationSchemes(JwtBearerDefaults.AuthenticationScheme)
                    .RequireAuthenticatedUser()
                    .Build();
            });

            services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();
            services.AddSingleton<IAuthorizationHandler, PermissionAuthorizationHandler>();

            services.Configure<CloudinarySettings>(configuration.GetSection("CloudinarySettings"));
            return services;
        }


        // 🔧 Add Application Services (logging, etc.)
        public static IServiceCollection AddApplicationServices(this IServiceCollection services)
        {
            services.AddEndpointsApiExplorer();
            
            // Register application services
            services.AddScoped<IPhotoService, PhotoService>();
            services.AddScoped<SchoolAPI.Services.ICurrentUserService, CurrentUserService>();
            services.AddSingleton<ICacheStore, RedisCacheStore>();
            services.AddSingleton<ICacheVersionService, CacheVersionService>();
            services.AddScoped<IAssessmentRequestReportService, AssessmentRequestReportService>();
            services.AddScoped<IStudentAssessmentRequestReportService, StudentAssessmentRequestReportService>();
            services.AddScoped<IMonthlyTransactionReportService, MonthlyTransactionReportService>();
            services.AddScoped<IMonthlyTransactionReportJob, MonthlyTransactionReportJob>();
            
            return services;
        }

        public static IServiceCollection AddHangfireServices(this IServiceCollection services, IConfiguration configuration)
        {
            var connectionString = configuration.GetConnectionString("DefaultConnection");
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                throw new InvalidOperationException("Default connection string is missing. Hangfire requires a PostgreSQL connection string.");
            }

            services.AddHangfire(config =>
            {
                config.UseSimpleAssemblyNameTypeSerializer();
                config.UseRecommendedSerializerSettings();
                config.UsePostgreSqlStorage(storageOptions => storageOptions.UseNpgsqlConnection(connectionString));
            });

            services.AddHangfireServer();
            return services;
        }

        // 🔧 Rate limiting
        public static IServiceCollection AddRateLimiting(this IServiceCollection services)
        {
            services.AddRateLimiter(options =>
            {
                options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

                options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
                {
                    var partitionKey = GetRateLimitPartitionKey(httpContext);
                    return RateLimitPartition.GetFixedWindowLimiter(
                        partitionKey,
                        _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = 300,
                            Window = TimeSpan.FromMinutes(1),
                            QueueLimit = 0,
                            AutoReplenishment = true
                        });
                });

                options.AddPolicy("auth", httpContext =>
                {
                    var partitionKey = GetRateLimitPartitionKey(httpContext);
                    return RateLimitPartition.GetFixedWindowLimiter(
                        partitionKey,
                        _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = 5,
                            Window = TimeSpan.FromMinutes(1),
                            QueueLimit = 0,
                            AutoReplenishment = true
                        });
                });

                options.AddPolicy("report", httpContext =>
                {
                    var partitionKey = GetRateLimitPartitionKey(httpContext);
                    return RateLimitPartition.GetFixedWindowLimiter(
                        partitionKey,
                        _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = 2,
                            Window = TimeSpan.FromMinutes(1),
                            QueueLimit = 0,
                            AutoReplenishment = true
                        });
                });

                options.OnRejected = async (context, cancellationToken) =>
                {
                    context.HttpContext.Response.Headers.RetryAfter = "60";
                    context.HttpContext.Response.ContentType = "application/json";
                    await context.HttpContext.Response.WriteAsJsonAsync(
                        new { error = "Too many requests. Please try again later." },
                        cancellationToken);
                };
            });
            return services;
        }   

        private static string GetRateLimitPartitionKey(HttpContext httpContext)
        {
            var userId = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!string.IsNullOrWhiteSpace(userId))
            {
                return $"user:{userId}";
            }

            var remoteIpAddress = httpContext.Connection.RemoteIpAddress?.ToString();
            if (!string.IsNullOrWhiteSpace(remoteIpAddress))
            {
                return $"ip:{remoteIpAddress}";
            }

            return "ip:unknown";
        }


        // 🔧 Add Swagger
        public static IServiceCollection AddSwagger(this IServiceCollection services)
        {
            services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo { Title = "SchoolAPI", Version = "v2" });
                c.AddSecurityDefinition(BearerScheme, new OpenApiSecurityScheme
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
                                Id = BearerScheme
                            },
                            Scheme = "auth2",
                            Name = BearerScheme,
                            In=ParameterLocation.Header,
                        },
                        Array.Empty<string>()
                    }
                });
                c.AddServer(new OpenApiServer
                {
                    Url = "http://localhost:5001",
                    Description = "Development Server"
                });
            });

            return services;
        }

        //   Add MediatR
        public static IServiceCollection AddMediatR(this IServiceCollection services, IConfiguration configure)
        {
            services.AddMediatR(configuration => 
                configuration.RegisterServicesFromAssemblies(
                    typeof(SchoolAPI.Application.Features.Classes.GetById.GetClassByIdQuery).Assembly
                ));
            return services;
        }

        // ReadExcel File Service
        public static IServiceCollection ConfigureEpplus(this IServiceCollection service)
        {
            OfficeOpenXml.ExcelPackage.License.SetNonCommercialPersonal("SchoolAPI");
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