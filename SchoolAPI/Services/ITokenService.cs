using System.Security.Claims;
using SchoolAPI.Entities;

namespace SchoolAPI.Services;

public interface ITokenService
{
    // 
    // Task<string> GenerateAccessToken(AppUser user, IEnumerable<string> roles);
    string GenerateAccessToken(AppUser user, IEnumerable<string> roles);
    string GenerateRefreshToken();
    ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
    //
    // 
    // 
}