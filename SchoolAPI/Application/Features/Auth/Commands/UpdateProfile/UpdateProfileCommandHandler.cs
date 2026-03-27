#nullable enable

using MediatR;
using Microsoft.AspNetCore.Identity;
using SchoolAPI.Application.Features.Auth.Common;
using SchoolAPI.Entities;
using AuthResponse = SchoolAPI.Application.Features.Auth.Common.AuthResponse;

namespace SchoolAPI.Application.Features.Auth.Commands.UpdateProfile;

/// <summary>
/// Handler for UpdateProfileCommand
/// </summary>
public class UpdateProfileCommandHandler : IRequestHandler<UpdateProfileCommand, AuthResponse>
{
    private readonly UserManager<AppUser> _userManager;

    public UpdateProfileCommandHandler(UserManager<AppUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task<AuthResponse> Handle(UpdateProfileCommand request, CancellationToken cancellationToken)
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

        // Update user properties
        if (!string.IsNullOrEmpty(request.FullName))
            user.FullName = request.FullName;

        if (!string.IsNullOrEmpty(request.PhoneNumber))
            user.PhoneNumber = request.PhoneNumber;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            return new AuthResponse
            {
                IsSuccess = false,
                Message = $"Failed to update profile: {errors}"
            };
        }

        // Update roles if provided
        if (request.Roles != null && request.Roles.Count > 0)
        {
            var currentRoles = await _userManager.GetRolesAsync(user);
            await _userManager.RemoveFromRolesAsync(user, currentRoles);
            await _userManager.AddToRolesAsync(user, request.Roles);
        }

        var updatedRoles = await _userManager.GetRolesAsync(user);
        return new AuthResponse
        {
            IsSuccess = true,
            Message = "Profile updated successfully",
            UserId = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            Roles = updatedRoles.ToList()
        };
    }
}
