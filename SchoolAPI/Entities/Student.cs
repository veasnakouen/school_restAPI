#nullable enable

using System.ComponentModel.DataAnnotations;
using System.Diagnostics.CodeAnalysis;

namespace SchoolAPI.Entities
{
    // [Table("Students")]
    public class Student
    {
        public Guid Id { get; set; }
        [Required]
        // [JsonPropertyName("kh_last_name")]
        public string KhLastName { get; set; }
        [AllowNull]
        public string KhFirstName { get; set; }
        [AllowNull]
        public string EngLastName { get; set; }
        [AllowNull]
        public string EngFirstName { get; set; }
        public Gender Gender { get; set; }
        public DateTime DateOfBirth { get; set; }

        public int Age => DateTime.Now.Year - DateOfBirth.Year -
                         (DateTime.Now.DayOfYear < DateOfBirth.DayOfYear ? 1 : 0);

        public Guid? ClassId { get; set; }
        public ClassRoom? Class { get; set; }

        public Guid? OutReachId { get; set; }
        public OutReach? OutReach { get; set; }

        // Collection of attendance records for this student
        public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
        // some add collums
        // public bool isActive { get; set; } = true;
        // public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();

    }
}



