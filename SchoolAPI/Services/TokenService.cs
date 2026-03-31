using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using SchoolAPI.Contracts;
using SchoolAPI.Entities;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace SchoolAPI.Services;

public class TokenService : ITokenService
{
    private readonly JwtSettings _jwtSettings;
    private readonly IConfiguration _configuration;

    public TokenService(IOptions<JwtSettings> jwtSettings,
         IConfiguration configuration
    )
    {
        _jwtSettings = jwtSettings.Value;
        _configuration = configuration;
    }

    public string GenerateAccessToken(AppUser user, IEnumerable<string> roles)
    {
        var secret = _configuration["JwtSettings:Secret"];

        var claims = new List<Claim>
                {
                    new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                    new Claim(JwtRegisteredClaimNames.Email, user.Email!),
                    new Claim(JwtRegisteredClaimNames.Name,user.FullName ?? user.UserName),
                    new Claim(ClaimTypes.NameIdentifier, user.Id),
                    new Claim(ClaimTypes.Email, user.Email!),
                    new Claim(ClaimTypes.Name, user.Email!),
                    new Claim(JwtRegisteredClaimNames.Jti,Guid.NewGuid().ToString())

                };
        // Add Roles
        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));
        // Expiry Time
        var expiryMinutes = _jwtSettings.ExpiryInMinutes > 0 ? _jwtSettings.ExpiryInMinutes : 120;

        //use UTF8 encoding
        var keyBytes = Encoding.UTF8.GetBytes(secret!);
        var key = new SymmetricSecurityKey(keyBytes);
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["JwtSettings:Issuer"],
            audience: _configuration["JwtSettings:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: creds
            );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    // Generates a cryptographically secure refresh token
    public string GenerateRefreshToken()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }

    public ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
    {
        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = false,
            ValidateIssuer = false,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Secret!)),
            ValidateLifetime = false
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        try
        {
            return tokenHandler.ValidateToken(token, tokenValidationParameters, out _);
        }
        catch
        {
            return null;
        }
    }
}