#nullable enable

using System.Diagnostics.CodeAnalysis;

namespace SchoolAPI.Contracts
{
    public class ErrorResponse
    {
        [AllowNull]
        public string Title { get; set; }
        public int StatusCode { get; set; }
        [AllowNull]
        public string Message { get; set; }

    }
  
}