using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Entities;
using System.Text;

namespace SchoolAPI.Application.Features.Auth.ForgotPassword;

public class ForgotPasswordCommandHandler : IRequestHandler<ForgotPasswordCommand, Result<ForgotPasswordResponse>>
{
    private readonly UserManager<AppUser> _userManager;

    public ForgotPasswordCommandHandler(UserManager<AppUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task<Result<ForgotPasswordResponse>> Handle(ForgotPasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        
        // Always return success to prevent email enumeration
        if (user == null)
        {
            return Result<ForgotPasswordResponse>.Success(new ForgotPasswordResponse
            {
                Message = "If the email exists, a password reset link has been sent.",
                IsSuccess = true
            });
        }

        // Generate password reset token
        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));

        // In production, send email with reset link
        // For now, we'll return the token in the response (REMOVE IN PRODUCTION)
        var resetLink = $"/auth/reset-password?email={user.Email}&token={encodedToken}";

        // TODO: Send email with resetLink using email service
        // await _emailService.SendPasswordResetEmailAsync(user.Email, resetLink);

        return Result<ForgotPasswordResponse>.Success(new ForgotPasswordResponse
        {
            Message = "Password reset token generated. In production, this would be sent via email.",
            IsSuccess = true,
            // Remove this in production - only for testing
            ResetToken = encodedToken 
        });
    }
}
