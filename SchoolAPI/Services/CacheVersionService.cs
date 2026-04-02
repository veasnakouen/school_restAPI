using Microsoft.Extensions.Caching.Distributed;
using SchoolAPI.Interfaces;

namespace SchoolAPI.Services;

public class CacheVersionService : ICacheVersionService
{
    private readonly IDistributedCache _cache;

    public CacheVersionService(IDistributedCache cache)
    {
        _cache = cache;
    }

    public string GetVersion(string scope)
    {
        var versionKey = GetVersionKey(scope);
        var version = _cache.GetString(versionKey);
        if (!string.IsNullOrWhiteSpace(version))
        {
            return version;
        }

        var newVersion = Guid.NewGuid().ToString("N");
        _cache.SetString(versionKey, newVersion, new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(30)
        });

        return newVersion;
    }

    public void Invalidate(string scope)
    {
        _cache.SetString(GetVersionKey(scope), Guid.NewGuid().ToString("N"), new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(30)
        });
    }

    private static string GetVersionKey(string scope)
    {
        return $"cache:version:{scope}";
    }
}