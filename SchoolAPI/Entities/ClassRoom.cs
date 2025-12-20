using System.ComponentModel.DataAnnotations;

namespace SchoolAPI.Entities
{
    public class ClassRoom
    {
        public Guid Id { get; set; }
        // [Display(Description = "Class's Name")]
        // [RegularExpression(@"^[A-Za-z0-9\s\-]+$", ErrorMessage = "Class name can only contain letters, numbers, spaces, and hyphens.")]
        [Required]
        public string ClassName { get; set; } = string.Empty;

        //collection of student enrolled  in this class
        public ICollection<Student> Students { get; set; } = new List<Student>();
        //collection of attendance record for this class
        public ICollection<Attendance> Attendances { get; set; }

        // add properties
        // public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();


    }
}