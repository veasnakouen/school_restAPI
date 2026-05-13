namespace SchoolAPI.Services.Reporting;

public interface IMonthlyTransactionReportService
{
    Task<string> GenerateMonthlyTransactionsPdfAsync(int year, int month, CancellationToken cancellationToken = default);
    Task<string> GenerateMonthlyTransactionsExcelAsync(int year, int month, CancellationToken cancellationToken = default);
}