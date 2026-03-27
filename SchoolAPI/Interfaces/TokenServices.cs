using SchoolAPI.Entities;

#nullable enable

namespace SchoolAPI.Interfaces;
// Neilcuming tutorial
public interface ITokenServices
{
    string CreateToken(AppUser user);
    string? RefreshToken(AppUser user);
}