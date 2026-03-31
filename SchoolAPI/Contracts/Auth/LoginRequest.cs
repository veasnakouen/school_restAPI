using System.ComponentModel.DataAnnotations;

namespace SchoolAPI.Contracts.Auth;

public class LoginRequest
{
    [Required(ErrorMessage = "Email is required!")]
    public string Email { get; set; }
    [Required(ErrorMessage = "Password is required!")]
    public string Password { get; set; }
}
public class LoginDto
{
    public string Email { get; set; }
    public string Password { get; set; }
}
