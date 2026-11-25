using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SchoolAPI.Constant;
using SchoolAPI.Contracts.Reports;
using SchoolAPI.Services.Reporting;

namespace SchoolAPI.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize]
[EnableRateLimiting("report")]
public class ReportsController : ControllerBase
{
    private readonly IMonthlyTransactionReportService _reportService;
    private readonly ICustomInventoryReportService _customInventoryReportService;
    private readonly IQuickBooksReconciliationService _reconciliationService;
    private readonly IBackgroundJobClient? _backgroundJobClient;

    public ReportsController(
        IMonthlyTransactionReportService reportService,
        ICustomInventoryReportService customInventoryReportService,
        IQuickBooksReconciliationService reconciliationService,
        IBackgroundJobClient? backgroundJobClient = null)
    {
        _reportService = reportService;
        _customInventoryReportService = customInventoryReportService;
        _reconciliationService = reconciliationService;
        _backgroundJobClient = backgroundJobClient;
    }

    [HttpGet("monthly-transactions/{year:int}/{month:int}")]
    [Authorize(Policy = Permissions.TransactionRead)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DownloadMonthlyTransactionsReport(
        int year,
        int month,
        [FromQuery] string? departmentId = null,
        [FromQuery] string? transactionType = null,
        [FromQuery] string? search = null,
        [FromQuery] string? vehicleType = null,
        CancellationToken cancellationToken = default)
    {
        var filePath = await _reportService.GenerateMonthlyTransactionsPdfAsync(
            year,
            month,
            departmentId,
            transactionType,
            search,
            vehicleType,
            cancellationToken);
        var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath, cancellationToken);

        return File(fileBytes, "application/pdf", Path.GetFileName(filePath));
    }

    [HttpGet("monthly-transactions/{year:int}/{month:int}/excel")]
    [Authorize(Policy = Permissions.TransactionRead)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DownloadMonthlyTransactionsReportExcel(
        int year,
        int month,
        [FromQuery] string? departmentId = null,
        [FromQuery] string? transactionType = null,
        [FromQuery] string? search = null,
        [FromQuery] string? vehicleType = null,
        CancellationToken cancellationToken = default)
    {
        var filePath = await _reportService.GenerateMonthlyTransactionsExcelAsync(
            year,
            month,
            departmentId,
            transactionType,
            search,
            vehicleType,
            cancellationToken);
        var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath, cancellationToken);

        return File(fileBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", Path.GetFileName(filePath));
    }

    [HttpPost("monthly-transactions/{year:int}/{month:int}/enqueue")]
    [Authorize(Policy = Permissions.TransactionRead)]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult EnqueueMonthlyTransactionsReport(int year, int month)
    {
        if (year < 2000 || month is < 1 or > 12)
        {
            return BadRequest("Year or month is out of range.");
        }

        if (_backgroundJobClient == null)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                message = "Background report queueing is disabled because Hangfire is not enabled."
            });
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

    [HttpPost("inventory/custom-excel")]
    [Authorize(Policy = Permissions.ProductRead)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportCustomInventoryExcel(
        [FromBody] CustomInventoryReportRequestDto request,
        CancellationToken cancellationToken)
    {
        var bytes = await _customInventoryReportService.GenerateCustomExcelAsync(request, cancellationToken);
        var fileName = $"inventory-report-{DateTime.UtcNow:yyyyMMdd-HHmm}.xlsx";
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }

    [HttpPost("inventory/custom-pdf")]
    [Authorize(Policy = Permissions.ProductRead)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportCustomInventoryPdf(
        [FromBody] CustomInventoryReportRequestDto request,
        CancellationToken cancellationToken)
    {
        var bytes = await _customInventoryReportService.GenerateCustomPdfAsync(request, cancellationToken);
        var fileName = $"inventory-report-{DateTime.UtcNow:yyyyMMdd-HHmm}.pdf";
        return File(bytes, "application/pdf", fileName);
    }

    [HttpPost("quickbooks-reconciliation/preview")]
    [Authorize(Policy = Permissions.ProductRead)]
    [DisableRateLimiting]
    [ProducesResponseType(typeof(QuickBooksReconciliationResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> PreviewQuickBooksReconciliation(
        [FromBody] QuickBooksReconciliationRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _reconciliationService.BuildReconciliationDataAsync(request, cancellationToken);
        return Ok(result);
    }

    [HttpPost("quickbooks-reconciliation/pdf")]
    [Authorize(Policy = Permissions.ProductRead)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportQuickBooksReconciliationPdf(
        [FromBody] QuickBooksReconciliationRequestDto request,
        CancellationToken cancellationToken)
    {
        var bytes = await _reconciliationService.GenerateReconciliationPdfAsync(request, cancellationToken);
        var fileName = $"quickbooks-reconciliation-{DateTime.UtcNow:yyyyMMdd-HHmm}.pdf";
        return File(bytes, "application/pdf", fileName);
    }

    [HttpPost("quickbooks-reconciliation/excel")]
    [Authorize(Policy = Permissions.ProductRead)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportQuickBooksReconciliationExcel(
        [FromBody] QuickBooksReconciliationRequestDto request,
        CancellationToken cancellationToken)
    {
        var bytes = await _reconciliationService.GenerateReconciliationExcelAsync(request, cancellationToken);
        var fileName = $"quickbooks-reconciliation-{DateTime.UtcNow:yyyyMMdd-HHmm}.xlsx";
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }
}
