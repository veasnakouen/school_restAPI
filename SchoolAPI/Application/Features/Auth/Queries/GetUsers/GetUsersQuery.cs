#nullable enable

using MediatR;

namespace SchoolAPI.Application.Features.Auth.Queries.GetUsers;

/// <summary>
/// Get all users query result
/// </summary>
public record UserListItem
{
    public string Id { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public ICollection<string> Roles { get; init; } = new List<string>();
}

/// <summary>
/// Get all users query for CQRS pattern
/// </summary>
public record GetUsersQuery(string? FilterOn = null, string? FilterQuery = null) 
    : IRequest<GetUsersQueryResponse>;

/// <summary>
/// Response for GetUsersQuery
/// </summary>
public record GetUsersQueryResponse
{
    public bool IsSuccess { get; init; }
    public string Message { get; init; } = string.Empty;
    public List<UserListItem>? Users { get; init; }
    public int TotalCount { get; init; }
}
