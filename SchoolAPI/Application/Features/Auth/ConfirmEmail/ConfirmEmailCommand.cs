using MediatR;
using SchoolAPI.Application.Common.Models;

namespace SchoolAPI.Application.Features.Auth.ConfirmEmail;

public record ConfirmEmailCommand(string UserId, string Token) : IRequest<Result<ConfirmEmailResponse>>;

public class ConfirmEmailResponse
{
    public string Message { get; set; } = string.Empty;
    public bool IsSuccess { get; set; }
}
