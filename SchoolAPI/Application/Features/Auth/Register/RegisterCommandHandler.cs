using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Constant;
using SchoolAPI.Contracts;
using SchoolAPI.Entities;
using SchoolAPI.Services;

namespace SchoolAPI.Application.Features.Auth.Register;

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, Result<RegisterResponse>>
{
    private readonly UserManager<AppUser> _userManager;
    private readonly ITokenService _tokenService;
    private readonly JwtSettings _jwtSettings;

    public RegisterCommandHandler(
        UserManager<AppUser> userManager,
        ITokenService tokenService,
        IOptions<JwtSettings> jwtSettings)
    {
        _userManager = userManager;
        _tokenService = tokenService;
        _jwtSettings = jwtSettings.Value;
    }

    public async Task<Result<RegisterResponse>> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return Result<RegisterResponse>.Failure("Email is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            return Result<RegisterResponse>.Failure("Password is required.");
        }

        // Check if user already exists
        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser != null)
        {
            return Result<RegisterResponse>.Failure("User already exists with this email.");
        }

        var user = new AppUser
        {
            UserName = request.Email,
            Email = request.Email,
            FullName = request.FullName,
            EmailConfirmed = false // Require email confirmation
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            var errors = string.Join("; ", result.Errors.Select(e => e.Description));
            return Result<RegisterResponse>.Failure(errors);
        }

        // Assign default role if none provided
        var roles = request.Roles ?? new List<string> { Roles.User };
        foreach (var role in roles)
        {
            await _userManager.AddToRoleAsync(user, role);
        }

        // Generate tokens for auto-login after registration
        var accessToken = await _tokenService.GenerateAccessToken(user, roles);
        var refreshToken = _tokenService.GenerateRefreshToken();

        // Hash and store refresh token
        user.RefreshToken = _tokenService.HashRefreshToken(refreshToken);
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(
            _jwtSettings.RefreshTokenExpiryInDays > 0 ? _jwtSettings.RefreshTokenExpiryInDays : 7);
        await _userManager.UpdateAsync(user);

        var response = new RegisterResponse
        {
            UserId = user.Id,
            Email = user.Email!,
            FullName = user.FullName!,
            Roles = roles,
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryInMinutes > 0 ? _jwtSettings.ExpiryInMinutes : 120)
        };

        return Result<RegisterResponse>.Success(response);
    }
}
