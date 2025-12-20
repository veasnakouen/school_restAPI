using System.ComponentModel.DataAnnotations;

namespace SchoolAPI.DTOs;

    public class ClassDto
    {
        public Guid Id { get; set; }
        public string ClassName { get; set; }
        public List<StudentDto> Students { get; set; } = new List<StudentDto>();
        // public List<AttendanceDto> Attendances { get; set; } = new List<AttendanceDto>();

    public class CreateClassDto
    {
        [Required]
        public string ClassName { get; set; }
    }
}