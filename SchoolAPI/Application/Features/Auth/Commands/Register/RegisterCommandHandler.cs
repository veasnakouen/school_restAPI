#nullable enable

using MediatR;
using Microsoft.AspNetCore.Identity;
using SchoolAPI.Application.Features.Auth.Common;
using SchoolAPI.Constant;
using SchoolAPI.Data;
using SchoolAPI.Entities;
using AuthResponse = SchoolAPI.Application.Features.Auth.Common.AuthResponse;

namespace SchoolAPI.Application.Features.Auth.Commands.Register;

/// <summary>
/// Handler for RegisterCommand
/// </summary>
public class RegisterCommandHandler : IRequestHandler<RegisterCommand, AuthResponse>
{
    private readonly UserManager<AppUser> _userManager;
    private readonly SchoolDbContext _context;

    public RegisterCommandHandler(
        UserManager<AppUser> userManager,
        SchoolDbContext context)
    {
        _userManager = userManager;
        _context = context;
    }

    public async Task<AuthResponse> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        // Check if user already exists
        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser != null)
        {
            return new AuthResponse
            {
                IsSuccess = false,
                Message = "User already exists with this email"
            };
        }

        // Create new user
        var user = new AppUser
        {
            UserName = request.Email,
            Email = request.Email,
            FullName = request.FullName
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            return new AuthResponse
            {
                IsSuccess = false,
                Message = $"Registration failed: {errors}"
            };
        }

        // Assign roles
        if (request.Roles == null || request.Roles.Count == 0)
        {
            await _userManager.AddToRoleAsync(user, Roles.User);
        }
        else
        {
            foreach (var role in request.Roles)
            {
                await _userManager.AddToRoleAsync(user, role);
            }
        }

        return new AuthResponse
        {
            IsSuccess = true,
            Message = "User registered successfully",
            UserId = user.Id,
            Email = user.Email,
            FullName = user.FullName
        };
    }
}
