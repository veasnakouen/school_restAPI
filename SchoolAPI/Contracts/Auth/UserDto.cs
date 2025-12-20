using System.Security.AccessControl;

namespace SchoolAPI.Constant.Auth;
public record UserDto
{
    public string  UserName { get; set; }
    public string  Token { get; set; }
}