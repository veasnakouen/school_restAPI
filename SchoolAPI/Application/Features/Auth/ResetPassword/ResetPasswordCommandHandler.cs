using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Entities;
using System.Text;

namespace SchoolAPI.Application.Features.Auth.ResetPassword;

public class ResetPasswordCommandHandler : IRequestHandler<ResetPasswordCommand, Result<ResetPasswordResponse>>
{
    private readonly UserManager<AppUser> _userManager;

    public ResetPasswordCommandHandler(UserManager<AppUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task<Result<ResetPasswordResponse>> Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        
        if (user == null)
        {
            return Result<ResetPasswordResponse>.Failure("Invalid reset token.");
        }

        // Decode the token
        var decodedToken = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(request.Token));

        // Reset password
        var result = await _userManager.ResetPasswordAsync(user, decodedToken, request.NewPassword);
        
        if (!result.Succeeded)
        {
            var errors = string.Join("; ", result.Errors.Select(e => e.Description));
            return Result<ResetPasswordResponse>.Failure(errors);
        }

        // Optional: Reset access failed count
        await _userManager.ResetAccessFailedCountAsync(user);

        return Result<ResetPasswordResponse>.Success(new ResetPasswordResponse
        {
            Message = "Password has been reset successfully.",
            IsSuccess = true
        });
    }
}
