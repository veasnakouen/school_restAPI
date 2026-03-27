
# NOTICE

```text
text⭐ to make our Program.cs be clean/tidy-up we need to create/add extension method  
 🔥Extension Methods enable us to add method to existing type without creating a new derived type Or modify the original type.
    this class need to be static type
```

## List

```text

```

### ApplicationSErvice

#### ⭐ApplicationServiceExtension.cs

```code
Ex:> 
    namespace SchoolAPI.Extensions;
    public static class ApplicationServicesExtensions
    {
        //this method we want to return the IServiceCollection 
        //in here we can add all service (dbcontext, cors, jwttoken, )
        public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration config)
        {
            //Ex:
            services.AddScope<ITokenService,TokenService>();
            services.AddDbContext<SchoolDbcontext>(option=>{
                option.UseSqlite(config.GetConnectionString("DefaultConnection"));
            });
            return services;
        }   
    }
```

### IdentityService  

### ⭐IdentityServic eExtension.cs

```code
namespace SchoolAPI.Extensions;
public static class ⭐IdentityServiceExtension
{
    public static IServiceCollection AddIdentityService(this IServiceCollection services,IConfiguration config)
    {
        Services.AddAuthentication(JwtBearerDefaults.AuthenticaionScheme)
        .AddJwtBearer(options=>
        {
            options.TokenValidationParameters = new jTokenValidationParameters
            {
                ValidateIssuerSigningkey = true,
                IssuerSigningkey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["TokenKey"])),
                ValidateIssuer = false,
                ValidateAudience = false,
            };	
        });
        return services;
    }
}
```

## In Program.Cs file

-[List](#list)
        -[IdentityService](#identityservice)
        -[ApplicationService](#applicationservice)

```code
builder.Services.AddApplicationServices(_config);
builder.Services.AddIdentityService(_config);
```
