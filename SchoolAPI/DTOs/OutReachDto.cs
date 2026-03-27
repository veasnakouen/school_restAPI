#nullable enable

using System.Diagnostics.CodeAnalysis;

namespace SchoolAPI.DTOs
{
    public class OutReachDto
    {
        public Guid Id { get; set; }
        [AllowNull]
        public string FirstName { get; set; }
        [AllowNull]
        public string LastName { get; set; }
        public string? NickName { get; set; }
        public string? Contact { get; set; }
        public List<StudentDto> Students { get; set; } = new List<StudentDto>();
    }
    public class CreateOutReachDto
    {
        [AllowNull]
        public string FirstName { get; set; }
        [AllowNull]
        public string LastName { get; set; }
        public string? NickName { get; set; }
        public string? Contact { get; set; }
    }

}