using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
using OfficeOpenXml.Style;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using SchoolAPI.Contracts.Reports;
using SchoolAPI.Data;
using SchoolAPI.Entities;
using SchoolAPI.Helpers;
using System.Drawing;

namespace SchoolAPI.Services.Reporting;

public sealed class MonthlyTransactionReportService : IMonthlyTransactionReportService
{
    private readonly SchoolDbContext _context;
    private readonly IWebHostEnvironment _environment;

    public MonthlyTransactionReportService(SchoolDbContext context, IWebHostEnvironment environment)
    {
        _context = context;
        _environment = environment;
    }

    public Task<string> GenerateMonthlyTransactionsPdfAsync(
        int year,
        int month,
        string? departmentId = null,
        string? transactionType = null,
        string? search = null,
        string? vehicleType = null,
        CancellationToken cancellationToken = default)
    {
        return GenerateMonthlyTransactionsReportAsync(year, month, ReportFormat.Pdf, departmentId, transactionType, search, vehicleType, cancellationToken);
    }

    public Task<string> GenerateMonthlyTransactionsExcelAsync(
        int year,
        int month,
        string? departmentId = null,
        string? transactionType = null,
        string? search = null,
        string? vehicleType = null,
        CancellationToken cancellationToken = default)
    {
        return GenerateMonthlyTransactionsReportAsync(year, month, ReportFormat.Excel, departmentId, transactionType, search, vehicleType, cancellationToken);
    }

    private async Task<string> GenerateMonthlyTransactionsReportAsync(
        int year,
        int month,
        ReportFormat format,
        string? departmentId,
        string? transactionType,
        string? search,
        string? vehicleType,
        CancellationToken cancellationToken = default)
    {
        if (year < 2000 || month is < 1 or > 12)
        {
            throw new ArgumentOutOfRangeException(nameof(month), "Year or month is out of range.");
        }

        var monthStart = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
        var nextMonthStart = monthStart.AddMonths(1);

        var query = _context.Transactions
            .AsNoTracking()
            .Include(transaction => transaction.Product)
            .Include(transaction => transaction.Donor)
            .Include(transaction => transaction.Department)
            .Include(transaction => transaction.Responser)
            .Where(transaction => transaction.CreatedDate.HasValue
                && transaction.CreatedDate.Value >= monthStart
                && transaction.CreatedDate.Value < nextMonthStart);

        var filterParts = new List<string>();
        if (!string.IsNullOrWhiteSpace(departmentId))
        {
            var deptIds = departmentId.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList();
            query = query.Where(t => deptIds.Contains(t.DepartmentId));
            var deptNames = await _context.Departments
                .AsNoTracking()
                .Where(d => deptIds.Contains(d.Id))
                .Select(d => d.Name)
                .ToListAsync(cancellationToken);
            if (deptNames.Count > 0) filterParts.Add($"Department: {string.Join(", ", deptNames)}");
        }

        if (!string.IsNullOrWhiteSpace(transactionType) &&
            !transactionType.Equals("All", StringComparison.OrdinalIgnoreCase) &&
            Enum.TryParse<TransactionType>(transactionType.Trim(), true, out var parsedType))
        {
            query = query.Where(t => t.TransactionType == parsedType);
            filterParts.Add($"Type: {parsedType}");
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = $"%{search.Trim()}%";
            query = query.Where(t =>
                EF.Functions.ILike(t.Product.ProductName, term) ||
                (t.Product.CodeNumber != null && EF.Functions.ILike(t.Product.CodeNumber, term)) ||
                EF.Functions.ILike(t.ProviderName, term) ||
                EF.Functions.ILike(t.Donor.Name, term) ||
                EF.Functions.ILike(t.Department.Name, term) ||
                EF.Functions.ILike(t.Resource, term));
            filterParts.Add($"Search: {search.Trim()}");
        }

        if (!string.IsNullOrWhiteSpace(vehicleType))
        {
            query = VehicleFilterHelper.ApplyTransactionVehicleFilter(query, vehicleType);
            var vehicleLabel = VehicleFilterHelper.FormatVehicleFilterLabel(vehicleType);
            if (!string.IsNullOrEmpty(vehicleLabel)) filterParts.Add($"Fleet: {vehicleLabel}");
        }

        var filterSummary = filterParts.Count > 0 ? string.Join(" | ", filterParts) : "All Departments · All Types";

        var rows = await query
            .OrderBy(transaction => transaction.CreatedDate)
            .Select(transaction => new MonthlyTransactionReportRow
            {
                TransactionDate = transaction.CreatedDate ?? DateTime.UtcNow,
                ProductName = transaction.Product.ProductName,
                PlateNumber = transaction.Product.PlateNumber,
                EngineNumber = transaction.Product.EngineNumber,
                TransactionType = transaction.TransactionType.ToString(),
                DonorName = transaction.Donor.Name,
                DepartmentName = transaction.Department.Name,
                ResponserName = transaction.Responser.Name,
                ProviderName = transaction.ProviderName,
                Resource = transaction.Resource,
                Quantity = transaction.Quantity,
                TotalCost = transaction.TotalCost
            })
            .ToListAsync(cancellationToken);

        bool includeVehicleColumns = !string.IsNullOrWhiteSpace(vehicleType)
            || rows.Any(r => !string.IsNullOrWhiteSpace(r.PlateNumber) || !string.IsNullOrWhiteSpace(r.EngineNumber));

        var outputDirectory = Path.Combine(_environment.ContentRootPath, "Reports", "Generated");
        Directory.CreateDirectory(outputDirectory);

        var suffix = filterParts.Count > 0 ? $"-filtered-{Guid.NewGuid():N}" : "";
        var outputFileName = $"monthly-transactions-{year:D4}-{month:D2}{suffix}.{GetFileExtension(format)}";
        var outputPath = Path.Combine(outputDirectory, outputFileName);

        var bytes = format == ReportFormat.Pdf
            ? BuildPdf(rows, monthStart, nextMonthStart, filterSummary, includeVehicleColumns)
            : BuildExcel(rows, monthStart, nextMonthStart, filterSummary, includeVehicleColumns);

        await File.WriteAllBytesAsync(outputPath, bytes, cancellationToken);

        return outputPath;
    }

    private static byte[] BuildPdf(IReadOnlyCollection<MonthlyTransactionReportRow> rows, DateTime monthStart, DateTime nextMonthStart, string filterSummary, bool includeVehicleColumns)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A3);
                page.Margin(18);
                page.DefaultTextStyle(style => style.FontSize(8).FontFamily("Arial"));

                page.Content().Column(column =>
                {
                    column.Spacing(10);

                    column.Item().Column(header =>
                    {
                        header.Item().AlignCenter().Text("Monthly Transactions Report").FontSize(18).Bold();
                        header.Item().AlignCenter().Text($"Period: {monthStart:yyyy-MM-dd} to {nextMonthStart.AddDays(-1):yyyy-MM-dd}  |  {filterSummary}").FontSize(10).FontColor(Colors.Grey.Darken2);
                        header.Item().AlignCenter().Text($"Generated On: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss 'UTC'}").FontSize(9).FontColor(Colors.Grey.Darken1);
                    });

                    column.Item().Table(table =>
                    {
                        uint totalCols = includeVehicleColumns ? 11u : 9u;
                        uint labelSpan = totalCols - 1;

                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn(1.2f);
                            columns.RelativeColumn(1.7f);
                            if (includeVehicleColumns)
                            {
                                columns.RelativeColumn(1.1f);
                                columns.RelativeColumn(1.3f);
                            }
                            columns.RelativeColumn(1.0f);
                            columns.RelativeColumn(1.5f);
                            columns.RelativeColumn(1.3f);
                            columns.RelativeColumn(1.1f);
                            columns.RelativeColumn(1.8f);
                            columns.RelativeColumn(0.8f);
                            columns.RelativeColumn(1.0f);
                        });

                        table.Header(header =>
                        {
                            header.Cell().Element(HeaderCellStyle).Text("Date");
                            header.Cell().Element(HeaderCellStyle).Text("Product");
                            if (includeVehicleColumns)
                            {
                                header.Cell().Element(HeaderCellStyle).Text("Plate #");
                                header.Cell().Element(HeaderCellStyle).Text("Engine/Serial #");
                            }
                            header.Cell().Element(HeaderCellStyle).Text("Type");
                            header.Cell().Element(HeaderCellStyle).Text("Donor");
                            header.Cell().Element(HeaderCellStyle).Text("Department");
                            header.Cell().Element(HeaderCellStyle).Text("Responser");
                            header.Cell().Element(HeaderCellStyle).Text("Provider / Resource");
                            header.Cell().Element(HeaderCellStyle).AlignCenter().Text("Qty");
                            header.Cell().Element(HeaderCellStyle).AlignRight().Text("Total");
                        });

                        if (rows.Count == 0)
                        {
                            table.Cell().ColumnSpan(totalCols).Element(CellBodyStyle).AlignCenter().Text("No transactions found for the selected period.");
                            return;
                        }

                        foreach (var row in rows)
                        {
                            table.Cell().Element(CellBodyStyle).Text(row.TransactionDate.ToString("yyyy-MM-dd"));
                            table.Cell().Element(CellBodyStyle).Text(row.ProductName);
                            if (includeVehicleColumns)
                            {
                                table.Cell().Element(CellBodyStyle).Text(string.IsNullOrWhiteSpace(row.PlateNumber) ? "-" : row.PlateNumber);
                                table.Cell().Element(CellBodyStyle).Text(string.IsNullOrWhiteSpace(row.EngineNumber) ? "-" : row.EngineNumber);
                            }
                            table.Cell().Element(CellBodyStyle).Text(row.TransactionType);
                            table.Cell().Element(CellBodyStyle).Text(row.DonorName);
                            table.Cell().Element(CellBodyStyle).Text(row.DepartmentName);
                            table.Cell().Element(CellBodyStyle).Text(row.ResponserName);
                            table.Cell().Element(CellBodyStyle).Text(string.Join(" / ", new[] { row.ProviderName, row.Resource }.Where(value => !string.IsNullOrWhiteSpace(value))));
                            table.Cell().Element(CellBodyStyle).AlignCenter().Text(row.Quantity.ToString());
                            table.Cell().Element(CellBodyStyle).AlignRight().Text(row.TotalCost.ToString("C2"));
                        }

                        table.Cell().ColumnSpan(labelSpan).Element(CellBodyStyle).AlignRight().Text("Grand Total").SemiBold();
                        table.Cell().Element(CellBodyStyle).AlignRight().Text(rows.Sum(x => x.TotalCost).ToString("C2")).SemiBold();
                    });
                });
            });
        });

        using var stream = new MemoryStream();
        document.GeneratePdf(stream);
        return stream.ToArray();
    }

    private static byte[] BuildExcel(IReadOnlyCollection<MonthlyTransactionReportRow> rows, DateTime monthStart, DateTime nextMonthStart, string filterSummary, bool includeVehicleColumns)
    {
        using var package = new ExcelPackage();
        var worksheet = package.Workbook.Worksheets.Add("Monthly Transactions");

        var headers = includeVehicleColumns
            ? new[] { "Date", "Product", "Plate #", "Engine/Serial #", "Type", "Donor", "Department", "Responser", "Provider / Resource", "Qty", "Total" }
            : new[] { "Date", "Product", "Type", "Donor", "Department", "Responser", "Provider / Resource", "Qty", "Total" };

        worksheet.Cells[1, 1, 1, headers.Length].Merge = true;
        worksheet.Cells["A1"].Value = "Monthly Transactions Report";
        worksheet.Cells["A1"].Style.Font.Bold = true;
        worksheet.Cells["A1"].Style.Font.Size = 16;
        worksheet.Cells["A1"].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;

        worksheet.Cells[2, 1, 2, headers.Length].Merge = true;
        worksheet.Cells["A2"].Value = $"Period: {monthStart:yyyy-MM-dd} to {nextMonthStart.AddDays(-1):yyyy-MM-dd} | {filterSummary}";
        worksheet.Cells["A2"].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;

        worksheet.Cells[3, 1, 3, headers.Length].Merge = true;
        worksheet.Cells["A3"].Value = $"Generated On: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss 'UTC'}";
        worksheet.Cells["A3"].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;

        var headerRow = 5;
        for (var columnIndex = 0; columnIndex < headers.Length; columnIndex++)
        {
            worksheet.Cells[headerRow, columnIndex + 1].Value = headers[columnIndex];
        }

        using (var headerRange = worksheet.Cells[headerRow, 1, headerRow, headers.Length])
        {
            headerRange.Style.Font.Bold = true;
            headerRange.Style.Fill.PatternType = ExcelFillStyle.Solid;
            headerRange.Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.LightGray);
            headerRange.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
            headerRange.Style.Border.BorderAround(ExcelBorderStyle.Thin);
        }

        if (rows.Count == 0)
        {
            worksheet.Cells[headerRow + 1, 1, headerRow + 1, headers.Length].Merge = true;
            worksheet.Cells[headerRow + 1, 1].Value = "No transactions found for the selected period.";
        }
        else
        {
            var rowIndex = headerRow + 1;
            foreach (var row in rows)
            {
                int col = 1;
                worksheet.Cells[rowIndex, col++].Value = row.TransactionDate.ToString("yyyy-MM-dd");
                worksheet.Cells[rowIndex, col++].Value = row.ProductName;
                if (includeVehicleColumns)
                {
                    worksheet.Cells[rowIndex, col++].Value = string.IsNullOrWhiteSpace(row.PlateNumber) ? "-" : row.PlateNumber;
                    worksheet.Cells[rowIndex, col++].Value = string.IsNullOrWhiteSpace(row.EngineNumber) ? "-" : row.EngineNumber;
                }
                worksheet.Cells[rowIndex, col++].Value = row.TransactionType;
                worksheet.Cells[rowIndex, col++].Value = row.DonorName;
                worksheet.Cells[rowIndex, col++].Value = row.DepartmentName;
                worksheet.Cells[rowIndex, col++].Value = row.ResponserName;
                worksheet.Cells[rowIndex, col++].Value = string.Join(" / ", new[] { row.ProviderName, row.Resource }.Where(value => !string.IsNullOrWhiteSpace(value)));
                worksheet.Cells[rowIndex, col++].Value = row.Quantity;
                worksheet.Cells[rowIndex, col].Value = row.TotalCost;
                worksheet.Cells[rowIndex, col].Style.Numberformat.Format = "$#,##0.00";
                rowIndex++;
            }

            worksheet.Cells[rowIndex, 1, rowIndex, headers.Length - 1].Merge = true;
            worksheet.Cells[rowIndex, 1].Value = "Grand Total";
            worksheet.Cells[rowIndex, headers.Length].Value = rows.Sum(x => x.TotalCost);
            worksheet.Cells[rowIndex, headers.Length].Style.Numberformat.Format = "$#,##0.00";
        }

        using (var tableRange = worksheet.Cells[headerRow, 1, worksheet.Dimension.End.Row, headers.Length])
        {
            tableRange.Style.Border.Top.Style = ExcelBorderStyle.Thin;
            tableRange.Style.Border.Bottom.Style = ExcelBorderStyle.Thin;
            tableRange.Style.Border.Left.Style = ExcelBorderStyle.Thin;
            tableRange.Style.Border.Right.Style = ExcelBorderStyle.Thin;
            tableRange.Style.VerticalAlignment = ExcelVerticalAlignment.Center;
        }

        worksheet.Cells.AutoFitColumns();
        return package.GetAsByteArray();
    }

    private static IContainer HeaderCellStyle(IContainer container)
    {
        return container
            .Border(1)
            .BorderColor(Colors.Grey.Lighten1)
            .Background(Colors.Grey.Darken3)
            .Padding(4)
            .AlignMiddle()
            .AlignCenter()
            .DefaultTextStyle(style => style.FontColor(Colors.White).SemiBold());
    }

    private static IContainer CellBodyStyle(IContainer container)
    {
        return container
            .Border(1)
            .BorderColor(Colors.Grey.Lighten2)
            .Padding(4)
            .AlignMiddle();
    }

    private static string GetFileExtension(ReportFormat format) => format == ReportFormat.Pdf ? "pdf" : "xlsx";

    private enum ReportFormat
    {
        Pdf,
        Excel
    }
}