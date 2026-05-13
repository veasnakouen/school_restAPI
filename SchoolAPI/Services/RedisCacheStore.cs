using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;
using SchoolAPI.Interfaces;

namespace SchoolAPI.Services;

public class RedisCacheStore : ICacheStore
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);
    private readonly IDistributedCache _cache;

    public RedisCacheStore(IDistributedCache cache)
    {
        _cache = cache;
    }

    public Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
    {
        var payload = _cache.GetString(key);
        if (string.IsNullOrWhiteSpace(payload))
        {
            return Task.FromResult<T?>(default);
        }

        return Task.FromResult(JsonSerializer.Deserialize<T>(payload, SerializerOptions));
    }

    public Task SetAsync<T>(string key, T value, TimeSpan absoluteExpirationRelativeToNow, TimeSpan? slidingExpiration = null, CancellationToken cancellationToken = default)
    {
        var options = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = absoluteExpirationRelativeToNow
        };

        if (slidingExpiration.HasValue)
        {
            options.SlidingExpiration = slidingExpiration;
        }

        var payload = JsonSerializer.Serialize(value, SerializerOptions);
        _cache.SetString(key, payload, options);
        return Task.CompletedTask;
    }
}