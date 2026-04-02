namespace SchoolAPI.Services.Reporting;

public interface IMonthlyTransactionReportJob
{
    Task GenerateMonthlyReportAsync(int year, int month);
    Task GeneratePreviousMonthReportAsync();
}