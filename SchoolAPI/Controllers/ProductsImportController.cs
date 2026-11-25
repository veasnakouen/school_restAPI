using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolAPI.Contracts.Products;
using SchoolAPI.Data;

namespace SchoolAPI.Controllers;

[Route("api/inventory/products")]
[ApiController]
[Authorize]
public class ProductsImportController : ControllerBase
{
    private readonly SchoolDbContext _context;

    public ProductsImportController(SchoolDbContext context)
    {
        _context = context;
    }

    private static readonly string[] AllowedExtensions = [".xlsx", ".xlsm"];

    [HttpPost("import/preview")]
    [RequestSizeLimit(50 * 1024 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = 50 * 1024 * 1024)]
    public IActionResult PreviewExcel(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "No file uploaded." });
        }

        var ext = Path.GetExtension(file.FileName);
        if (string.IsNullOrEmpty(ext) || !AllowedExtensions.Contains(ext, StringComparer.OrdinalIgnoreCase))
        {
            return BadRequest(new
            {
                message = $"Unsupported file format '{ext}'. Please upload an .xlsx or .xlsm workbook (save legacy .xls files as .xlsx in Excel first)."
            });
        }

        try
        {
            using var stream = file.OpenReadStream();
            var sheets = DbInitialize.InspectExcelStream(stream);
            return Ok(new
            {
                fileName = file.FileName,
                totalSheets = sheets.Count,
                importableSheets = sheets.Count(s => s.IsImportable),
                sheets
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to inspect Excel workbook.", error = ex.Message });
        }
    }

    [HttpPost("import")]
    [RequestSizeLimit(50 * 1024 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = 50 * 1024 * 1024)]
    public IActionResult ImportExcel(
        IFormFile file,
        [FromForm] string? sheets = null,
        [FromForm] bool skipDuplicates = true,
        [FromForm] string? sheetDepartments = null)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new ExcelImportResultDto
            {
                Message = "No file uploaded.",
                Errors = ["File is empty or null."]
            });
        }

        var ext = Path.GetExtension(file.FileName);
        if (string.IsNullOrEmpty(ext) || !AllowedExtensions.Contains(ext, StringComparer.OrdinalIgnoreCase))
        {
            return BadRequest(new ExcelImportResultDto
            {
                Message = $"Unsupported file format '{ext}'.",
                Errors = ["Please upload an .xlsx or .xlsm workbook (save legacy .xls files as .xlsx in Excel first)."]
            });
        }

        try
        {
            List<string>? selectedSheets = null;
            if (!string.IsNullOrWhiteSpace(sheets))
            {
                if (sheets.TrimStart().StartsWith("["))
                {
                    selectedSheets = JsonSerializer.Deserialize<List<string>>(sheets);
                }
                else
                {
                    selectedSheets = sheets
                        .Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Select(s => s.Trim())
                        .ToList();
                }
            }

            Dictionary<string, string>? deptOverrides = null;
            if (!string.IsNullOrWhiteSpace(sheetDepartments))
            {
                deptOverrides = JsonSerializer.Deserialize<Dictionary<string, string>>(sheetDepartments);
            }

            using var stream = file.OpenReadStream();
            var result = DbInitialize.ProcessExcelStreamDetailed(
                _context,
                stream,
                selectedSheets,
                skipDuplicates,
                deptOverrides);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ExcelImportResultDto
            {
                Message = "Server error during import",
                Errors = [ex.Message]
            });
        }
    }
}
