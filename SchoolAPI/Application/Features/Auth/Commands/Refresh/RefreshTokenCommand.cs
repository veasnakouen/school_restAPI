#nullable enable

using MediatR;
using SchoolAPI.Application.Features.Auth.Common;

namespace SchoolAPI.Application.Features.Auth.Commands.Refresh;

/// <summary>
/// Refresh token command for CQRS pattern
/// </summary>
public record RefreshTokenCommand(string AccessToken, string RefreshToken) 
    : IRequest<AuthResponse>;
