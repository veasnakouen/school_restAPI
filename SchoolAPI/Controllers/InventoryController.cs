using System.IO;
using System.Text;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OfficeOpenXml;
using OfficeOpenXml.Style;
using SchoolAPI.Application.Features.Products.Create;
using SchoolAPI.Application.Features.Products.Delete;
using SchoolAPI.Application.Features.Products.Image;
using SchoolAPI.Application.Features.Products.GetAll;
using SchoolAPI.Application.Features.Products.Update;
using SchoolAPI.Application.Features.Products.GetById;
using SchoolAPI.Constant;
using SchoolAPI.Contracts;

namespace SchoolAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Policy = Permissions.ProductRead)]
[ApiExplorerSettings(IgnoreApi = true)]
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

    [HttpGet("products/export")]
    [Authorize(Policy = Permissions.ProductRead)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportProductsExcel([FromQuery] GetAllProductsQuery query, CancellationToken cancellationToken)
    {
        ExcelPackage.License.SetNonCommercialPersonal("SchoolAPI");

        // Fetch up to 100,000 products for export
        var exportQuery = query with { PageNumber = 1, PageSize = query.PageSize > 10 ? query.PageSize : 100000 };
        var result = await _sender.Send(exportQuery, cancellationToken);
        if (!result.IsSuccess) return HandleResult(result);

        var products = result.Data?.Items ?? new List<ProductDto>();

        using var package = new ExcelPackage();
        var worksheet = package.Workbook.Worksheets.Add("Products");

        var headers = new[]
        {
            "Name", "Code Number", "Category", "Brand", "Department",
            "Condition", "Price", "Qty", "Voucher #", "Acquisition Type",
            "Supplier", "Donor", "Responsible Person", "Year", "Plate #", "Engine #", "Description"
        };

        for (int col = 0; col < headers.Length; col++)
        {
            worksheet.Cells[1, col + 1].Value = headers[col];
        }

        using (var headerRange = worksheet.Cells[1, 1, 1, headers.Length])
        {
            headerRange.Style.Font.Bold = true;
            headerRange.Style.Fill.PatternType = ExcelFillStyle.Solid;
            headerRange.Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.LightGray);
            headerRange.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
            headerRange.Style.Border.BorderAround(ExcelBorderStyle.Thin);
        }

        int row = 2;
        foreach (var p in products)
        {
            worksheet.Cells[row, 1].Value = p.Name;
            worksheet.Cells[row, 2].Value = p.CodeNumber;
            worksheet.Cells[row, 3].Value = p.CategoryName;
            worksheet.Cells[row, 4].Value = p.BrandName;
            worksheet.Cells[row, 5].Value = p.DepartmentName;
            worksheet.Cells[row, 6].Value = p.Quality;
            worksheet.Cells[row, 7].Value = p.Price;
            if (p.Price.HasValue) worksheet.Cells[row, 7].Style.Numberformat.Format = "$#,##0.00";
            worksheet.Cells[row, 8].Value = p.InitialQuantity;
            worksheet.Cells[row, 9].Value = p.VoucherNumber;
            worksheet.Cells[row, 10].Value = p.PurchaseType;
            worksheet.Cells[row, 11].Value = p.SupplierName;
            worksheet.Cells[row, 12].Value = p.DonorName;
            worksheet.Cells[row, 13].Value = p.ResponsiblePerson;
            worksheet.Cells[row, 14].Value = p.Year;
            worksheet.Cells[row, 15].Value = p.PlateNumber;
            worksheet.Cells[row, 16].Value = p.EngineNumber;
            worksheet.Cells[row, 17].Value = p.Description;
            row++;
        }

        if (products.Count > 0)
        {
            using var tableRange = worksheet.Cells[1, 1, row - 1, headers.Length];
            tableRange.Style.Border.Top.Style = ExcelBorderStyle.Thin;
            tableRange.Style.Border.Bottom.Style = ExcelBorderStyle.Thin;
            tableRange.Style.Border.Left.Style = ExcelBorderStyle.Thin;
            tableRange.Style.Border.Right.Style = ExcelBorderStyle.Thin;
        }

        worksheet.Cells.AutoFitColumns();
        var fileBytes = package.GetAsByteArray();
        return File(fileBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"products_{DateTime.UtcNow:yyyyMMdd}.xlsx");
    }

    [HttpGet("products/export/csv")]
    [Authorize(Policy = Permissions.ProductRead)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportProductsCsv([FromQuery] GetAllProductsQuery query, CancellationToken cancellationToken)
    {
        var exportQuery = query with { PageNumber = 1, PageSize = query.PageSize > 10 ? query.PageSize : 100000 };
        var result = await _sender.Send(exportQuery, cancellationToken);
        if (!result.IsSuccess) return HandleResult(result);

        var products = result.Data?.Items ?? new List<ProductDto>();
        var sb = new StringBuilder();
        sb.AppendLine("Name,Code Number,Category,Brand,Department,Condition,Price,Qty,Voucher #,Acquisition Type,Supplier,Donor,Responsible Person,Year,Plate #,Engine #,Description");

        foreach (var p in products)
        {
            var fields = new[]
            {
                EscapeCsv(p.Name),
                EscapeCsv(p.CodeNumber),
                EscapeCsv(p.CategoryName),
                EscapeCsv(p.BrandName),
                EscapeCsv(p.DepartmentName),
                EscapeCsv(p.Quality),
                p.Price?.ToString("F2") ?? "",
                p.InitialQuantity?.ToString() ?? "",
                EscapeCsv(p.VoucherNumber),
                EscapeCsv(p.PurchaseType),
                EscapeCsv(p.SupplierName),
                EscapeCsv(p.DonorName),
                EscapeCsv(p.ResponsiblePerson),
                EscapeCsv(p.Year),
                EscapeCsv(p.PlateNumber),
                EscapeCsv(p.EngineNumber),
                EscapeCsv(p.Description)
            };
            sb.AppendLine(string.Join(",", fields));
        }

        var bytes = Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(sb.ToString())).ToArray();
        return File(bytes, "text/csv;charset=utf-8;", $"products_{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    private static string EscapeCsv(string? field)
    {
        if (string.IsNullOrEmpty(field)) return "";
        if (field.Contains(",") || field.Contains("\"") || field.Contains("\n") || field.Contains("\r"))
        {
            return $"\"{field.Replace("\"", "\"\"")}\"";
        }
        return field;
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
