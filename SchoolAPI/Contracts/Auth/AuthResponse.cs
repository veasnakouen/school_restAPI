using Microsoft.AspNetCore.Identity;
using SchoolAPI.Constant;
using SchoolAPI.Entities;

namespace SchoolAPI.Contracts.Auth
{
    public class AuthResponse
    {
        public string AccessToken { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public bool IsSuccess { get; set; }//add
        public string? Message { get; set; }//add
        public ICollection<string> Role { get; set; }
        public string PhoneNumber { get; set; }
        public int AccessFailedCount { get; set; }

    }
}