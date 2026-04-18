using System.Net;
using System.Threading.Tasks;
using Xunit;

namespace SchoolAPI.Tests
{
    public class ProductControllerTests : BaseAPITest
    {
        [Fact]
        public async Task GetAllProducts_WithoutToken_ReturnsUnauthorized()
        {
            // Act
            var response = await _client.GetAsync("/api/inventory/products");

            // Assert
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task GetProductById_WithoutToken_ReturnsUnauthorized()
        {
            // Act
            var response = await _client.GetAsync("/api/inventory/products/123");

            // Assert
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task DeleteProduct_WithoutToken_ReturnsUnauthorized()
        {
            // Act
            var response = await _client.DeleteAsync("/api/inventory/products/123");

            // Assert
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }
    }
}