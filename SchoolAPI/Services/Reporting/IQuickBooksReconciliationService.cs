using SchoolAPI.Contracts.Reports;

namespace SchoolAPI.Services.Reporting;

public interface IQuickBooksReconciliationService
{
    Task<QuickBooksReconciliationResponseDto> BuildReconciliationDataAsync(
        QuickBooksReconciliationRequestDto request,
        CancellationToken cancellationToken = default);

    Task<byte[]> GenerateReconciliationPdfAsync(
        QuickBooksReconciliationRequestDto request,
        CancellationToken cancellationToken = default);

    Task<byte[]> GenerateReconciliationExcelAsync(
        QuickBooksReconciliationRequestDto request,
        CancellationToken cancellationToken = default);
}
