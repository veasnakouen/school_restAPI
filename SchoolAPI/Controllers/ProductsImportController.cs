using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolAPI.Data;

namespace SchoolAPI.Controllers;

[Route("api/inventory/products")]
[ApiController]
[Authorize] // Protect this endpoint so only logged-in users can upload
public class ProductsImportController : ControllerBase
{
    private readonly SchoolDbContext _context;

    public ProductsImportController(SchoolDbContext context)
    {
        _context = context;
    }

    [HttpPost("import")]
    public IActionResult ImportExcel(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "No file uploaded.", importedCount = 0, errors = new[] { "File is empty or null." } });
        }

        try
        {
            using var stream = file.OpenReadStream();
            
            // Reuse the exact same robust logic we built for DbInitialize!
            var (importedCount, errors) = DbInitialize.ProcessExcelStream(_context, stream);

            return Ok(new { message = "Import completed successfully", importedCount, errors });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Server error during import", importedCount = 0, errors = new[] { ex.Message } });
        }
    }
}