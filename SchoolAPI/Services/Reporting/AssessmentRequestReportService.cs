using OfficeOpenXml;
using OfficeOpenXml.Style;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using SchoolAPI.Contracts.Reports;
using System.Drawing;

namespace SchoolAPI.Services.Reporting;

public sealed class AssessmentRequestReportService : IAssessmentRequestReportService
{
    private static readonly string[] ExcelColumns = ["Description", "Quantity", "Price", "Total"];

    public async Task<byte[]> GeneratePdfAsync(AssessmentRequestFormDto request, CancellationToken cancellationToken = default)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(24);
                page.DefaultTextStyle(textStyle => textStyle.FontSize(10).FontFamily("Arial"));

                page.Content().Column(column =>
                {
                    column.Spacing(12);

                    column.Item().Row(row =>
                    {
                        var logoPath = "wwwroot/images/organization-logo.png";
                        if (System.IO.File.Exists(logoPath))
                        {
                            byte[] logoBytes = System.IO.File.ReadAllBytes(logoPath);
                            row.ConstantItem(78).Height(60).Image(logoBytes);
                        }
                        else
                        {
                            row.ConstantItem(78).Height(60).AlignMiddle().AlignCenter().Border(1).BorderColor(Colors.Grey.Lighten2)
                                .Text("LOGO").FontSize(16).Bold().FontColor(Colors.Grey.Darken2); // Placeholder until image is linked
                        }

                        row.RelativeItem().Column(header =>
                        {
                            header.Item().AlignCenter().Text("IT Assessment Form").FontSize(18).Bold();
                            header.Item().AlignCenter().Text("Assessment Request for New Product").FontSize(11).FontColor(Colors.Grey.Darken2);
                        });
                    });

                    column.Item().Row(row =>
                    {
                        row.RelativeItem().Column(left =>
                        {
                            left.Spacing(4);
                            left.Item().Text($"Assessment No: {request.AssessmentNo}");
                            left.Item().Text($"Assessment Date: {request.AssessmentDate:dd-MM-yyyy}");
                            left.Item().Text($"Ref to Ticket No: {request.RefToTicketNo}");
                            left.Item().Text($"Item Code: {request.ItemCode}");
                        });

                        row.RelativeItem().Column(right =>
                        {
                            right.Spacing(4);
                            right.Item().Text($"User: {request.UserName}");
                            right.Item().Text($"Department: {request.DepartmentName}");
                            right.Item().Text($"Brand: {request.BrandName}");
                            right.Item().Text($"Model: {request.ModelName}");
                        });
                    });

                    column.Item().Text($"Subject: {request.Subject}").Bold();
                    column.Item().Text($"Issue description: {request.IssueDescription}");

                    column.Item().Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn(5);
                            columns.RelativeColumn(2);
                            columns.RelativeColumn(2);
                            columns.RelativeColumn(2);
                        });

                        table.Header(header =>
                        {
                            header.Cell().Element(CellHeaderStyle).Text("Description");
                            header.Cell().Element(CellHeaderStyle).AlignCenter().Text("Quantity");
                            header.Cell().Element(CellHeaderStyle).AlignRight().Text("Price");
                            header.Cell().Element(CellHeaderStyle).AlignRight().Text("Total");
                        });

                        var items = request.Items.Count == 0
                            ? [new AssessmentRequestLineItemDto { Description = string.Empty, Quantity = 1, Price = 0m }]
                            : request.Items;

                        foreach (var item in items)
                        {
                            table.Cell().Element(CellBodyStyle).Text(item.Description);
                            table.Cell().Element(CellBodyStyle).AlignCenter().Text(item.Quantity.ToString());
                            table.Cell().Element(CellBodyStyle).AlignRight().Text(item.Price.ToString("C2"));
                            table.Cell().Element(CellBodyStyle).AlignRight().Text(item.Total.ToString("C2"));
                        }

                        table.Cell().ColumnSpan(3).Element(CellBodyStyle).AlignRight().Text("Total").SemiBold();
                        table.Cell().Element(CellBodyStyle).AlignRight().Text(items.Sum(x => x.Total).ToString("C2")).SemiBold();
                    });

                    column.Item().AlignRight().PaddingTop(24).Column(footer =>
                    {
                        footer.Item().Text($"Checked by: {request.CheckedBy}");
                        footer.Item().Text($"Checked Date: {(request.CheckedDate.HasValue ? request.CheckedDate.Value.ToString("dd-MM-yyyy") : string.Empty)}");
                    });

                    column.Item().AlignCenter().PaddingTop(12).Text("This is a computer generated form, no authorized signature(s) is required.").FontSize(9);
                });
            });
        });

        await using var stream = new MemoryStream();
        document.GeneratePdf(stream);
        return stream.ToArray();
    }

    public Task<byte[]> GenerateExcelAsync(AssessmentRequestFormDto request, CancellationToken cancellationToken = default)
    {
        using var package = new ExcelPackage();
        var worksheet = package.Workbook.Worksheets.Add("Assessment Request");

        worksheet.Cells["A1:H1"].Merge = true;
        worksheet.Cells["A1"].Value = "IT Assessment Form";
        worksheet.Cells["A1"].Style.Font.Bold = true;
        worksheet.Cells["A1"].Style.Font.Size = 16;
        worksheet.Cells["A1"].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;

        worksheet.Cells["A2:H2"].Merge = true;
        worksheet.Cells["A2"].Value = "Assessment Request for New Product";
        worksheet.Cells["A2"].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;

        worksheet.Cells["A4:B4"].Merge = true;
        worksheet.Cells["A4"].Value = $"Assessment No: {request.AssessmentNo}";
        worksheet.Cells["C4:D4"].Merge = true;
        worksheet.Cells["C4"].Value = $"User: {request.UserName}";
        worksheet.Cells["E4:F4"].Merge = true;
        worksheet.Cells["E4"].Value = $"Assessment Date: {request.AssessmentDate:dd-MM-yyyy}";
        worksheet.Cells["G4:H4"].Merge = true;
        worksheet.Cells["G4"].Value = $"Department: {request.DepartmentName}";

        worksheet.Cells["A5:B5"].Merge = true;
        worksheet.Cells["A5"].Value = $"Ref to Ticket No: {request.RefToTicketNo}";
        worksheet.Cells["C5:D5"].Merge = true;
        worksheet.Cells["C5"].Value = $"Brand: {request.BrandName}";
        worksheet.Cells["E5:F5"].Merge = true;
        worksheet.Cells["E5"].Value = $"Item Code: {request.ItemCode}";
        worksheet.Cells["G5:H5"].Merge = true;
        worksheet.Cells["G5"].Value = $"Model: {request.ModelName}";

        worksheet.Cells["A7:H7"].Merge = true;
        worksheet.Cells["A7"].Value = $"Subject: {request.Subject}";
        worksheet.Cells["A8:H8"].Merge = true;
        worksheet.Cells["A8"].Value = $"Issue description: {request.IssueDescription}";

        var startRow = 10;
        worksheet.Cells[startRow, 1].Value = "Description";
        worksheet.Cells[startRow, 2].Value = "Quantity";
        worksheet.Cells[startRow, 3].Value = "Price";
        worksheet.Cells[startRow, 4].Value = "Total";

        using (var headerRange = worksheet.Cells[startRow, 1, startRow, 4])
        {
            headerRange.Style.Font.Bold = true;
            headerRange.Style.Fill.PatternType = ExcelFillStyle.Solid;
            headerRange.Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.LightGray);
            headerRange.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
            headerRange.Style.Border.BorderAround(ExcelBorderStyle.Thin);
        }

        var items = request.Items.Count == 0
            ? [new AssessmentRequestLineItemDto { Description = string.Empty, Quantity = 1, Price = 0m }]
            : request.Items;

        var row = startRow + 1;
        foreach (var item in items)
        {
            worksheet.Cells[row, 1].Value = item.Description;
            worksheet.Cells[row, 2].Value = item.Quantity;
            worksheet.Cells[row, 3].Value = item.Price;
            worksheet.Cells[row, 4].Value = item.Total;

            worksheet.Cells[row, 3].Style.Numberformat.Format = "$#,##0.00";
            worksheet.Cells[row, 4].Style.Numberformat.Format = "$#,##0.00";
            row++;
        }

        worksheet.Cells[row, 1, row, 3].Merge = true;
        worksheet.Cells[row, 1].Value = "Total";
        worksheet.Cells[row, 4].Value = items.Sum(x => x.Total);
        worksheet.Cells[row, 4].Style.Numberformat.Format = "$#,##0.00";

        worksheet.Cells[$"A{row + 2}:H{row + 3}"].Merge = true;
        worksheet.Cells[$"A{row + 2}"].Value = $"Checked by: {request.CheckedBy}\nChecked Date: {(request.CheckedDate.HasValue ? request.CheckedDate.Value.ToString("dd-MM-yyyy") : string.Empty)}";
        worksheet.Cells[$"A{row + 5}:H{row + 5}"].Merge = true;
        worksheet.Cells[$"A{row + 5}"].Value = "This is a computer generated form, no authorized signature(s) is required.";

        worksheet.Cells[worksheet.Dimension.Address].Style.Border.Top.Style = ExcelBorderStyle.Thin;
        worksheet.Cells[worksheet.Dimension.Address].Style.Border.Bottom.Style = ExcelBorderStyle.Thin;
        worksheet.Cells[worksheet.Dimension.Address].Style.Border.Left.Style = ExcelBorderStyle.Thin;
        worksheet.Cells[worksheet.Dimension.Address].Style.Border.Right.Style = ExcelBorderStyle.Thin;
        worksheet.Cells[worksheet.Dimension.Address].Style.VerticalAlignment = ExcelVerticalAlignment.Center;

        worksheet.Cells.AutoFitColumns();

        return Task.FromResult(package.GetAsByteArray());
    }

    private static IContainer CellHeaderStyle(IContainer container)
    {
        return container
            .Border(1)
            .BorderColor(Colors.Grey.Lighten1)
            .Background(Colors.Grey.Lighten3)
            .Padding(4)
            .DefaultTextStyle(textStyle => textStyle.SemiBold());
    }

    private static IContainer CellBodyStyle(IContainer container)
    {
        return container
            .Border(1)
            .BorderColor(Colors.Grey.Lighten2)
            .Padding(4);
    }
}