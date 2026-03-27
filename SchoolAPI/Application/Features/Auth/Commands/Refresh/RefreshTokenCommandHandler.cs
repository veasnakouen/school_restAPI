#nullable enable

using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Identity;
using SchoolAPI.Application.Features.Auth.Common;
using SchoolAPI.Entities;
using SchoolAPI.Interfaces;
using SchoolAPI.Services;
using AuthResponse = SchoolAPI.Application.Features.Auth.Common.AuthResponse;

namespace SchoolAPI.Application.Features.Auth.Commands.Refresh;

/// <summary>
/// Handler for RefreshTokenCommand
/// </summary>
public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, AuthResponse>
{
    private readonly UserManager<AppUser> _userManager;
    private readonly ITokenService _tokenService;

    public RefreshTokenCommandHandler(
        UserManager<AppUser> userManager,
        ITokenService tokenService)
    {
        _userManager = userManager;
        _tokenService = tokenService;
    }

    public async Task<AuthResponse> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        // Get principal from expired token
        var principal = _tokenService.GetPrincipalFromExpiredToken(request.AccessToken);
        if (principal == null)
        {
            return new AuthResponse
            {
                IsSuccess = false,
                Message = "Invalid access token"
            };
        }

        // Extract email from claims
        var email = principal.FindFirst(ClaimTypes.Email)?.Value;
        if (email == null)
        {
            return new AuthResponse
            {
                IsSuccess = false,
                Message = "Invalid token"
            };
        }

        // Find user by email
        var user = await _userManager.FindByEmailAsync(email);
        if (user == null || 
            user.RefreshToken != request.RefreshToken || 
            user.RefreshTokenExpiryTime <= DateTime.UtcNow)
        {
            return new AuthResponse
            {
                IsSuccess = false,
                Message = "Invalid refresh token"
            };
        }

        // Generate new tokens
        var roles = await _userManager.GetRolesAsync(user);
        var newAccessToken = _tokenService.GenerateAccessToken(user, roles);
        var newRefreshToken = _tokenService.GenerateRefreshToken();

        // Update refresh token in database
        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await _userManager.UpdateAsync(user);

        return new AuthResponse
        {
            IsSuccess = true,
            Message = "Token refreshed successfully",
            AccessToken = newAccessToken,
            RefreshToken = newRefreshToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(15),
            UserId = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            Roles = roles.ToList()
        };
    }
}
