using System.Security.Claims;
using SchoolAPI.Entities;

namespace SchoolAPI.Services;

public interface ITokenService
{
    Task<string> GenerateAccessToken(AppUser user, IEnumerable<string> roles);
    string GenerateRefreshToken();
    string HashRefreshToken(string refreshToken);
    bool VerifyRefreshToken(string storedHash, string refreshToken);

    ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
}