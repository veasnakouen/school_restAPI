#nullable enable

using System.Diagnostics.CodeAnalysis;

namespace SchoolAPI.Constant.Auth;
public record UserDto
{
    [AllowNull]
    public string  UserName { get; set; }
    [AllowNull]
    public string Token { get; set; }
    public string? RefreshToken { get; set; }
}