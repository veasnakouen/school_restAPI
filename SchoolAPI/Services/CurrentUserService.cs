using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using SchoolAPI.Application.Common.Interfaces;

namespace SchoolAPI.Services;

public class CurrentUserService : SchoolAPI.Application.Common.Interfaces.ICurrentUserService, SchoolAPI.Services.ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public string? UserId => _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);
    
    public string? Email => _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.Email);
    
    public bool IsAuthenticated => _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;

    public string? GetUserId() => UserId;

    public Task<string> GetUserEmailAsync() => Task.FromResult(Email ?? string.Empty);
}