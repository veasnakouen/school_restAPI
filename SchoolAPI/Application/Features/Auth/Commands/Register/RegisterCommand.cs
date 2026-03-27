#nullable enable

using MediatR;
using SchoolAPI.Application.Features.Auth.Common;

namespace SchoolAPI.Application.Features.Auth.Commands.Register;

/// <summary>
/// Register command for CQRS pattern
/// </summary>
public record RegisterCommand(
    string Email,
    string Password,
    string FullName,
    List<string>? Roles = null) 
    : IRequest<AuthResponse>;
