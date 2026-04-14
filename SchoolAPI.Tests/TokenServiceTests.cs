using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Moq;
using SchoolAPI.Entities;
using SchoolAPI.Services;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Xunit;

namespace SchoolAPI.Tests
{
    public class TokenServiceTests
    {
        [Fact]
        public void GenerateToken_ValidUser_ReturnsValidTokenString()
        {
            // Arrange
            var mockConfig = new Mock<IConfiguration>();
            mockConfig.Setup(c => c["JwtSettings:Key"]).Returns("this_is_a_very_secure_key_that_is_at_least_32_bytes_long");
            mockConfig.Setup(c => c["JwtSettings:Issuer"]).Returns("SchoolAPI");
            mockConfig.Setup(c => c["JwtSettings:Audience"]).Returns("SchoolUsers");
            mockConfig.Setup(c => c["JwtSettings:ExpireMinutes"]).Returns("60");

            var tokenService = new TokenService(mockConfig.Object);

            var user = new AppUser
            {
                Id = 1,
                UserName = "testuser",
                Email = "test@example.com"
            };

            // Act
            var tokenString = tokenService.GenerateToken(user);

            // Assert
            Assert.NotNull(tokenString);
            Assert.NotEmpty(tokenString);

            // Verify that it's a valid JWT token
            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.ReadJwtToken(tokenString);

            Assert.NotNull(token);
            Assert.Equal("SchoolAPI", token.Issuer);
            Assert.Contains(token.Audiences, a => a == "SchoolUsers");
            
            // Check that claims are present
            var userIdClaim = token.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier);
            Assert.NotNull(userIdClaim);
            Assert.Equal("1", userIdClaim.Value);
        }

        [Fact]
        public void GenerateToken_UserWithNullValues_ThrowsException()
        {
            // Arrange
            var mockConfig = new Mock<IConfiguration>();
            mockConfig.Setup(c => c["JwtSettings:Key"]).Returns("this_is_a_very_secure_key_that_is_at_least_32_bytes_long");
            mockConfig.Setup(c => c["JwtSettings:Issuer"]).Returns("SchoolAPI");
            mockConfig.Setup(c => c["JwtSettings:Audience"]).Returns("SchoolUsers");
            mockConfig.Setup(c => c["JwtSettings:ExpireMinutes"]).Returns("60");

            var tokenService = new TokenService(mockConfig.Object);
            AppUser user = null;

            // Act & Assert
            Assert.Throws<ArgumentNullException>(() => tokenService.GenerateToken(user));
        }
    }
}