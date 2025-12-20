using SchoolAPI.Entities;

namespace SchoolAPI.DTOs
{
    public class AttendanceDto
    {
        public Guid Id { get; set; }
        public Guid StudentId { get; set; } // with the ui it should be the options
        public Guid ClassId { get; set; } // with the ui it should be the options
        public DateTime Date { get; set; } // with the UI it also should be the datetime-picker
        public AttendanceStatus Status { get; set; } // UI: should be the options
    }

    public class CreateAttendanceDto
    {
        public Guid StudentId { get; set; }
        public Guid ClassId { get; set; }
        public DateTime Date { get; set; }
        public AttendanceStatus Status { get; set; }
    }

    public record UpdateAttendanceDto
    {
        // we just want to update the status of attendance
        public AttendanceStatus Status { get; set; }
    }
    
    public record DeleteAttendanceDto
    {
        public string Id { get; set; } = new Guid().ToString();
        public DateTime Date { get; set; }
    }
}