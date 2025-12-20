using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using SchoolAPI.Contracts;
using SchoolAPI.Entities;
using System.CodeDom;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

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

    // public async Task<string> GenerateAccessToken(AppUser user, IEnumerable<string> roles)
    public string GenerateAccessToken(AppUser user, IEnumerable<string> roles)
    {


        //  var key = Encoding.ASCII.GetBytes(_configuration.GetSection("JwtSettings:Secret").Value!);
        //  var key = Encoding.ASCII.GetBytes(_configuration.GetValue<string>("JwtSettings:Secret"));
        //  var cred = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256);
        var secret = _configuration["JwtSettings:Secret"];
        var issuer = _configuration["JwtSettings:Issuer"];
        var audience = _configuration["JwtSettings:Audience"];

        var claims = new List<Claim>
                {
                    // new Claim(ClaimTypes.NameIdentifier, user.Id),
                    // new Claim(ClaimTypes.Email, user.Email!),
                    // new Claim(ClaimTypes.Name, user.FullName ?? user.UserName!)
                    new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                    new Claim(JwtRegisteredClaimNames.Email, user.Email!),
                    new Claim(JwtRegisteredClaimNames.Name,user.FullName ?? user.UserName),
                    new Claim(JwtRegisteredClaimNames.Jti,Guid.NewGuid().ToString())

                };
        // Add Roles
        // .Concat(roles.Select(r => new Claim(ClaimTypes.Role, r))).ToArray();
        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));
        // Calculate expiration in Seconds (Unix  timestamp)
        var exp = DateTime.UtcNow.AddMinutes(120);
        var expSeconds = ((DateTimeOffset)exp).ToUnixTimeSeconds();
        // Add exp as INTEGER (not date time)
        claims.Add(new Claim("exp", expSeconds.ToString(), ClaimValueTypes.Integer64));
        //// convert to array
        // var claimArray = claims.ToArray();


        //use UTF* encoding
        var keyBytes = Encoding.UTF8.GetBytes(secret!);
        // var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Secret!));
        var key = new SymmetricSecurityKey(keyBytes);
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            // issuer: _jwtSettings.Issuer,
            // audience: _jwtSettings.Audience,
            // expires: DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryInMinutes),
            issuer: _configuration["JwtSettings:Issuer"],
            audience: _configuration["JwtSettings:Audience"],
            claims: claims,
            // claims: await GetClaimsAsync(user),
            expires: DateTime.UtcNow.AddDays(7),//this set 'exp' correctly
                                                //notBefore:DateTime.UtcNow, //optional
            signingCredentials: creds
            );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    // 
    public string GenerateRefreshToken() => Guid.NewGuid().ToString();

    // 
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

#region Jwt from books tutorial.
public class JwtHandler
{
    private readonly IConfiguration _configuration;
    public UserManager<AppUser> _userManager;

    public JwtHandler(IConfiguration configuration, UserManager<AppUser> userManager)
    {
        _userManager = userManager;
        _configuration = configuration;
    }

    public async Task<JwtSecurityToken> GetTokenAsync(AppUser user)
    {
        var jwtOptions = new JwtSecurityToken(
            issuer: _configuration["JwtSettings:Issuer"],
            audience: _configuration["JwtSettings:Audience"],
            claims: await GetClaimsAsync(user),
            expires: DateTime.Now.AddMinutes(Convert.ToDouble(_configuration["JwtSettings:ExpiryInMinutes"])),
            signingCredentials: GetSigningCredentials());

        return jwtOptions;

    }
    private SigningCredentials GetSigningCredentials()
    {
        var key = Encoding.UTF8.GetBytes(
                _configuration["JwtSettings:Secret"]);
        var secret = new SymmetricSecurityKey(key);
        return new SigningCredentials(secret, SecurityAlgorithms.HmacSha256);
    }

    private async Task<List<Claim>> GetClaimsAsync(AppUser user)
    {
        var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Name,user.Email)
            };
        foreach (var role in await _userManager.GetRolesAsync(user))
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }
        return claims;
    }

}
#endregion