using MediatR;
using SchoolAPI.Application.Common.Models;

namespace SchoolAPI.Application.Features.Auth.ForgotPassword;

public record ForgotPasswordCommand(string Email) : IRequest<Result<ForgotPasswordResponse>>;

public class ForgotPasswordResponse
{
    public string Message { get; set; } = string.Empty;
    public bool IsSuccess { get; set; }
    public string? ResetToken { get; set; } // Remove in production
}
