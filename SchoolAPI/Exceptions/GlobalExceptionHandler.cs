using Microsoft.AspNetCore.Diagnostics;
using SchoolAPI.Contracts;

namespace SchoolAPI.Exceptions
{
    public class GlobalExceptionHandler : IExceptionHandler
    {
        private readonly ILogger<GlobalExceptionHandler> _logger;

        public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
        {
            _logger = logger;
        }

        public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
        {
            _logger.LogError(exception, exception.Message);

            var response = new ErrorResponse
            {
                Message = exception.Message,
                StatusCode = StatusCodes.Status500InternalServerError,
                Title = "Internal Server Error"
            };

            switch (exception)
            {
                case BadHttpRequestException:
                    response.StatusCode = StatusCodes.Status400BadRequest;
                    response.Title = "Bad Request";
                    break;
            }

            httpContext.Response.StatusCode = response.StatusCode;
            await httpContext.Response.WriteAsJsonAsync(response, cancellationToken);

            return true;
        }
    }
}