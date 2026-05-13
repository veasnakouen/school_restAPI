using System.ComponentModel.DataAnnotations;

namespace SchoolAPI.Contracts.Auth;

public class ForgotPasswordRequest
{
    [Required(ErrorMessage = "Email is required!")]
    [EmailAddress(ErrorMessage = "Invalid email format!")]
    public string Email { get; set; } = string.Empty;
}

public class ResetPasswordRequest
{
    [Required(ErrorMessage = "Email is required!")]
    [EmailAddress(ErrorMessage = "Invalid email format!")]
    public string Email { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Token is required!")]
    public string Token { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "New password is required!")]
    [DataType(DataType.Password)]
    [MinLength(8, ErrorMessage = "Password must be at least 8 characters long.")]
    public string NewPassword { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Please confirm your password!")]
    [DataType(DataType.Password)]
    [Compare("NewPassword", ErrorMessage = "Passwords do not match.")]
    public string ConfirmPassword { get; set; } = string.Empty;
}
