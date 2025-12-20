using System.ComponentModel.DataAnnotations;

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
        public string Username { get; set; }
        public string Email { get; set; }

        [Required]
        // [DataType(DataType.Password)]

        public string Password { get; set; }
        public string[] Roles { get; set; }

        // [Phone]
        // [StringLength(maximumLength: 12)]
        // [RegularExpression("@*\\*&&/x-z")]
        // public string PhoneNumber { get; set; }

    }
    
}