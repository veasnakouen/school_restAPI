#nullable enable

using System.ComponentModel.DataAnnotations;
using System.Diagnostics.CodeAnalysis;

namespace SchoolAPI.DTOs;

    public class ClassDto
    {
        public Guid Id { get; set; }
        [AllowNull]
        public string ClassName { get; set; }
        public List<StudentDto> Students { get; set; } = new List<StudentDto>();
        // public List<AttendanceDto> Attendances { get; set; } = new List<AttendanceDto>();

    public class CreateClassDto
    {
        [Required]
        public string ClassName { get; set; }
    }
}