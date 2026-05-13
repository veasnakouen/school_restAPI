namespace SchoolAPI.Contracts.Reports;

public sealed class StudentAssessmentRequestFormDto
{
    public string AssessmentNo { get; set; } = string.Empty;
    public DateTime AssessmentDate { get; set; } = DateTime.UtcNow;
    public string StudentName { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public DateTime? DateOfBirth { get; set; }
    public string RequestBy { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string IssueDescription { get; set; } = string.Empty;
    public string CheckedBy { get; set; } = string.Empty;
    public DateTime? CheckedDate { get; set; }
    public List<AssessmentRequestLineItemDto> Items { get; set; } = [];
}