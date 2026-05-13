using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Entities;
using System.Text;

namespace SchoolAPI.Application.Features.Auth.ResendConfirmationEmail;

public record ResendConfirmationEmailCommand(string Email) : IRequest<Result<ResendConfirmationEmailResponse>>;

public class ResendConfirmationEmailResponse
{
    public string Message { get; set; } = string.Empty;
    public bool IsSuccess { get; set; }
    public string? ConfirmationToken { get; set; } // Remove in production
    public string? UserId { get; set; } // Remove in production
}

public class ResendConfirmationEmailCommandHandler : IRequestHandler<ResendConfirmationEmailCommand, Result<ResendConfirmationEmailResponse>>
{
    private readonly UserManager<AppUser> _userManager;

    public ResendConfirmationEmailCommandHandler(UserManager<AppUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task<Result<ResendConfirmationEmailResponse>> Handle(ResendConfirmationEmailCommand request, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        
        // Always return success to prevent email enumeration
        if (user == null || user.EmailConfirmed)
        {
            return Result<ResendConfirmationEmailResponse>.Success(new ResendConfirmationEmailResponse
            {
                Message = "If the email exists and is not confirmed, a confirmation link has been sent.",
                IsSuccess = true
            });
        }

        // Generate email confirmation token
        var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
        var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));

        // In production, send email with confirmation link
        // For now, we'll return the token in the response (REMOVE IN PRODUCTION)
        var confirmationLink = $"/auth/confirm-email?userId={user.Id}&token={encodedToken}";

        // TODO: Send email with confirmationLink using email service
        // await _emailService.SendEmailConfirmationEmailAsync(user.Email, confirmationLink);

        return Result<ResendConfirmationEmailResponse>.Success(new ResendConfirmationEmailResponse
        {
            Message = "Email confirmation token generated. In production, this would be sent via email.",
            IsSuccess = true,
            // Remove this in production - only for testing
            ConfirmationToken = encodedToken,
            UserId = user.Id
        });
    }
}
