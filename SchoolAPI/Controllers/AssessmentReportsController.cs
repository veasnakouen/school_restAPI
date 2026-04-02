using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SchoolAPI.Constant;
using SchoolAPI.Contracts.Reports;
using SchoolAPI.Services.Reporting;

namespace SchoolAPI.Controllers;

[ApiController]
[Route("api/assessment-reports")]
[Authorize]
[EnableRateLimiting("report")]
public class AssessmentReportsController : ControllerBase
{
    private readonly IAssessmentRequestReportService _reportService;
    private readonly IStudentAssessmentRequestReportService _studentReportService;

    public AssessmentReportsController(
        IAssessmentRequestReportService reportService,
        IStudentAssessmentRequestReportService studentReportService)
    {
        _reportService = reportService;
        _studentReportService = studentReportService;
    }

    [HttpPost("pdf")]
    [HttpPost("product/pdf")]
    [Authorize(Policy = Permissions.TransactionRead)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GeneratePdf([FromBody] AssessmentRequestFormDto request, CancellationToken cancellationToken)
    {
        var bytes = await _reportService.GeneratePdfAsync(request, cancellationToken);
        return File(bytes, "application/pdf", $"assessment-request-{request.AssessmentNo}.pdf");
    }

    [HttpPost("excel")]
    [HttpPost("product/excel")]
    [Authorize(Policy = Permissions.TransactionRead)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GenerateExcel([FromBody] AssessmentRequestFormDto request, CancellationToken cancellationToken)
    {
        var bytes = await _reportService.GenerateExcelAsync(request, cancellationToken);
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"assessment-request-{request.AssessmentNo}.xlsx");
    }

    [HttpPost("student/pdf")]
    [Authorize(Policy = Permissions.StudentRead)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GenerateStudentPdf([FromBody] StudentAssessmentRequestFormDto request, CancellationToken cancellationToken)
    {
        var bytes = await _studentReportService.GeneratePdfAsync(request, cancellationToken);
        return File(bytes, "application/pdf", $"student-assessment-request-{request.AssessmentNo}.pdf");
    }

    [HttpPost("student/excel")]
    [Authorize(Policy = Permissions.StudentRead)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GenerateStudentExcel([FromBody] StudentAssessmentRequestFormDto request, CancellationToken cancellationToken)
    {
        var bytes = await _studentReportService.GenerateExcelAsync(request, cancellationToken);
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"student-assessment-request-{request.AssessmentNo}.xlsx");
    }
}