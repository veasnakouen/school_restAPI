using MediatR;
using SchoolAPI.Application.Common.Models;

namespace SchoolAPI.Application.Features.Auth.ResetPassword;

public record ResetPasswordCommand(string Email, string Token, string NewPassword) : IRequest<Result<ResetPasswordResponse>>;

public class ResetPasswordResponse
{
    public string Message { get; set; } = string.Empty;
    public bool IsSuccess { get; set; }
}
