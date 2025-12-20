using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
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