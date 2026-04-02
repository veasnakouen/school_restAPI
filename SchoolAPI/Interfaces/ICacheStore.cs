namespace SchoolAPI.Interfaces;

public interface ICacheStore
{
    Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default);
    Task SetAsync<T>(string key, T value, TimeSpan absoluteExpirationRelativeToNow, TimeSpan? slidingExpiration = null, CancellationToken cancellationToken = default);
}