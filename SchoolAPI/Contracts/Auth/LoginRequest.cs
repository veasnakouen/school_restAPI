#nullable enable

using System.ComponentModel.DataAnnotations;
using System.Diagnostics.CodeAnalysis;

namespace SchoolAPI.Contracts.Auth;

public class LoginRequest
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    [Required(ErrorMessage = "Email is required!")]
    [AllowNull]
    public string Email { get; set; }
    [Required(ErrorMessage = "Password is required!")]
    [AllowNull]
    public string Password { get; set; }
}
public class LoginDto
{
    [AllowNull]
    public string Email { get; set; }
    [AllowNull]
    public string Password { get; set; }
}
