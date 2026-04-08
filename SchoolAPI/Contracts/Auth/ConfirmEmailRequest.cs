using System.ComponentModel.DataAnnotations;

namespace SchoolAPI.Contracts.Auth;

public class ConfirmEmailRequest
{
    [Required(ErrorMessage = "User ID is required!")]
    public string UserId { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Confirmation token is required!")]
    public string Token { get; set; } = string.Empty;
}

public class ResendConfirmationEmailRequest
{
    [Required(ErrorMessage = "Email is required!")]
    [EmailAddress(ErrorMessage = "Invalid email format!")]
    public string Email { get; set; } = string.Empty;
}
