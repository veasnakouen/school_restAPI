using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Entities;
using System.Text;

namespace SchoolAPI.Application.Features.Auth.ConfirmEmail;

public class ConfirmEmailCommandHandler : IRequestHandler<ConfirmEmailCommand, Result<ConfirmEmailResponse>>
{
    private readonly UserManager<AppUser> _userManager;

    public ConfirmEmailCommandHandler(UserManager<AppUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task<Result<ConfirmEmailResponse>> Handle(ConfirmEmailCommand request, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByIdAsync(request.UserId);
        
        if (user == null)
        {
            return Result<ConfirmEmailResponse>.Failure("Invalid user ID.");
        }

        if (user.EmailConfirmed)
        {
            return Result<ConfirmEmailResponse>.Success(new ConfirmEmailResponse
            {
                Message = "Email is already confirmed.",
                IsSuccess = true
            });
        }

        // Decode the token
        var decodedToken = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(request.Token));

        var result = await _userManager.ConfirmEmailAsync(user, decodedToken);
        
        if (!result.Succeeded)
        {
            var errors = string.Join("; ", result.Errors.Select(e => e.Description));
            return Result<ConfirmEmailResponse>.Failure(errors);
        }

        return Result<ConfirmEmailResponse>.Success(new ConfirmEmailResponse
        {
            Message = "Email confirmed successfully. You can now sign in.",
            IsSuccess = true
        });
    }
}
