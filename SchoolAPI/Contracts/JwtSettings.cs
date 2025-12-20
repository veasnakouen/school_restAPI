namespace SchoolAPI.Contracts
{
    public class JwtSettings
    {
       public string? Secret { get; set; }
        public string? Issuer { get; set; }
        public string? Audience { get; set; }
        public int ExpiryInMinutes { get; set; }
        public int RefreshTokenExpiryInDays { get; set; }
    }
}