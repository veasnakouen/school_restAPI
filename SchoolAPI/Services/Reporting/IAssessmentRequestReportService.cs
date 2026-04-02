using SchoolAPI.Contracts.Reports;

namespace SchoolAPI.Services.Reporting;

public interface IAssessmentRequestReportService
{
    Task<byte[]> GeneratePdfAsync(AssessmentRequestFormDto request, CancellationToken cancellationToken = default);
    Task<byte[]> GenerateExcelAsync(AssessmentRequestFormDto request, CancellationToken cancellationToken = default);
}