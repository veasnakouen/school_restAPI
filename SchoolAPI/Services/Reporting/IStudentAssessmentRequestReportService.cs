using SchoolAPI.Contracts.Reports;

namespace SchoolAPI.Services.Reporting;

public interface IStudentAssessmentRequestReportService
{
    Task<byte[]> GeneratePdfAsync(StudentAssessmentRequestFormDto request, CancellationToken cancellationToken = default);
    Task<byte[]> GenerateExcelAsync(StudentAssessmentRequestFormDto request, CancellationToken cancellationToken = default);
}