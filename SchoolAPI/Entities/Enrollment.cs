using System.ComponentModel.DataAnnotations.Schema;

namespace SchoolAPI.Entities;

public class Enrollment
{
    public int Id { get; set; }
    public string Status { get; set; } = "Pending";
    public DateTime EnrollmentDate { get; set; } = DateTime.UtcNow;
    public DateTime? CompletionDate { get; set; }

    // Navigation property to Student
    public int StudentId { get; set; }
    // [Column(TypeName =("decimal(18,2)"))]
    public Student Student { get; set; }

    // Navigation property to ClassRoom
    public int ClassId { get; set; }
    public ClassRoom Class { get; set; }
}