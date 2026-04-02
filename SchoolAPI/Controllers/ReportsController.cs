using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SchoolAPI.Constant;
using SchoolAPI.Services.Reporting;

namespace SchoolAPI.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize(Policy = Permissions.TransactionRead)]
[EnableRateLimiting("report")]
public class ReportsController : ControllerBase
{
    private readonly IMonthlyTransactionReportService _reportService;
    private readonly IBackgroundJobClient _backgroundJobClient;

    public ReportsController(IMonthlyTransactionReportService reportService, IBackgroundJobClient backgroundJobClient)
    {
        _reportService = reportService;
        _backgroundJobClient = backgroundJobClient;
    }

    [HttpGet("monthly-transactions/{year:int}/{month:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DownloadMonthlyTransactionsReport(int year, int month, CancellationToken cancellationToken)
    {
        var filePath = await _reportService.GenerateMonthlyTransactionsPdfAsync(year, month, cancellationToken);
        var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath, cancellationToken);

        return File(fileBytes, "application/pdf", Path.GetFileName(filePath));
    }

    [HttpGet("monthly-transactions/{year:int}/{month:int}/excel")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DownloadMonthlyTransactionsReportExcel(int year, int month, CancellationToken cancellationToken)
    {
        var filePath = await _reportService.GenerateMonthlyTransactionsExcelAsync(year, month, cancellationToken);
        var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath, cancellationToken);

        return File(fileBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", Path.GetFileName(filePath));
    }

    [HttpPost("monthly-transactions/{year:int}/{month:int}/enqueue")]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult EnqueueMonthlyTransactionsReport(int year, int month)
    {
        if (year < 2000 || month is < 1 or > 12)
        {
            return BadRequest("Year or month is out of range.");
        }

        var jobId = _backgroundJobClient.Enqueue<IMonthlyTransactionReportJob>(job => job.GenerateMonthlyReportAsync(year, month));
        return Accepted(new
        {
            jobId,
            year,
            month,
            message = "Monthly report has been queued."
        });
    }
}