using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using SchoolAPI.Contracts;
using SchoolAPI.Controllers;
using SchoolAPI.Data;
using SchoolAPI.Entities;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace SchoolAPI.Tests
{
    public class ProductControllerTests : BaseAPITest
    {
        [Fact]
        public async Task GetProducts_ReturnsOkResult()
        {
            // Arrange
            var mockLogger = new Mock<ILogger<ProductController>>();
            var mockContext = new Mock<SchoolDbContext>();
            var controller = new ProductController(mockLogger.Object, mockContext.Object);

            // Act
            var result = await controller.GetProducts();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult);
        }

        [Fact]
        public async Task GetProductById_ExistingId_ReturnsOkResult()
        {
            // Arrange
            var mockLogger = new Mock<ILogger<ProductController>>();
            var mockContext = new Mock<SchoolDbContext>();
            var product = new Product { Id = 1, Name = "Test Product", Description = "Test Description" };
            
            mockContext.Setup(x => x.Products.FindAsync(1)).ReturnsAsync(product);
            
            var controller = new ProductController(mockLogger.Object, mockContext.Object);

            // Act
            var result = await controller.GetProduct(1);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnValue = Assert.IsType<Product>(okResult.Value);
            Assert.Equal("Test Product", returnValue.Name);
        }

        [Fact]
        public async Task GetProductById_NonExistingId_ReturnsNotFound()
        {
            // Arrange
            var mockLogger = new Mock<ILogger<ProductController>>();
            var mockContext = new Mock<SchoolDbContext>();
            
            mockContext.Setup(x => x.Products.FindAsync(It.IsAny<int>())).ReturnsAsync((Product)null);
            
            var controller = new ProductController(mockLogger.Object, mockContext.Object);

            // Act
            var result = await controller.GetProduct(999);

            // Assert
            Assert.IsType<NotFoundResult>(result.Result);
        }

        [Fact]
        public void GetProducts_ReturnsCorrectType()
        {
            // Arrange
            var mockLogger = new Mock<ILogger<ProductController>>();
            var mockContext = new Mock<SchoolDbContext>();
            var products = new List<Product>
            {
                new Product { Id = 1, Name = "Product 1", Description = "Description 1" },
                new Product { Id = 2, Name = "Product 2", Description = "Description 2" }
            }.AsQueryable();

            var mockSet = new Mock<Microsoft.EntityFrameworkCore.DbSet<Product>>();
            mockSet.As<IQueryable<Product>>().Setup(m => m.Provider).Returns(products.Provider);
            mockSet.As<IQueryable<Product>>().Setup(m => m.Expression).Returns(products.Expression);
            mockSet.As<IQueryable<Product>>().Setup(m => m.ElementType).Returns(products.ElementType);
            mockSet.As<IQueryable<Product>>().Setup(m => m.GetEnumerator()).Returns(products.GetEnumerator());

            mockContext.Setup(c => c.Products).Returns(mockSet.Object);

            var controller = new ProductController(mockLogger.Object, mockContext.Object);

            // Act
            var result = controller.GetProducts().Result;

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnValue = Assert.IsType<List<ProductDto>>(okResult.Value);
            Assert.Equal(2, returnValue.Count);
        }
    }
}