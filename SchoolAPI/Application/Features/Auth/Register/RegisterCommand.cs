using MediatR;
using SchoolAPI.Application.Common.Models;

namespace SchoolAPI.Application.Features.Auth.Register;

public record RegisterCommand(string Email, string Password, string FullName, List<string>? Roles = null) : IRequest<Result<RegisterResponse>>;

public class RegisterResponse
{
    public string UserId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public ICollection<string> Roles { get; set; } = new List<string>();
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
}
