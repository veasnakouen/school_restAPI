namespace SchoolAPI.Contracts.Reports;

public sealed class AssessmentRequestFormDto
{
    public string AssessmentNo { get; set; } = string.Empty;
    public DateTime AssessmentDate { get; set; } = DateTime.UtcNow;
    public string RefToTicketNo { get; set; } = string.Empty;
    public string ItemCode { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string IssueDescription { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string BrandName { get; set; } = string.Empty;
    public string ModelName { get; set; } = string.Empty;
    public string CheckedBy { get; set; } = string.Empty;
    public DateTime? CheckedDate { get; set; }
    public List<AssessmentRequestLineItemDto> Items { get; set; } = [];
}
