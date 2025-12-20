namespace SchoolAPI.Entities
{
    public class Attendance
    {
        public Guid Id { get; set; }
        public Guid StudentId { get; set; }
        public Student Student { get; set; }
        public Guid ClassId { get; set; }
        public ClassRoom Class { get; set; }
        public DateTime Date { get; set; }

        public AttendanceStatus Status { get; set; } // e.g Present, Absent, Late
    }

}