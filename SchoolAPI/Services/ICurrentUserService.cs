#nullable enable
namespace SchoolAPI.Services
{
    public interface ICurrentUserService
    {
        string? GetUserId();
        Task<string> GetUserEmailAsync();
    }
}