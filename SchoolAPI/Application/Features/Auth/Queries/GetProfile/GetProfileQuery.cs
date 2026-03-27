#nullable enable

using MediatR;
using SchoolAPI.Application.Features.Auth.Common;

namespace SchoolAPI.Application.Features.Auth.Queries.GetProfile;

/// <summary>
/// Get user profile query for CQRS pattern
/// </summary>
public record GetProfileQuery(string UserId) : IRequest<AuthResponse>;
