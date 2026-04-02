namespace SchoolAPI.Services.Reporting;

public sealed class MonthlyTransactionReportJob : IMonthlyTransactionReportJob
{
    private readonly IMonthlyTransactionReportService _reportService;

    public MonthlyTransactionReportJob(IMonthlyTransactionReportService reportService)
    {
        _reportService = reportService;
    }

    public Task GenerateMonthlyReportAsync(int year, int month)
    {
        return GenerateBothFormatsAsync(year, month);
    }

    public Task GeneratePreviousMonthReportAsync()
    {
        var targetDate = DateTime.UtcNow.AddMonths(-1);
        return GenerateBothFormatsAsync(targetDate.Year, targetDate.Month);
    }

    private async Task GenerateBothFormatsAsync(int year, int month)
    {
        await _reportService.GenerateMonthlyTransactionsPdfAsync(year, month);
        await _reportService.GenerateMonthlyTransactionsExcelAsync(year, month);
    }
}