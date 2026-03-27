#nullable enable

using MediatR;
using SchoolAPI.Application.Features.Auth.Common;

namespace SchoolAPI.Application.Features.Auth.Queries.GetUser;

/// <summary>
/// Get single user query for CQRS pattern
/// </summary>
public record GetUserQuery(string UserId) : IRequest<AuthResponse>;
