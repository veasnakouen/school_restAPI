namespace SchoolAPI.Entities;

public class Enrollment
{
    public Guid Id { get; set; }
    public string Status { get; set; } = "Pending";
    public DateTime EnrollmentDate { get; set; } = DateTime.UtcNow;
    public DateTime? CompletionDate { get; set; }

    // Navigation property to Student
    public Guid StudentId { get; set; }
    public Student Student { get; set; }

    // Navigation property to ClassRoom
    public Guid ClassId { get; set; }
    public ClassRoom Class { get; set; }
}