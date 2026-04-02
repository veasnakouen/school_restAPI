using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
using OfficeOpenXml.Style;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using SchoolAPI.Contracts.Reports;
using SchoolAPI.Data;
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

    public Task<string> GenerateMonthlyTransactionsPdfAsync(int year, int month, CancellationToken cancellationToken = default)
    {
        return GenerateMonthlyTransactionsReportAsync(year, month, ReportFormat.Pdf, cancellationToken);
    }

    public Task<string> GenerateMonthlyTransactionsExcelAsync(int year, int month, CancellationToken cancellationToken = default)
    {
        return GenerateMonthlyTransactionsReportAsync(year, month, ReportFormat.Excel, cancellationToken);
    }

    private async Task<string> GenerateMonthlyTransactionsReportAsync(
        int year,
        int month,
        ReportFormat format,
        CancellationToken cancellationToken = default)
    {
        if (year < 2000 || month is < 1 or > 12)
        {
            throw new ArgumentOutOfRangeException(nameof(month), "Year or month is out of range.");
        }

        var monthStart = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
        var nextMonthStart = monthStart.AddMonths(1);

        var rows = await _context.Transactions
            .AsNoTracking()
            .Include(transaction => transaction.Product)
            .Include(transaction => transaction.Donor)
            .Include(transaction => transaction.Department)
            .Include(transaction => transaction.Responser)
            .Where(transaction => transaction.CreatedDate.HasValue
                && transaction.CreatedDate.Value >= monthStart
                && transaction.CreatedDate.Value < nextMonthStart)
            .OrderBy(transaction => transaction.CreatedDate)
            .Select(transaction => new MonthlyTransactionReportRow
            {
                TransactionDate = transaction.CreatedDate ?? DateTime.UtcNow,
                ProductName = transaction.Product.Name,
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

        var outputDirectory = Path.Combine(_environment.ContentRootPath, "Reports", "Generated");
        Directory.CreateDirectory(outputDirectory);

        var outputFileName = $"monthly-transactions-{year:D4}-{month:D2}.{GetFileExtension(format)}";
        var outputPath = Path.Combine(outputDirectory, outputFileName);

        var bytes = format == ReportFormat.Pdf
            ? BuildPdf(rows, monthStart, nextMonthStart)
            : BuildExcel(rows, monthStart, nextMonthStart);

        await File.WriteAllBytesAsync(outputPath, bytes, cancellationToken);

        return outputPath;
    }

    private static byte[] BuildPdf(IReadOnlyCollection<MonthlyTransactionReportRow> rows, DateTime monthStart, DateTime nextMonthStart)
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
                        header.Item().AlignCenter().Text($"Period: {monthStart:yyyy-MM-dd} to {nextMonthStart.AddDays(-1):yyyy-MM-dd}").FontSize(10).FontColor(Colors.Grey.Darken2);
                        header.Item().AlignCenter().Text($"Generated On: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss 'UTC'}").FontSize(9).FontColor(Colors.Grey.Darken1);
                    });

                    column.Item().Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn(1.3f);
                            columns.RelativeColumn(1.8f);
                            columns.RelativeColumn(1.1f);
                            columns.RelativeColumn(1.6f);
                            columns.RelativeColumn(1.4f);
                            columns.RelativeColumn(1.2f);
                            columns.RelativeColumn(1.9f);
                            columns.RelativeColumn(0.8f);
                            columns.RelativeColumn(1.0f);
                        });

                        table.Header(header =>
                        {
                            header.Cell().Element(HeaderCellStyle).Text("Date");
                            header.Cell().Element(HeaderCellStyle).Text("Product");
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
                            table.Cell().ColumnSpan(9).Element(CellBodyStyle).AlignCenter().Text("No transactions found for the selected period.");
                            return;
                        }

                        foreach (var row in rows)
                        {
                            table.Cell().Element(CellBodyStyle).Text(row.TransactionDate.ToString("yyyy-MM-dd"));
                            table.Cell().Element(CellBodyStyle).Text(row.ProductName);
                            table.Cell().Element(CellBodyStyle).Text(row.TransactionType);
                            table.Cell().Element(CellBodyStyle).Text(row.DonorName);
                            table.Cell().Element(CellBodyStyle).Text(row.DepartmentName);
                            table.Cell().Element(CellBodyStyle).Text(row.ResponserName);
                            table.Cell().Element(CellBodyStyle).Text(string.Join(" / ", new[] { row.ProviderName, row.Resource }.Where(value => !string.IsNullOrWhiteSpace(value))));
                            table.Cell().Element(CellBodyStyle).AlignCenter().Text(row.Quantity.ToString());
                            table.Cell().Element(CellBodyStyle).AlignRight().Text(row.TotalCost.ToString("C2"));
                        }

                        table.Cell().ColumnSpan(8).Element(CellBodyStyle).AlignRight().Text("Grand Total").SemiBold();
                        table.Cell().Element(CellBodyStyle).AlignRight().Text(rows.Sum(x => x.TotalCost).ToString("C2")).SemiBold();
                    });
                });
            });
        });

        using var stream = new MemoryStream();
        document.GeneratePdf(stream);
        return stream.ToArray();
    }

    private static byte[] BuildExcel(IReadOnlyCollection<MonthlyTransactionReportRow> rows, DateTime monthStart, DateTime nextMonthStart)
    {
        using var package = new ExcelPackage();
        var worksheet = package.Workbook.Worksheets.Add("Monthly Transactions");

        worksheet.Cells["A1:I1"].Merge = true;
        worksheet.Cells["A1"].Value = "Monthly Transactions Report";
        worksheet.Cells["A1"].Style.Font.Bold = true;
        worksheet.Cells["A1"].Style.Font.Size = 16;
        worksheet.Cells["A1"].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;

        worksheet.Cells["A2:I2"].Merge = true;
        worksheet.Cells["A2"].Value = $"Period: {monthStart:yyyy-MM-dd} to {nextMonthStart.AddDays(-1):yyyy-MM-dd}";
        worksheet.Cells["A2"].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;

        worksheet.Cells["A3:I3"].Merge = true;
        worksheet.Cells["A3"].Value = $"Generated On: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss 'UTC'}";
        worksheet.Cells["A3"].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;

        var headerRow = 5;
        var headers = new[] { "Date", "Product", "Type", "Donor", "Department", "Responser", "Provider / Resource", "Qty", "Total" };
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
                worksheet.Cells[rowIndex, 1].Value = row.TransactionDate.ToString("yyyy-MM-dd");
                worksheet.Cells[rowIndex, 2].Value = row.ProductName;
                worksheet.Cells[rowIndex, 3].Value = row.TransactionType;
                worksheet.Cells[rowIndex, 4].Value = row.DonorName;
                worksheet.Cells[rowIndex, 5].Value = row.DepartmentName;
                worksheet.Cells[rowIndex, 6].Value = row.ResponserName;
                worksheet.Cells[rowIndex, 7].Value = string.Join(" / ", new[] { row.ProviderName, row.Resource }.Where(value => !string.IsNullOrWhiteSpace(value)));
                worksheet.Cells[rowIndex, 8].Value = row.Quantity;
                worksheet.Cells[rowIndex, 9].Value = row.TotalCost;
                worksheet.Cells[rowIndex, 9].Style.Numberformat.Format = "$#,##0.00";
                rowIndex++;
            }

            worksheet.Cells[rowIndex, 1, rowIndex, 8].Merge = true;
            worksheet.Cells[rowIndex, 1].Value = "Grand Total";
            worksheet.Cells[rowIndex, 9].Value = rows.Sum(x => x.TotalCost);
            worksheet.Cells[rowIndex, 9].Style.Numberformat.Format = "$#,##0.00";
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