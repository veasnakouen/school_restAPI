
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using SchoolAPI.Entities;
using SchoolAPI.Interfaces;

namespace SchoolAPI.Services;


public class TokenServices(IConfiguration config) : ITokenServices
// public class TokenServices: ITokenServices
{
    //with the old version
    //use to encrypt and decrypt the electronic information     
    // private readonly SymmetricSecurityKey _key;
    // public TokenServices(IConfiguration config)
    // {
    //     _key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["TokenKdy"]));
    // }
    public string CreateToken(AppUser user)
    {
        var tokenKey = config["TokenKey"] ?? throw new Exception("Can not get token key.");

        if (tokenKey.Length < 64)
            throw new Exception("YOur token key need to be >=64 characters");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(tokenKey));


        var claims = new List<Claim>
        {
            //user NameId to store UserName
            // old version 
            // new Claim(JwtRegisteredClaimNames.NameId, user.UserName)
            new(ClaimTypes.Email,user.Email),
            new(ClaimTypes.NameIdentifier,user.Id)
        };

        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.Now.AddDays(7),
            SigningCredentials = creds
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);

        return tokenHandler.WriteToken(token);

    }
}
// for using our service 
// we need to register our service in program.cs file or in our service collection
// AddScoped : 
// builder.Service.AddScoped<ITokenServices TokenServices>();