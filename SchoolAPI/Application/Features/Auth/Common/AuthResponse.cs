#nullable enable

namespace SchoolAPI.Application.Features.Auth.Common;

/// <summary>
/// Standard auth response DTO for CQRS pattern
/// </summary>
public record AuthResponse
{
    public bool IsSuccess { get; init; }
    public string Message { get; init; } = string.Empty;
    public string? AccessToken { get; init; }
    public string? RefreshToken { get; init; }
    public DateTime? ExpiresAt { get; init; }
    public string? UserId { get; init; }
    public string? Email { get; init; }
    public string? FullName { get; init; }
    public ICollection<string> Roles { get; init; } = new List<string>();
}

/// <summary>
/// User profile response
/// </summary>
public record UserProfileResponse
{
    public string Id { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string? PhoneNumber { get; init; }
    public ICollection<string> Roles { get; init; } = new List<string>();
    public bool PhoneNumberConfirmed { get; init; }
    public int AccessFailedCount { get; init; }
}
