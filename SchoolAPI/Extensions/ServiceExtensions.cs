using System.Text.Json.Serialization;
using Microsoft.AspNetCore.HttpOverrides;
using SchoolAPI.RequestHelper;
using SchoolAPI.Services;

namespace schoolAPI.Extensions;

public static class ServiceCollectionsExtensions
{
    public static IServiceCollection AddServices(this IServiceCollection services)
    {
        // Register your services here
        services.AddScoped<ClassService>();
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
        services.AddRazorPages();
        services.AddHttpContextAccessor();
        services.AddProblemDetails();
        services.AddAutoMapper(cfg => { }, typeof(MappingProfile).Assembly);

        services.Configure<ForwardedHeadersOptions>(options =>
       {
           options.ForwardedHeaders =
               ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
       });

        return services;
    }
}