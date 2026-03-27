#nullable enable

using System.ComponentModel.DataAnnotations;
using System.Diagnostics.CodeAnalysis;

namespace SchoolAPI.Contracts.Auth
{
    public class RegisterRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        [Required]
        public string Password { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public List<string>? Roles { get; set; } //add

    }

    // another styles
    public class RegisterDto
    {
        [Required]
        // [DataType(DataType.EmailAddress)]
        [AllowNull]
        public string Username { get; set; }
        [AllowNull]
        public string Email { get; set; }

        [Required]
        // [DataType(DataType.Password)]
        [AllowNull]
        public string Password { get; set; }
        public string[] Roles { get; set; }

        // [Phone]
        // [StringLength(maximumLength: 12)]
        // [RegularExpression("@*\\*&&/x-z")]
        // public string PhoneNumber { get; set; }

    }

}