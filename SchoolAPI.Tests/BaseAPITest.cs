using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using System;
using Xunit;

namespace SchoolAPI.Tests
{
    public abstract class BaseAPITest : IDisposable
    {
        protected readonly WebApplicationFactory<Program> _factory;
        protected HttpClient _client;

        protected BaseAPITest()
        {
            _factory = new WebApplicationFactory<Program>()
                .WithWebHostBuilder(builder =>
                {
                    builder.ConfigureServices(services =>
                    {
                        // Override services for testing if needed
                    });
                });

            _client = _factory.CreateClient();
        }

        public void Dispose()
        {
            _client?.Dispose();
            _factory?.Dispose();
        }
    }
}