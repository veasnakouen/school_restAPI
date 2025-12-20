using System.Text.Json.Serialization;
using Microsoft.AspNetCore.HttpOverrides;
using SchoolAPI.RequestHelper;

namespace schoolAPI.Extensions;

public static class ServiceCollectionsExtensions
{
    public static IServiceCollection AddServices(this IServiceCollection services)
    {
        // Register your services here
        services.AddScoped<ClassService>();
        // services.AddScoped<QrcodeService>();
        services.AddControllersWithViews();
        services.AddControllers();
        services.AddRazorPages();
        services.AddEndpointsApiExplorer();
        services.AddOpenApi();
        services.AddHttpContextAccessor();
        services.AddProblemDetails();
        services.AddAutoMapper(typeof(MappingProfile));

        services.Configure<ForwardedHeadersOptions>(options =>
       {
           options.ForwardedHeaders =
               ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
       });
        services.AddControllers()
         .AddJsonOptions(options =>
             {
                 options
                     .JsonSerializerOptions
                     .Converters
                     .Add(new JsonStringEnumConverter());
                 options
                     .JsonSerializerOptions
                     .PropertyNameCaseInsensitive = true;
                 options
                     .JsonSerializerOptions
                     .ReferenceHandler = ReferenceHandler.IgnoreCycles;
                 options
                     .JsonSerializerOptions
                     .DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
             });

        return services;
    }
}