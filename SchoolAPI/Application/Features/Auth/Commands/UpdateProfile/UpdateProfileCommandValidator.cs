#nullable enable

using FluentValidation;

namespace SchoolAPI.Application.Features.Auth.Commands.UpdateProfile;

/// <summary>
/// Validator for UpdateProfileCommand
/// </summary>
public class UpdateProfileCommandValidator : AbstractValidator<UpdateProfileCommand>
{
    public UpdateProfileCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");

        RuleFor(x => x.FullName)
            .MinimumLength(2).WithMessage("Full name must be at least 2 characters")
            .When(x => !string.IsNullOrEmpty(x.FullName));

        RuleFor(x => x.PhoneNumber)
            .Matches(@"^\+?[1-9]\d{1,14}$").WithMessage("Phone number must be a valid format")
            .When(x => !string.IsNullOrEmpty(x.PhoneNumber));
    }
}
