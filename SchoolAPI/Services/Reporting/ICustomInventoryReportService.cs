using SchoolAPI.Contracts.Reports;

namespace SchoolAPI.Services.Reporting;

public interface ICustomInventoryReportService
{
    Task<byte[]> GenerateCustomExcelAsync(CustomInventoryReportRequestDto request, CancellationToken cancellationToken = default);
    Task<byte[]> GenerateCustomPdfAsync(CustomInventoryReportRequestDto request, CancellationToken cancellationToken = default);
}
