#nullable enable

using MediatR;
using Microsoft.AspNetCore.Identity;
using SchoolAPI.Application.Features.Auth.Common;
using SchoolAPI.Entities;
using AuthResponse = SchoolAPI.Application.Features.Auth.Common.AuthResponse;

namespace SchoolAPI.Application.Features.Auth.Queries.GetProfile;

/// <summary>
/// Handler for GetProfileQuery
/// </summary>
public class GetProfileQueryHandler : IRequestHandler<GetProfileQuery, AuthResponse>
{
    private readonly UserManager<AppUser> _userManager;

    public GetProfileQueryHandler(UserManager<AppUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task<AuthResponse> Handle(GetProfileQuery request, CancellationToken cancellationToken)
    {
        // Find user by ID
        var user = await _userManager.FindByIdAsync(request.UserId);
        if (user == null)
        {
            return new AuthResponse
            {
                IsSuccess = false,
                Message = "User not found"
            };
        }

        // Get user roles
        var roles = await _userManager.GetRolesAsync(user);

        return new AuthResponse
        {
            IsSuccess = true,
            Message = "Profile retrieved successfully",
            UserId = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            Roles = roles.ToList()
        };
    }
}
