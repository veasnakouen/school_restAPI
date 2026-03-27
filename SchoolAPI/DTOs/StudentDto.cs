#nullable enable

using SchoolAPI.Entities;
using System.Diagnostics.CodeAnalysis;

namespace SchoolAPI.DTOs
{
    public class StudentDto
    {
        public Guid Id { get; set; }
        [AllowNull]
        public string KhLastName { get; set; }
        [AllowNull]
        public string KhFirstName { get; set; }
        [AllowNull]
        public string EngLastName { get; set; }
        [AllowNull]
        public string EngFirstName { get; set; }
        public Gender Gender { get; set; }
        public DateTime DateOfBirth { get; set; }
        public int? Age { get; set; }
        public Guid? ClassId { get; set; }
        public Guid? OutReachId { get; set; }
        public List<AttendanceDto> Attendances { get; set; } = new List<AttendanceDto>();
    }
    public class CreateStudentDto
    {
        [AllowNull]
        public string KhLastName { get; set; }
        [AllowNull]
        public string KhFirstName { get; set; }
        [AllowNull]
        public string EngLastName { get; set; }
        [AllowNull]
        public string EngFirstName { get; set; }
        [AllowNull]
        public string Gender { get; set; }
        public DateTime DateOfBirth { get; set; }
        public Guid? ClassId { get; set; }
        public Guid? OutReachId { get; set; }   
        
    }
}