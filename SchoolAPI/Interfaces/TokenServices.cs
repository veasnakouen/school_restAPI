using SchoolAPI.Entities;

namespace SchoolAPI.Interfaces;
// Neilcuming tutorial
public interface ITokenServices
{
    string CreateToken(AppUser user);
}