using MediatR;
using Microsoft.AspNetCore.Identity;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Constant;
using SchoolAPI.Entities;

namespace SchoolAPI.Application.Features.Auth.Register;

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, Result<RegisterResponse>>
{
    private readonly UserManager<AppUser> _userManager;

    public RegisterCommandHandler(UserManager<AppUser> userManager)
    {
        _userManager = userManager;
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

        var user = new AppUser
        {
            UserName = request.Email,
            Email = request.Email,
            FullName = request.FullName
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

        var response = new RegisterResponse
        {
            UserId = user.Id,
            Email = user.Email!,
            FullName = user.FullName!,
            Roles = roles
        };

        return Result<RegisterResponse>.Success(response);
    }
}
