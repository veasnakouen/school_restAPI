#nullable enable

using MediatR;
using SchoolAPI.Application.Features.Auth.Common;

namespace SchoolAPI.Application.Features.Auth.Commands.Login;

/// <summary>
/// Login command for CQRS pattern
/// </summary>
public record LoginCommand(string Email, string Password) 
    : IRequest<AuthResponse>;
