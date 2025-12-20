using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SchoolAPI.DTOs;
//for response and data transfer
public class EnrollmentDto
{
    public int Id { get; set; }
    public string Status { get; set; } = "Pending";
    // [Required]
    // [Column(TypeName = "datetime2")]
    public DateTime EnrollmentDate { get; set; } = DateTime.UtcNow;
    public DateTime? CompletionDate { get; set; }

    public int StudentId { get; set; }
    public int ClassId { get; set; }
}

// for creating new enrollment
public class CreateEnrollmentDto
{
    public int StudentId { get; set; }
    public int ClassId { get; set; }
}

// for updating existing enrollment
public class UpdateEnrollmentDto
{
    public string Status { get; set; }
    public DateTime? CompletionDate { get; set; }
}

// for updating enrollment status only
public class UpdateEnrollmentStatusDto
{
    public string Status { get; set; }
}

// for updating enrollment completion date only
public class UpdateEnrollmentCompletionDateDto
{
    public DateTime? CompletionDate { get; set; }
}

// for delete enrollment
public class DeleteEnrollmentDto
{
    public int Id { get; set; }
}   

// for partial update enrollment
public class PartialUpdateEnrollmentDto
{
    public string? Status { get; set; }
    public DateTime? CompletionDate { get; set; }
}