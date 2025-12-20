using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using SchoolAPI.Contracts;
using SchoolAPI.Data;

namespace SchoolAPI.Extensions
{
    // Allow any origin, method, and header
    public static partial class ApplicationService
    {
        public static void ConfigureCores(this IServiceCollection services)
        {
            services.AddCors(options =>
            {
                options.AddPolicy("CorePolicy", builder =>
            {
                builder.AllowAnyOrigin()
                .AllowAnyMethod()
                .AllowAnyHeader();
            });
            });
        }
        public static void ConfigureIdentity(this IServiceCollection services)
        {
            services.AddIdentityCore<IdentityUser>(o =>
            {
                o.Password.RequireDigit = true;//true
                o.Password.RequireLowercase = true;//true
                o.Password.RequireNonAlphanumeric = false;
                o.Password.RequireUppercase = false;
                o.Password.RequiredLength = 8;
                // o.User.RequireUniqueEmail = true;
            }).AddEntityFrameworkStores<SchoolDbContext>()
            .AddDefaultTokenProviders();
        }

        public static IServiceCollection ConfigureJwt(this IServiceCollection services, IConfiguration configuration)
        {
            var jwtSettings = configuration.GetSection("JwtSettings").Get<JwtSettings>();
            if (jwtSettings == null || string.IsNullOrEmpty(jwtSettings.Secret))
            {
                throw new InvalidOperationException("JWT secret key is no configured.");
            }

            var secretKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Secret));
            services.AddAuthentication(o =>
            {
                o.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                o.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            }).AddJwtBearer(o =>
            {
                o.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtSettings.Issuer,
                    ValidAudience = jwtSettings.Audience,
                    IssuerSigningKey = secretKey
                };
                o.Events = new JwtBearerEvents
                {
                    OnChallenge = context =>
                    {
                        context.HandleResponse();
                        context.Response.StatusCode = 401;
                        context.Response.ContentType = "application/json";
                        var result = System.Text.Json.JsonSerializer.Serialize(new
                        {
                            message = " You are not authorized to access this resource. please authentication."
                        });
                        return context.Response.WriteAsync(result);
                    },
                };
            });
            return services;
        }

        
    }
}

// 🔥 In Program.cs file 
// builder.Services.ConfigureCores();
// builder.Services.ConfigureIdentity();
// builder.Services.ConfigureJwt(); 
// 🔥 if we use return type as IServiceCollection and return service in each of our method (above)
// in Program.cs file we can :
// builder.Services.ConfigureCores()
// .ConfigureIdentity()
// .ConfigureJwt();
