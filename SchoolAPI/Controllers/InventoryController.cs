using System.IO;
using OfficeOpenXml;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolAPI.Application.Features.Products.Create;
using SchoolAPI.Application.Features.Products.Delete;
using SchoolAPI.Application.Features.Products.Image;
using SchoolAPI.Application.Features.Products.GetAll;
using SchoolAPI.Application.Features.Products.Update;
using SchoolAPI.Application.Features.Products.GetById;
using SchoolAPI.Constant;
using SchoolAPI.Contracts;

namespace SchoolAPI.Controllers;

[ApiController]
[Route("api/inventory")]
[Authorize]
public class InventoryController : BaseController
{
    private readonly ISender _sender;

    public InventoryController(ISender sender)
    {
        _sender = sender;
    }

    [HttpGet("products")]
    [Authorize(Policy = Permissions.ProductRead)]
    public async Task<IActionResult> GetProducts([FromQuery] GetAllProductsQuery query, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(query, cancellationToken);
        return HandleResult(result);
    }

    [HttpGet("products/{id}")]
    [Authorize(Policy = Permissions.ProductRead)]
    public async Task<IActionResult> GetProductById(string id, CancellationToken cancellationToken)
    {
        var query = new GetProductByIdQuery(id);
        var result = await _sender.Send(query, cancellationToken);
        return HandleResult(result);
    }

    [HttpPost("products")]
    [Authorize(Policy = Permissions.ProductCreate)]
    public async Task<IActionResult> CreateProduct([FromBody] ProductDto productDto, CancellationToken cancellationToken)
    {
        var command = new CreateProductCommand(productDto);
        var result = await _sender.Send(command, cancellationToken);

        if (!result.IsSuccess) return HandleResult(result);
        return CreatedAtAction(nameof(GetProductById), new { id = result.Data!.Id }, result.Data);
    }

    [HttpPost("products/import")]
    [Authorize(Policy = Permissions.ProductCreate)]
    public async Task<IActionResult> ImportProductsFromExcel([FromForm] IFormFile file, CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { title = "No file uploaded." });

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (extension != ".xlsx")
            return BadRequest(new { title = "Invalid file type! Please upload a modern Excel (.xlsx) file." });

        var errors = new List<string>();
        int importedCount = 0;

        try
        {
            using var stream = new MemoryStream();
            await file.CopyToAsync(stream, cancellationToken);
            
            // Realize the stream into a pristine byte array so the strict ZIP parser doesn't choke
            var fileBytes = stream.ToArray();

            // Set via Environment Variable to guarantee EPPlus 8 compatibility without crashes
            Environment.SetEnvironmentVariable("EPPlusLicenseContext", "NonCommercial");
            using var excelPackage = new ExcelPackage(new MemoryStream(fileBytes));
            var worksheet = excelPackage.Workbook.Worksheets.FirstOrDefault();

            if (worksheet == null || worksheet.Dimension == null)
                return BadRequest(new { title = "Excel file is empty or invalid." });

            var rowCount = worksheet.Dimension.Rows;
            var colCount = worksheet.Dimension.Columns;

            // 1. Map columns dynamically by reading the Headers in Row 1!
            var headers = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            for (int col = 1; col <= colCount; col++)
            {
                var headerText = worksheet.Cells[1, col].Text?.Trim();
                if (!string.IsNullOrWhiteSpace(headerText))
                    headers[headerText] = col;
            }

            int GetColIndex(params string[] names)
            {
                foreach (var name in names)
                {
                    if (headers.TryGetValue(name, out var idx)) return idx;
                }
                return -1;
            }

            int nameCol = GetColIndex("Name", "Product Name", "ProductName");
            int codeCol = GetColIndex("Code Number", "Code", "CodeNumber");
            int catCol = GetColIndex("Category", "CategoryName");
            int brandCol = GetColIndex("Brand", "BrandName");
            int deptCol = GetColIndex("Department", "Dept", "DepartmentName");
            int priceCol = GetColIndex("Price", "Cost");
            int qualityCol = GetColIndex("Condition", "Quality");
            int typeCol = GetColIndex("Acquisition Type", "PurchaseType", "Acquisition");
            int respCol = GetColIndex("Responsible Person", "ResponsiblePerson");

            if (nameCol == -1)
                return BadRequest(new { title = "Missing required 'Name' column in Excel file." });

            for (int row = 2; row <= rowCount; row++)
            {
                var name = worksheet.Cells[row, nameCol].Text?.Trim();
                if (string.IsNullOrWhiteSpace(name)) continue; // Skip empty rows

                decimal? price = null;
                if (priceCol != -1)
                {
                    var priceText = worksheet.Cells[row, priceCol].Text?.Trim()?.Replace("$", "").Replace(",", "");
                    if (decimal.TryParse(priceText, out var parsedPrice))
                        price = parsedPrice;
                }

                var productDto = new ProductDto
                {
                    Name = name,
                    CodeNumber = codeCol != -1 && !string.IsNullOrWhiteSpace(worksheet.Cells[row, codeCol].Text) ? worksheet.Cells[row, codeCol].Text.Trim() : null,
                    CategoryName = catCol != -1 && !string.IsNullOrWhiteSpace(worksheet.Cells[row, catCol].Text) ? worksheet.Cells[row, catCol].Text.Trim() : null,
                    BrandName = brandCol != -1 && !string.IsNullOrWhiteSpace(worksheet.Cells[row, brandCol].Text) ? worksheet.Cells[row, brandCol].Text.Trim() : null,
                    DepartmentName = deptCol != -1 && !string.IsNullOrWhiteSpace(worksheet.Cells[row, deptCol].Text) ? worksheet.Cells[row, deptCol].Text.Trim() : null,
                    Price = price,
                    Quality = qualityCol != -1 && !string.IsNullOrWhiteSpace(worksheet.Cells[row, qualityCol].Text) ? worksheet.Cells[row, qualityCol].Text.Trim() : null,
                    PurchaseType = typeCol != -1 && !string.IsNullOrWhiteSpace(worksheet.Cells[row, typeCol].Text) ? worksheet.Cells[row, typeCol].Text.Trim() : "None",
                    ResponsiblePerson = respCol != -1 && !string.IsNullOrWhiteSpace(worksheet.Cells[row, respCol].Text) ? worksheet.Cells[row, respCol].Text.Trim() : null
                };

                var command = new CreateProductCommand(productDto);
                var result = await _sender.Send(command, cancellationToken);

                if (result.IsSuccess)
                {
                    importedCount++;
                }
                else
                {
                    errors.Add($"Row {row}: {result.ErrorMessage}");
                }
            }

            return Ok(new { message = $"Successfully imported {importedCount} products.", importedCount, errors });
        }
        catch (InvalidDataException)
        {
            return BadRequest(new { title = "Invalid file format! Please open your file in Excel and choose 'Save As -> Excel Workbook (*.xlsx)' before uploading." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { title = $"Import crashed: {ex.Message}", details = ex.ToString() });
        }
    }

    [HttpPut("products/{id}")]
    [Authorize(Policy = Permissions.ProductUpdate)]
    public async Task<IActionResult> UpdateProduct(string id, [FromBody] ProductDto productDto, CancellationToken cancellationToken)
    {
        var command = new UpdateProductCommand(id, productDto);
        var result = await _sender.Send(command, cancellationToken);
        return HandleResult(result);
    }

    [HttpDelete("products/{id}")]
    [Authorize(Policy = Permissions.ProductDelete)]
    public async Task<IActionResult> DeleteProduct(string id, CancellationToken cancellationToken)
    {
        var command = new DeleteProductCommand(id);
        var result = await _sender.Send(command, cancellationToken);
        return HandleResult(result);
    }

    [HttpPost("products/{productId}/image")]
    [Authorize(Policy = Permissions.ProductUpdate)]
    [RequestSizeLimit(5 * 1024 * 1024)] // 5 MB
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UploadProductImage(string productId, [FromForm] IFormFile file, CancellationToken cancellationToken)
    {
        var command = new UploadProductImageCommand(productId, file);
        var result = await _sender.Send(command, cancellationToken);
        return HandleResult(result);
    }

    [HttpDelete("products/{productId}/image")]
    [Authorize(Policy = Permissions.ProductUpdate)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteProductImage(string productId, CancellationToken cancellationToken)
    {
        var command = new DeleteProductImageCommand(productId);
        var result = await _sender.Send(command, cancellationToken);
        return HandleResult(result);
    }
}