using SchoolAPI.Entities;

namespace SchoolAPI.DTOs
{
    public class StudentDto
    {
        public Guid Id { get; set; }
        public string KhLastName { get; set; }
        public string KhFirstName { get; set; }
        public string EngLastName { get; set; }
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
        public string KhLastName { get; set; }
        public string KhFirstName { get; set; }
        public string EngLastName { get; set; }
        public string EngFirstName { get; set; }
        public string Gender { get; set; }
        public DateTime DateOfBirth { get; set; }
        public Guid? ClassId { get; set; }
        public Guid? OutReachId { get; set; }   
        
    }
}