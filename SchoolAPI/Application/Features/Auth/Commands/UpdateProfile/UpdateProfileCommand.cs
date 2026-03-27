#nullable enable

using MediatR;
using SchoolAPI.Application.Features.Auth.Common;

namespace SchoolAPI.Application.Features.Auth.Commands.UpdateProfile;

/// <summary>
/// Update profile command for CQRS pattern
/// </summary>
public record UpdateProfileCommand(
    string UserId,
    string? FullName = null,
    string? PhoneNumber = null,
    List<string>? Roles = null) 
    : IRequest<AuthResponse>;
