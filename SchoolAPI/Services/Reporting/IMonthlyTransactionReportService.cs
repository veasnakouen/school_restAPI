namespace SchoolAPI.Services.Reporting;

public interface IMonthlyTransactionReportService
{
    Task<string> GenerateMonthlyTransactionsPdfAsync(
        int year,
        int month,
        string? departmentId = null,
        string? transactionType = null,
        string? search = null,
        string? vehicleType = null,
        CancellationToken cancellationToken = default);

    Task<string> GenerateMonthlyTransactionsExcelAsync(
        int year,
        int month,
        string? departmentId = null,
        string? transactionType = null,
        string? search = null,
        string? vehicleType = null,
        CancellationToken cancellationToken = default);
}