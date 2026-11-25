using System.Drawing;
using System.Globalization;
using System.Text.RegularExpressions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
using OfficeOpenXml.Style;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using SchoolAPI.Application.Features.Products.GetAll;
using SchoolAPI.Contracts;
using SchoolAPI.Contracts.Reports;
using SchoolAPI.Data;

namespace SchoolAPI.Services.Reporting;

public sealed class CustomInventoryReportService : ICustomInventoryReportService
{
    private readonly ISender _sender;
    private readonly SchoolDbContext _context;

    private sealed record ColumnDefinition(string Key, string Header, bool IsCurrency = false, bool IsNumeric = false);

    private static readonly Dictionary<string, ColumnDefinition> SupportedColumns = new(StringComparer.OrdinalIgnoreCase)
    {
        ["codeNumber"] = new("codeNumber", "Code No."),
        ["name"] = new("name", "Item Name"),
        ["categoryName"] = new("categoryName", "Category"),
        ["brandName"] = new("brandName", "Brand"),
        ["departmentName"] = new("departmentName", "Department"),
        ["quality"] = new("quality", "Condition"),
        ["initialQuantity"] = new("initialQuantity", "Qty", IsNumeric: true),
        ["price"] = new("price", "Unit Price", IsCurrency: true),
        ["totalValue"] = new("totalValue", "Total Value", IsCurrency: true),
        ["responsiblePerson"] = new("responsiblePerson", "Responsible Person"),
        ["supplierName"] = new("supplierName", "Supplier"),
        ["donorName"] = new("donorName", "Donor"),
        ["purchaseType"] = new("purchaseType", "Acquisition"),
        ["voucherNumber"] = new("voucherNumber", "Voucher #"),
        ["invoiceDate"] = new("invoiceDate", "Invoice Date"),
        ["year"] = new("year", "Year"),
        ["plateNumber"] = new("plateNumber", "Plate #"),
        ["engineNumber"] = new("engineNumber", "Engine/Serial #"),
        ["attributes"] = new("attributes", "Specs"),
        ["description"] = new("description", "Description")
    };

    private static readonly string[] LegacyHeaders =
    [
        "Code No", "Item Name", "Q.Ty", "% New", "Size/Color", "Brand",
        "Unit Price", "Invoice Date", "Location", "Responsible Person",
        "Suppliers", "Voucher #", "Donor"
    ];

    public CustomInventoryReportService(ISender sender, SchoolDbContext context)
    {
        _sender = sender;
        _context = context;
    }

    public async Task<byte[]> GenerateCustomExcelAsync(CustomInventoryReportRequestDto request, CancellationToken cancellationToken = default)
    {
        ExcelPackage.License.SetNonCommercialPersonal("SchoolAPI");

        var items = await FetchFilteredProductsAsync(request, cancellationToken);

        if (request.TemplateStyle.Equals("LegacyYearlyList", StringComparison.OrdinalIgnoreCase))
        {
            return BuildLegacyYearlyExcel(request, items);
        }

        var columns = ResolveColumns(request.Columns);
        var groups = GroupProducts(items, request.GroupBy);

        using var package = new ExcelPackage();

        if (groups.Count > 1 || !request.GroupBy.Equals("None", StringComparison.OrdinalIgnoreCase))
        {
            BuildSummaryWorksheet(package, request, items, groups);
        }

        var usedSheetNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "Summary" };
        foreach (var group in groups)
        {
            var sheetName = SanitizeWorksheetName(group.Key, usedSheetNames);
            BuildDetailWorksheet(package, sheetName, request, group.Value, columns);
        }

        return package.GetAsByteArray();
    }

    public async Task<byte[]> GenerateCustomPdfAsync(CustomInventoryReportRequestDto request, CancellationToken cancellationToken = default)
    {
        var items = await FetchFilteredProductsAsync(request, cancellationToken);
        var logoBytes = await ResolveLogoBytesAsync(request.LogoBase64, cancellationToken);

        if (request.TemplateStyle.Equals("LegacyYearlyList", StringComparison.OrdinalIgnoreCase))
        {
            return await BuildLegacyYearlyPdfAsync(request, items, logoBytes);
        }

        var columns = ResolveColumns(request.Columns);
        var totalQuantity = items.Sum(i => i.InitialQuantity ?? 1);
        var grandTotalValue = items.Sum(i => (i.Price ?? 0m) * (i.InitialQuantity ?? 1));

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(20);
                page.DefaultTextStyle(s => s.FontSize(8.5f).FontFamily("Arial"));

                page.Header().Column(headerCol =>
                {
                    headerCol.Item().Row(row =>
                    {
                        if (logoBytes is { Length: > 0 })
                        {
                            row.ConstantItem(54).Height(54).Image(logoBytes).FitArea();
                        }

                        row.RelativeItem().PaddingLeft(logoBytes is { Length: > 0 } ? 10 : 0).Column(titleCol =>
                        {
                            titleCol.Item().Text(string.IsNullOrWhiteSpace(request.CompanyName) ? "Organization Inventory" : request.CompanyName)
                                .FontSize(15).Bold().FontColor(Colors.Blue.Darken3);
                            titleCol.Item().Text(string.IsNullOrWhiteSpace(request.ReportTitle) ? "Inventory & Asset Report" : request.ReportTitle)
                                .FontSize(12).SemiBold().FontColor(Colors.Grey.Darken4);
                            titleCol.Item().Text($"Period: {request.Period}   |   Department: {request.DepartmentLabel}   |   Grouped By: {request.GroupBy}")
                                .FontSize(8).FontColor(Colors.Grey.Darken1);
                        });

                        row.ConstantItem(175).AlignRight().Column(metaCol =>
                        {
                            metaCol.Item().AlignRight().Text($"Generated: {DateTime.Now:dd-MMM-yyyy HH:mm}").FontSize(8).FontColor(Colors.Grey.Darken1);
                            metaCol.Item().AlignRight().Text($"Total Items: {items.Count:N0} (Qty: {totalQuantity:N0})").FontSize(8.5f).SemiBold();
                            metaCol.Item().AlignRight().Text($"Total Value: {grandTotalValue:C2}").FontSize(9).Bold().FontColor(Colors.Blue.Darken2);
                        });
                    });

                    headerCol.Item().PaddingTop(6).LineHorizontal(1.5f).LineColor(Colors.Blue.Darken2);
                });

                page.Content().PaddingTop(8).Column(content =>
                {
                    content.Spacing(10);

                    content.Item().Table(table =>
                    {
                        table.ColumnsDefinition(colDef =>
                        {
                            colDef.ConstantColumn(26);
                            foreach (var col in columns)
                            {
                                colDef.RelativeColumn(col.Key is "name" or "description" or "attributes" ? 2.2f : 1.2f);
                            }
                        });

                        table.Header(header =>
                        {
                            header.Cell().Element(PdfHeaderCell).AlignCenter().Text("#");
                            foreach (var col in columns)
                            {
                                var cell = header.Cell().Element(PdfHeaderCell);
                                if (col.IsCurrency || col.IsNumeric) cell.AlignRight().Text(col.Header);
                                else cell.Text(col.Header);
                            }
                        });

                        if (items.Count == 0)
                        {
                            table.Cell().ColumnSpan((uint)(columns.Count + 1)).Padding(16).AlignCenter()
                                .Text("No inventory records match the selected report filters.").FontColor(Colors.Grey.Darken1);
                        }
                        else
                        {
                            for (int idx = 0; idx < items.Count; idx++)
                            {
                                var item = items[idx];
                                var bgColor = idx % 2 == 0 ? Colors.White : Colors.Grey.Lighten4;

                                table.Cell().Element(c => PdfBodyCell(c, bgColor)).AlignCenter().Text((idx + 1).ToString());
                                foreach (var col in columns)
                                {
                                    var formatted = FormatCellForDisplay(item, col.Key);
                                    var cell = table.Cell().Element(c => PdfBodyCell(c, bgColor));
                                    if (col.IsCurrency || col.IsNumeric) cell.AlignRight().Text(formatted);
                                    else cell.Text(formatted);
                                }
                            }
                        }
                    });

                    content.Item().PaddingTop(14).ShowEntire().Row(sigRow =>
                    {
                        sigRow.RelativeItem().Column(c =>
                        {
                            c.Item().Text("Prepared By:").Bold().FontSize(8.5f);
                            c.Item().PaddingTop(22).Text(string.IsNullOrWhiteSpace(request.PreparedBy) ? "_________________________" : request.PreparedBy);
                            c.Item().Text("Signature & Date").FontSize(7.5f).FontColor(Colors.Grey.Darken1);
                        });
                        sigRow.RelativeItem().Column(c =>
                        {
                            c.Item().Text("Checked By:").Bold().FontSize(8.5f);
                            c.Item().PaddingTop(22).Text(string.IsNullOrWhiteSpace(request.CheckedBy) ? "_________________________" : request.CheckedBy);
                            c.Item().Text("Signature & Date").FontSize(7.5f).FontColor(Colors.Grey.Darken1);
                        });
                        sigRow.RelativeItem().Column(c =>
                        {
                            c.Item().Text("Approved By:").Bold().FontSize(8.5f);
                            c.Item().PaddingTop(22).Text(string.IsNullOrWhiteSpace(request.ApprovedBy) ? "_________________________" : request.ApprovedBy);
                            c.Item().Text("Authorized Signatory").FontSize(7.5f).FontColor(Colors.Grey.Darken1);
                        });
                    });
                });

                page.Footer().Row(footer =>
                {
                    footer.RelativeItem().Text("Computer generated inventory report").FontSize(7.5f).FontColor(Colors.Grey.Darken1);
                    footer.RelativeItem().AlignRight().Text(txt =>
                    {
                        txt.DefaultTextStyle(s => s.FontSize(7.5f).FontColor(Colors.Grey.Darken1));
                        txt.Span("Page ");
                        txt.CurrentPageNumber();
                        txt.Span(" of ");
                        txt.TotalPages();
                    });
                });
            });
        });

        await using var stream = new MemoryStream();
        document.GeneratePdf(stream);
        return stream.ToArray();
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Legacy Yearly Inventory List (13 Columns + Shaded Total {Year} Subtotals)
    // ──────────────────────────────────────────────────────────────────────────

    private static bool ShouldIncludeVehicleColumns(CustomInventoryReportRequestDto request, List<ProductDto> items) =>
        !string.IsNullOrWhiteSpace(request.VehicleType) ||
        (request.Columns != null && request.Columns.Any(c =>
            c.Equals("plateNumber", StringComparison.OrdinalIgnoreCase) ||
            c.Equals("engineNumber", StringComparison.OrdinalIgnoreCase))) ||
        items.Any(p => !string.IsNullOrWhiteSpace(p.PlateNumber) || !string.IsNullOrWhiteSpace(p.EngineNumber));

    private static byte[] BuildLegacyYearlyExcel(CustomInventoryReportRequestDto request, List<ProductDto> items)
    {
        using var package = new ExcelPackage();
        bool includeVehicleCols = ShouldIncludeVehicleColumns(request, items);
        var headers = includeVehicleCols
            ? [.. LegacyHeaders, "Plate #", "Engine/Serial #"]
            : LegacyHeaders;
        int colCount = headers.Length;
        var sheets = GroupProductsForLegacy(items, request.GroupBy);
        var usedNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        if (sheets.Count > 1)
        {
            BuildSummaryWorksheet(package, request, items, sheets);
            usedNames.Add("Summary");
        }

        foreach (var sheetGroup in sheets)
        {
            var sheetName = SanitizeWorksheetName(sheetGroup.Key, usedNames);
            var ws = package.Workbook.Worksheets.Add(sheetName);

            var titlePrefix = sheets.Count > 1 ? $"{sheetGroup.Key} " : "";
            var baseTitle = string.IsNullOrWhiteSpace(request.ReportTitle) ? "Inventory List" : request.ReportTitle;
            ws.Cells[1, 1].Value = sheets.Count > 1 && !baseTitle.Contains(sheetGroup.Key, StringComparison.OrdinalIgnoreCase)
                ? $"{titlePrefix}{baseTitle}"
                : baseTitle;
            ws.Cells[1, 1].Style.Font.Bold = true;
            ws.Cells[1, 1].Style.Font.Size = 13;

            ws.Cells[1, 9, 1, colCount].Merge = true;
            ws.Cells[1, 9].Value = $"{request.CompanyName} | {(sheets.Count > 1 ? sheetGroup.Key : request.DepartmentLabel)}";
            ws.Cells[1, 9].Style.HorizontalAlignment = ExcelHorizontalAlignment.Right;
            ws.Cells[1, 9].Style.Font.Size = 9;
            ws.Cells[1, 9].Style.Font.Color.SetColor(System.Drawing.Color.DimGray);

            int headerRow = 2;
            for (int c = 0; c < colCount; c++)
            {
                ws.Cells[headerRow, c + 1].Value = headers[c];
            }

            using (var hr = ws.Cells[headerRow, 1, headerRow, colCount])
            {
                hr.Style.Font.Bold = true;
                hr.Style.Fill.PatternType = ExcelFillStyle.Solid;
                hr.Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.FromArgb(230, 230, 230));
                hr.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
                hr.Style.VerticalAlignment = ExcelVerticalAlignment.Center;
            }

            var yearGroups = GroupItemsByYearChronological(sheetGroup.Value);
            int row = headerRow + 1;

            foreach (var yg in yearGroups)
            {
                int yearStartRow = row;
                foreach (var p in yg.Items)
                {
                    int qty = p.InitialQuantity ?? 1;
                    bool isZeroDonation = (p.Price ?? 0m) == 0m &&
                        string.Equals(p.PurchaseType, "Donated", StringComparison.OrdinalIgnoreCase);

                    ws.Cells[row, 1].Value = p.CodeNumber ?? "";
                    ws.Cells[row, 2].Value = p.Name;
                    ws.Cells[row, 3].Value = qty;
                    ws.Cells[row, 3].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
                    ws.Cells[row, 4].Value = p.Quality ?? "";
                    ws.Cells[row, 4].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
                    ws.Cells[row, 5].Value = p.Attributes ?? "";
                    ws.Cells[row, 6].Value = p.BrandName ?? "";

                    if (isZeroDonation)
                    {
                        ws.Cells[row, 7].Value = "Donation";
                        ws.Cells[row, 7].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
                    }
                    else
                    {
                        ws.Cells[row, 7].Value = p.Price ?? 0m;
                        ws.Cells[row, 7].Style.Numberformat.Format = "$ #,##0.00";
                    }

                    ws.Cells[row, 8].Value = FormatLegacyInvoiceDate(p);
                    ws.Cells[row, 8].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
                    ws.Cells[row, 9].Value = p.DepartmentName ?? "";
                    ws.Cells[row, 10].Value = p.ResponsiblePerson ?? "";
                    ws.Cells[row, 11].Value = FormatLegacySupplier(p);
                    ws.Cells[row, 12].Value = string.IsNullOrWhiteSpace(p.VoucherNumber) ? "N/A" : p.VoucherNumber;
                    ws.Cells[row, 12].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
                    ws.Cells[row, 13].Value = FormatLegacyDonor(p);
                    if (includeVehicleCols)
                    {
                        ws.Cells[row, 14].Value = p.PlateNumber ?? "";
                        ws.Cells[row, 15].Value = p.EngineNumber ?? "";
                    }
                    row++;
                }

                // Shaded Gray Subtotal Row: Total {Year}
                int yearEndRow = row - 1;
                ws.Cells[row, 2].Value = $"Total {yg.YearLabel}";
                ws.Cells[row, 3].Formula = $"SUM(C{yearStartRow}:C{yearEndRow})";
                ws.Cells[row, 3].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
                ws.Cells[row, 7].Formula = $"SUM(G{yearStartRow}:G{yearEndRow})";
                ws.Cells[row, 7].Style.Numberformat.Format = "$ #,##0.00";

                using (var subRange = ws.Cells[row, 1, row, colCount])
                {
                    subRange.Style.Font.Bold = true;
                    subRange.Style.Fill.PatternType = ExcelFillStyle.Solid;
                    subRange.Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.FromArgb(217, 217, 217));
                }
                row++;
            }

            // Grand Total Row
            if (sheetGroup.Value.Count > 0)
            {
                ws.Cells[row, 2].Value = "GRAND TOTAL";
                ws.Cells[row, 3].Value = sheetGroup.Value.Sum(x => x.InitialQuantity ?? 1);
                ws.Cells[row, 3].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
                ws.Cells[row, 7].Value = sheetGroup.Value.Sum(x => x.Price ?? 0m);
                ws.Cells[row, 7].Style.Numberformat.Format = "$ #,##0.00";

                using (var gtRange = ws.Cells[row, 1, row, colCount])
                {
                    gtRange.Style.Font.Bold = true;
                    gtRange.Style.Fill.PatternType = ExcelFillStyle.Solid;
                    gtRange.Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.FromArgb(191, 219, 254));
                }
            }

            int lastTableRow = Math.Max(headerRow, row);
            using (var tableRange = ws.Cells[headerRow, 1, lastTableRow, colCount])
            {
                tableRange.Style.Border.Top.Style = ExcelBorderStyle.Thin;
                tableRange.Style.Border.Bottom.Style = ExcelBorderStyle.Thin;
                tableRange.Style.Border.Left.Style = ExcelBorderStyle.Thin;
                tableRange.Style.Border.Right.Style = ExcelBorderStyle.Thin;
                tableRange.Style.VerticalAlignment = ExcelVerticalAlignment.Center;
                tableRange.Style.WrapText = true;
            }

            ws.PrinterSettings.Orientation = eOrientation.Landscape;
            ws.PrinterSettings.PaperSize = ePaperSize.A4;
            ws.PrinterSettings.FitToPage = true;
            ws.PrinterSettings.FitToWidth = 1;
            ws.PrinterSettings.FitToHeight = 0;
            ws.View.FreezePanes(headerRow + 1, 1);
            ws.Cells.AutoFitColumns(8, 34);
        }

        return package.GetAsByteArray();
    }

    private static async Task<byte[]> BuildLegacyYearlyPdfAsync(
        CustomInventoryReportRequestDto request,
        List<ProductDto> items,
        byte[]? logoBytes)
    {
        bool includeVehicleCols = ShouldIncludeVehicleColumns(request, items);
        var headers = includeVehicleCols
            ? [.. LegacyHeaders, "Plate #", "Engine/Serial #"]
            : LegacyHeaders;
        uint colSpan = (uint)headers.Length;
        var sectionGroups = GroupProductsForLegacy(items, request.GroupBy);
        bool hasMultipleSections = sectionGroups.Count > 1 ||
            request.GroupBy.Equals("Department", StringComparison.OrdinalIgnoreCase) ||
            request.GroupBy.Equals("Category", StringComparison.OrdinalIgnoreCase);
        var title = string.IsNullOrWhiteSpace(request.ReportTitle) ? "Inventory List" : request.ReportTitle;

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(14);
                page.DefaultTextStyle(s => s.FontSize(includeVehicleCols ? 6.8f : 7.2f).FontFamily("Arial"));

                page.Header().PaddingBottom(4).Row(row =>
                {
                    if (logoBytes is { Length: > 0 })
                    {
                        row.ConstantItem(28).Height(28).Image(logoBytes).FitArea();
                    }

                    row.AutoItem()
                        .PaddingLeft(logoBytes is { Length: > 0 } ? 6 : 0)
                        .Border(1)
                        .BorderColor(Colors.Grey.Darken2)
                        .Background(Colors.Grey.Lighten4)
                        .PaddingHorizontal(10)
                        .PaddingVertical(3)
                        .Text(title)
                        .FontSize(10)
                        .Bold();

                    row.RelativeItem().AlignRight().AlignMiddle()
                        .Text($"{request.CompanyName}  |  {request.DepartmentLabel}  |  Printed: {DateTime.Now:d-MMM-yy}")
                        .FontSize(7.5f)
                        .FontColor(Colors.Grey.Darken2);
                });

                page.Content().Column(content =>
                {
                    content.Item().Table(table =>
                    {
                        table.ColumnsDefinition(cols =>
                        {
                            cols.RelativeColumn(1.1f); // Code No
                            cols.RelativeColumn(1.4f); // Item Name
                            cols.ConstantColumn(24);   // Q.Ty
                            cols.ConstantColumn(28);   // % New
                            cols.RelativeColumn(1.2f); // Size/Color
                            cols.RelativeColumn(1.1f); // Brand
                            cols.ConstantColumn(52);   // Unit Price
                            cols.ConstantColumn(48);   // Invoice Date
                            cols.RelativeColumn(0.95f);// Location
                            cols.RelativeColumn(0.95f);// Responsible Person
                            cols.RelativeColumn(1.7f); // Suppliers
                            cols.ConstantColumn(46);   // Voucher #
                            cols.RelativeColumn(0.95f);// Donor
                            if (includeVehicleCols)
                            {
                                cols.RelativeColumn(0.9f); // Plate #
                                cols.RelativeColumn(1.1f); // Engine/Serial #
                            }
                        });

                        table.Header(header =>
                        {
                            foreach (var h in headers)
                            {
                                header.Cell().Element(LegacyHeaderCell).AlignCenter().AlignMiddle().Text(h);
                            }
                        });

                        if (items.Count == 0)
                        {
                            table.Cell().ColumnSpan(colSpan).Padding(16).AlignCenter()
                                .Text("No inventory items match your filters.").FontColor(Colors.Grey.Darken1);
                        }
                        else
                        {
                            foreach (var section in sectionGroups)
                            {
                                if (hasMultipleSections)
                                {
                                    table.Cell().ColumnSpan(colSpan)
                                        .Border(0.6f).BorderColor(Colors.Blue.Darken2)
                                        .Background(Colors.Blue.Lighten5)
                                        .PaddingHorizontal(5).PaddingVertical(3)
                                        .Text($"{request.GroupBy}: {section.Key} ({section.Value.Count} items)")
                                        .Bold().FontSize(8).FontColor(Colors.Blue.Darken3);
                                }

                                var yearGroups = GroupItemsByYearChronological(section.Value);
                                foreach (var yg in yearGroups)
                                {
                                    int groupQty = 0;
                                    decimal groupTotal = 0m;

                                    foreach (var p in yg.Items)
                                    {
                                        int qty = p.InitialQuantity ?? 1;
                                        decimal price = p.Price ?? 0m;
                                        bool isZeroDonation = price == 0m &&
                                            string.Equals(p.PurchaseType, "Donated", StringComparison.OrdinalIgnoreCase);

                                        groupQty += qty;
                                        groupTotal += price;

                                        table.Cell().Element(LegacyCell).Text(p.CodeNumber ?? "");
                                        table.Cell().Element(LegacyCell).Text(p.Name);
                                        table.Cell().Element(LegacyCell).AlignCenter().Text(qty.ToString());
                                        table.Cell().Element(LegacyCell).AlignCenter().Text(p.Quality ?? "");
                                        table.Cell().Element(LegacyCell).Text(p.Attributes ?? "");
                                        table.Cell().Element(LegacyCell).Text(p.BrandName ?? "");
                                        table.Cell().Element(LegacyCell).AlignRight().Text(isZeroDonation ? "Donation" : $"$ {price:#,##0.00}");
                                        table.Cell().Element(LegacyCell).AlignCenter().Text(FormatLegacyInvoiceDate(p));
                                        table.Cell().Element(LegacyCell).Text(p.DepartmentName ?? "");
                                        table.Cell().Element(LegacyCell).Text(p.ResponsiblePerson ?? "");
                                        table.Cell().Element(LegacyCell).Text(FormatLegacySupplier(p));
                                        table.Cell().Element(LegacyCell).AlignCenter().Text(string.IsNullOrWhiteSpace(p.VoucherNumber) ? "N/A" : p.VoucherNumber);
                                        table.Cell().Element(LegacyCell).Text(FormatLegacyDonor(p));
                                        if (includeVehicleCols)
                                        {
                                            table.Cell().Element(LegacyCell).Text(p.PlateNumber ?? "");
                                            table.Cell().Element(LegacyCell).Text(p.EngineNumber ?? "");
                                        }
                                    }

                                    // Shaded Gray Subtotal Row: Total {Year}
                                    table.Cell().Element(LegacySubtotalCell).Text("");
                                    table.Cell().Element(LegacySubtotalCell).Text($"Total {yg.YearLabel}").Bold();
                                    table.Cell().Element(LegacySubtotalCell).AlignCenter().Text(groupQty.ToString()).Bold();
                                    table.Cell().Element(LegacySubtotalCell).Text("");
                                    table.Cell().Element(LegacySubtotalCell).Text("");
                                    table.Cell().Element(LegacySubtotalCell).Text("");
                                    table.Cell().Element(LegacySubtotalCell).AlignRight().Text(groupTotal > 0m ? $"$ {groupTotal:#,##0.00}" : "").Bold();
                                    table.Cell().Element(LegacySubtotalCell).Text("");
                                    table.Cell().Element(LegacySubtotalCell).Text("");
                                    table.Cell().Element(LegacySubtotalCell).Text("");
                                    table.Cell().Element(LegacySubtotalCell).Text("");
                                    table.Cell().Element(LegacySubtotalCell).Text("");
                                    table.Cell().Element(LegacySubtotalCell).Text("");
                                    if (includeVehicleCols)
                                    {
                                        table.Cell().Element(LegacySubtotalCell).Text("");
                                        table.Cell().Element(LegacySubtotalCell).Text("");
                                    }
                                }

                                if (hasMultipleSections)
                                {
                                    var secQty = section.Value.Sum(x => x.InitialQuantity ?? 1);
                                    var secPrice = section.Value.Sum(x => x.Price ?? 0m);
                                    table.Cell().Element(LegacyDepartmentTotalCell).Text("");
                                    table.Cell().Element(LegacyDepartmentTotalCell).Text($"Total {section.Key}").Bold();
                                    table.Cell().Element(LegacyDepartmentTotalCell).AlignCenter().Text(secQty.ToString()).Bold();
                                    table.Cell().Element(LegacyDepartmentTotalCell).Text("");
                                    table.Cell().Element(LegacyDepartmentTotalCell).Text("");
                                    table.Cell().Element(LegacyDepartmentTotalCell).Text("");
                                    table.Cell().Element(LegacyDepartmentTotalCell).AlignRight().Text(secPrice > 0m ? $"$ {secPrice:#,##0.00}" : "").Bold();
                                    table.Cell().Element(LegacyDepartmentTotalCell).Text("");
                                    table.Cell().Element(LegacyDepartmentTotalCell).Text("");
                                    table.Cell().Element(LegacyDepartmentTotalCell).Text("");
                                    table.Cell().Element(LegacyDepartmentTotalCell).Text("");
                                    table.Cell().Element(LegacyDepartmentTotalCell).Text("");
                                    table.Cell().Element(LegacyDepartmentTotalCell).Text("");
                                    if (includeVehicleCols)
                                    {
                                        table.Cell().Element(LegacyDepartmentTotalCell).Text("");
                                        table.Cell().Element(LegacyDepartmentTotalCell).Text("");
                                    }
                                }
                            }

                            // Grand Total Row
                            var grandQty = items.Sum(x => x.InitialQuantity ?? 1);
                            var grandPrice = items.Sum(x => x.Price ?? 0m);
                            table.Cell().Element(LegacyGrandTotalCell).Text("");
                            table.Cell().Element(LegacyGrandTotalCell).Text("GRAND TOTAL").Bold();
                            table.Cell().Element(LegacyGrandTotalCell).AlignCenter().Text(grandQty.ToString()).Bold();
                            table.Cell().Element(LegacyGrandTotalCell).Text("");
                            table.Cell().Element(LegacyGrandTotalCell).Text("");
                            table.Cell().Element(LegacyGrandTotalCell).Text("");
                            table.Cell().Element(LegacyGrandTotalCell).AlignRight().Text($"$ {grandPrice:#,##0.00}").Bold();
                            table.Cell().Element(LegacyGrandTotalCell).Text("");
                            table.Cell().Element(LegacyGrandTotalCell).Text("");
                            table.Cell().Element(LegacyGrandTotalCell).Text("");
                            table.Cell().Element(LegacyGrandTotalCell).Text("");
                            table.Cell().Element(LegacyGrandTotalCell).Text("");
                            table.Cell().Element(LegacyGrandTotalCell).Text("");
                            if (includeVehicleCols)
                            {
                                table.Cell().Element(LegacyGrandTotalCell).Text("");
                                table.Cell().Element(LegacyGrandTotalCell).Text("");
                            }
                        }
                    });

                    if (!string.IsNullOrWhiteSpace(request.PreparedBy) ||
                        !string.IsNullOrWhiteSpace(request.CheckedBy) ||
                        !string.IsNullOrWhiteSpace(request.ApprovedBy))
                    {
                        content.Item().PaddingTop(10).ShowEntire().Row(sigRow =>
                        {
                            sigRow.RelativeItem().Text($"Prepared By: {request.PreparedBy}");
                            sigRow.RelativeItem().Text($"Checked By: {request.CheckedBy}");
                            sigRow.RelativeItem().Text($"Approved By: {request.ApprovedBy}");
                        });
                    }
                });

                page.Footer().AlignRight().Text(txt =>
                {
                    txt.DefaultTextStyle(s => s.FontSize(7).FontColor(Colors.Grey.Darken1));
                    txt.Span("Page ");
                    txt.CurrentPageNumber();
                    txt.Span(" of ");
                    txt.TotalPages();
                });
            });
        });

        await using var stream = new MemoryStream();
        document.GeneratePdf(stream);
        return stream.ToArray();
    }

    private sealed record YearGroup(string YearLabel, int SortOrder, List<ProductDto> Items);

    private static List<YearGroup> GroupItemsByYearChronological(List<ProductDto> items)
    {
        return items
            .GroupBy(ResolveYearOrder)
            .OrderBy(g => g.Key)
            .Select(g => new YearGroup(
                g.Key == 9999 ? "Unspecified" : g.Key.ToString(),
                g.Key,
                g.OrderBy(x => x.InvoiceDate ?? x.CreatedDate ?? "")
                    .ThenBy(x => x.CodeNumber ?? "", StringComparer.OrdinalIgnoreCase)
                    .ToList()))
            .ToList();
    }

    private static int ResolveYearOrder(ProductDto p)
    {
        if (!string.IsNullOrWhiteSpace(p.InvoiceDate) && DateTime.TryParse(p.InvoiceDate, out var idt))
        {
            return idt.Year;
        }
        if (!string.IsNullOrWhiteSpace(p.Year) && DateTime.TryParse(p.Year, out var ydt))
        {
            return ydt.Year;
        }
        if (!string.IsNullOrWhiteSpace(p.CodeNumber))
        {
            var m4 = Regex.Match(p.CodeNumber, @"^(19|20)\d{2}\b");
            if (m4.Success && int.TryParse(m4.Value, out int y4)) return y4;

            var m2 = Regex.Match(p.CodeNumber, @"^MT(\d{2})-", RegexOptions.IgnoreCase);
            if (m2.Success && int.TryParse(m2.Groups[1].Value, out int y2)) return 2000 + y2;
        }
        return 9999;
    }

    private static List<KeyValuePair<string, List<ProductDto>>> GroupProductsForLegacy(List<ProductDto> items, string groupBy)
    {
        if (string.IsNullOrWhiteSpace(groupBy) ||
            groupBy.Equals("None", StringComparison.OrdinalIgnoreCase) ||
            groupBy.Equals("Year", StringComparison.OrdinalIgnoreCase))
        {
            return [new KeyValuePair<string, List<ProductDto>>("Inventory List", items)];
        }
        return GroupProducts(items, groupBy);
    }

    private static string FormatLegacyInvoiceDate(ProductDto p)
    {
        if (!string.IsNullOrWhiteSpace(p.InvoiceDate) && DateTime.TryParse(p.InvoiceDate, out var dt))
        {
            return dt.ToString("d-MMM-yy", CultureInfo.InvariantCulture);
        }
        return "";
    }

    private static string FormatLegacySupplier(ProductDto p)
    {
        var sup = p.SupplierName ?? "";
        if (sup.Equals("Default Supplier (Excel Import)", StringComparison.OrdinalIgnoreCase) ||
            sup.Equals("Donated (No Supplier)", StringComparison.OrdinalIgnoreCase))
        {
            sup = "";
        }

        var phones = p.SupplierContactList?.Where(x => !string.IsNullOrWhiteSpace(x)).ToList() ?? [];
        if (phones.Count > 0 && !sup.Contains("Tel", StringComparison.OrdinalIgnoreCase))
        {
            var joined = string.Join(", ", phones);
            return string.IsNullOrWhiteSpace(sup) ? $"Tel: {joined}" : $"{sup} Tel: {joined}";
        }
        return sup;
    }

    private static string FormatLegacyDonor(ProductDto p)
    {
        var donor = p.DonorName ?? "";
        if (string.IsNullOrWhiteSpace(donor)) return "";
        // Clean legacy Notes format like "Donor: Oifman's | Sheet: I17"
        donor = Regex.Replace(donor, @"^Donor:\s*", "", RegexOptions.IgnoreCase);
        donor = Regex.Replace(donor, @"\s*\|\s*Sheet:.*$", "", RegexOptions.IgnoreCase).Trim();
        return donor.Equals("N/A", StringComparison.OrdinalIgnoreCase) ? "" : donor;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Standard Report Helpers
    // ──────────────────────────────────────────────────────────────────────────

    private async Task<List<ProductDto>> FetchFilteredProductsAsync(CustomInventoryReportRequestDto request, CancellationToken cancellationToken)
    {
        var query = new GetAllProductsQuery(
            Name: request.Name,
            CategoryId: request.CategoryId,
            DepartmentId: request.DepartmentId,
            QualityId: request.QualityId,
            PurchaseType: request.PurchaseType,
            IsAscending: true,
            PageNumber: 1,
            PageSize: 100000,
            SortBy: "name",
            ProductGroup: request.ProductGroup,
            InvoiceStartDate: request.InvoiceStartDate,
            InvoiceEndDate: request.InvoiceEndDate,
            MinPrice: request.MinPrice,
            MaxPrice: request.MaxPrice,
            VehicleType: request.VehicleType);

        var result = await _sender.Send(query, cancellationToken);
        return result.IsSuccess && result.Data?.Items != null
            ? result.Data.Items
            : new List<ProductDto>();
    }

    private static List<ColumnDefinition> ResolveColumns(List<string>? requestedKeys)
    {
        if (requestedKeys == null || requestedKeys.Count == 0)
        {
            return SupportedColumns.Values.Take(10).ToList();
        }

        var resolved = new List<ColumnDefinition>();
        foreach (var key in requestedKeys)
        {
            if (SupportedColumns.TryGetValue(key, out var def) && !resolved.Any(r => r.Key == def.Key))
            {
                resolved.Add(def);
            }
        }
        return resolved.Count > 0 ? resolved : SupportedColumns.Values.Take(10).ToList();
    }

    private static List<KeyValuePair<string, List<ProductDto>>> GroupProducts(List<ProductDto> items, string groupBy)
    {
        if (string.IsNullOrWhiteSpace(groupBy) || groupBy.Equals("None", StringComparison.OrdinalIgnoreCase))
        {
            return [new KeyValuePair<string, List<ProductDto>>("Inventory Items", items)];
        }

        Func<ProductDto, string> keySelector = groupBy.ToLowerInvariant() switch
        {
            "department" => p => string.IsNullOrWhiteSpace(p.DepartmentName) ? "Unassigned Dept" : p.DepartmentName,
            "year" => p => ParseYearLabel(p),
            _ => p => string.IsNullOrWhiteSpace(p.CategoryName) ? "Uncategorized" : p.CategoryName
        };

        return items
            .GroupBy(keySelector, StringComparer.OrdinalIgnoreCase)
            .OrderBy(g => g.Key, StringComparer.OrdinalIgnoreCase)
            .Select(g => new KeyValuePair<string, List<ProductDto>>(g.Key, g.ToList()))
            .ToList();
    }

    private static string ParseYearLabel(ProductDto p)
    {
        if (!string.IsNullOrWhiteSpace(p.Year) && DateTime.TryParse(p.Year, out var dt))
        {
            return dt.Year.ToString();
        }
        if (!string.IsNullOrWhiteSpace(p.InvoiceDate) && DateTime.TryParse(p.InvoiceDate, out var idt))
        {
            return idt.Year.ToString();
        }
        return "Unspecified Year";
    }

    private static void BuildSummaryWorksheet(
        ExcelPackage package,
        CustomInventoryReportRequestDto request,
        List<ProductDto> allItems,
        List<KeyValuePair<string, List<ProductDto>>> groups)
    {
        var ws = package.Workbook.Worksheets.Add("Summary");

        ws.Cells["A1:E1"].Merge = true;
        ws.Cells["A1"].Value = request.CompanyName;
        ws.Cells["A1"].Style.Font.Bold = true;
        ws.Cells["A1"].Style.Font.Size = 15;
        ws.Cells["A1"].Style.Font.Color.SetColor(System.Drawing.Color.FromArgb(30, 64, 175));

        ws.Cells["A2:E2"].Merge = true;
        ws.Cells["A2"].Value = $"{request.ReportTitle} - Executive Summary";
        ws.Cells["A2"].Style.Font.Bold = true;
        ws.Cells["A2"].Style.Font.Size = 12;

        ws.Cells["A3"].Value = $"Period: {request.Period}";
        ws.Cells["C3"].Value = $"Department: {request.DepartmentLabel}";
        ws.Cells["E3"].Value = $"Generated: {DateTime.Now:yyyy-MM-dd HH:mm}";

        int headerRow = 5;
        var headers = new[] { $"{request.GroupBy} Group", "Distinct Items", "Total Quantity", "Total Asset Value", "Share %" };
        for (int c = 0; c < headers.Length; c++)
        {
            ws.Cells[headerRow, c + 1].Value = headers[c];
        }

        using (var hr = ws.Cells[headerRow, 1, headerRow, headers.Length])
        {
            hr.Style.Font.Bold = true;
            hr.Style.Font.Color.SetColor(System.Drawing.Color.White);
            hr.Style.Fill.PatternType = ExcelFillStyle.Solid;
            hr.Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.FromArgb(37, 99, 235));
            hr.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
        }

        decimal grandTotal = allItems.Sum(i => (i.Price ?? 0m) * (i.InitialQuantity ?? 1));
        int row = headerRow + 1;
        foreach (var g in groups)
        {
            var groupQty = g.Value.Sum(i => i.InitialQuantity ?? 1);
            var groupVal = g.Value.Sum(i => (i.Price ?? 0m) * (i.InitialQuantity ?? 1));

            ws.Cells[row, 1].Value = g.Key;
            ws.Cells[row, 2].Value = g.Value.Count;
            ws.Cells[row, 3].Value = groupQty;
            ws.Cells[row, 4].Value = groupVal;
            ws.Cells[row, 4].Style.Numberformat.Format = "$#,##0.00";
            ws.Cells[row, 5].Value = grandTotal > 0 ? groupVal / grandTotal : 0m;
            ws.Cells[row, 5].Style.Numberformat.Format = "0.0%";
            row++;
        }

        ws.Cells[row, 1].Value = "GRAND TOTAL";
        ws.Cells[row, 1].Style.Font.Bold = true;
        ws.Cells[row, 2].Value = allItems.Count;
        ws.Cells[row, 2].Style.Font.Bold = true;
        ws.Cells[row, 3].Value = allItems.Sum(i => i.InitialQuantity ?? 1);
        ws.Cells[row, 3].Style.Font.Bold = true;
        ws.Cells[row, 4].Value = grandTotal;
        ws.Cells[row, 4].Style.Font.Bold = true;
        ws.Cells[row, 4].Style.Numberformat.Format = "$#,##0.00";
        ws.Cells[row, 5].Value = 1m;
        ws.Cells[row, 5].Style.Font.Bold = true;
        ws.Cells[row, 5].Style.Numberformat.Format = "0.0%";

        using (var tableRange = ws.Cells[headerRow, 1, row, headers.Length])
        {
            tableRange.Style.Border.Top.Style = ExcelBorderStyle.Thin;
            tableRange.Style.Border.Bottom.Style = ExcelBorderStyle.Thin;
            tableRange.Style.Border.Left.Style = ExcelBorderStyle.Thin;
            tableRange.Style.Border.Right.Style = ExcelBorderStyle.Thin;
        }

        int sigRow = row + 3;
        ws.Cells[sigRow, 1].Value = $"Prepared By: {request.PreparedBy}";
        ws.Cells[sigRow, 3].Value = $"Checked By: {request.CheckedBy}";
        ws.Cells[sigRow, 5].Value = $"Approved By: {request.ApprovedBy}";

        ws.Cells.AutoFitColumns();
    }

    private static void BuildDetailWorksheet(
        ExcelPackage package,
        string sheetName,
        CustomInventoryReportRequestDto request,
        List<ProductDto> items,
        List<ColumnDefinition> columns)
    {
        var ws = package.Workbook.Worksheets.Add(sheetName);
        int colCount = columns.Count + 1;

        ws.Cells[1, 1, 1, colCount].Merge = true;
        ws.Cells[1, 1].Value = $"{request.CompanyName} — {request.ReportTitle} ({sheetName})";
        ws.Cells[1, 1].Style.Font.Bold = true;
        ws.Cells[1, 1].Style.Font.Size = 13;

        ws.Cells[2, 1, 2, colCount].Merge = true;
        ws.Cells[2, 1].Value = $"Period: {request.Period} | Department: {request.DepartmentLabel} | Generated: {DateTime.Now:yyyy-MM-dd HH:mm}";
        ws.Cells[2, 1].Style.Font.Size = 9;
        ws.Cells[2, 1].Style.Font.Color.SetColor(System.Drawing.Color.DimGray);

        int headerRow = 4;
        ws.Cells[headerRow, 1].Value = "#";
        for (int c = 0; c < columns.Count; c++)
        {
            ws.Cells[headerRow, c + 2].Value = columns[c].Header;
        }

        using (var hr = ws.Cells[headerRow, 1, headerRow, colCount])
        {
            hr.Style.Font.Bold = true;
            hr.Style.Font.Color.SetColor(System.Drawing.Color.White);
            hr.Style.Fill.PatternType = ExcelFillStyle.Solid;
            hr.Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.FromArgb(37, 99, 235));
            hr.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
        }

        int row = headerRow + 1;
        for (int idx = 0; idx < items.Count; idx++)
        {
            var item = items[idx];
            ws.Cells[row, 1].Value = idx + 1;
            ws.Cells[row, 1].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;

            for (int c = 0; c < columns.Count; c++)
            {
                var col = columns[c];
                var cell = ws.Cells[row, c + 2];
                AssignExcelCellValue(cell, item, col);
            }
            row++;
        }

        ws.Cells[row, 1].Value = "TOTAL";
        ws.Cells[row, 1].Style.Font.Bold = true;
        for (int c = 0; c < columns.Count; c++)
        {
            var col = columns[c];
            var cell = ws.Cells[row, c + 2];
            if (col.Key == "initialQuantity")
            {
                cell.Value = items.Sum(i => i.InitialQuantity ?? 1);
                cell.Style.Font.Bold = true;
            }
            else if (col.Key == "price")
            {
                cell.Value = items.Sum(i => i.Price ?? 0m);
                cell.Style.Font.Bold = true;
                cell.Style.Numberformat.Format = "$#,##0.00";
            }
            else if (col.Key == "totalValue")
            {
                cell.Value = items.Sum(i => (i.Price ?? 0m) * (i.InitialQuantity ?? 1));
                cell.Style.Font.Bold = true;
                cell.Style.Numberformat.Format = "$#,##0.00";
            }
        }

        using (var tableRange = ws.Cells[headerRow, 1, row, colCount])
        {
            tableRange.Style.Border.Top.Style = ExcelBorderStyle.Thin;
            tableRange.Style.Border.Bottom.Style = ExcelBorderStyle.Thin;
            tableRange.Style.Border.Left.Style = ExcelBorderStyle.Thin;
            tableRange.Style.Border.Right.Style = ExcelBorderStyle.Thin;
        }

        ws.View.FreezePanes(headerRow + 1, 1);
        ws.Cells[headerRow, 1, Math.Max(headerRow, row - 1), colCount].AutoFilter = true;
        ws.Cells.AutoFitColumns(10, 45);
    }

    private static void AssignExcelCellValue(ExcelRange cell, ProductDto item, ColumnDefinition col)
    {
        switch (col.Key)
        {
            case "initialQuantity":
                cell.Value = item.InitialQuantity ?? 1;
                break;
            case "price":
                cell.Value = item.Price ?? 0m;
                cell.Style.Numberformat.Format = "$#,##0.00";
                break;
            case "totalValue":
                cell.Value = (item.Price ?? 0m) * (item.InitialQuantity ?? 1);
                cell.Style.Numberformat.Format = "$#,##0.00";
                break;
            default:
                cell.Value = FormatCellForDisplay(item, col.Key);
                break;
        }
    }

    private static string FormatCellForDisplay(ProductDto p, string key) => key switch
    {
        "codeNumber" => p.CodeNumber ?? "-",
        "name" => p.Name,
        "categoryName" => p.CategoryName ?? "-",
        "brandName" => p.BrandName ?? "-",
        "departmentName" => p.DepartmentName ?? "-",
        "quality" => p.Quality ?? "-",
        "initialQuantity" => (p.InitialQuantity ?? 1).ToString(),
        "price" => p.Price.HasValue ? p.Price.Value.ToString("C2") : "-",
        "totalValue" => ((p.Price ?? 0m) * (p.InitialQuantity ?? 1)).ToString("C2"),
        "responsiblePerson" => p.ResponsiblePerson ?? "-",
        "supplierName" => FormatLegacySupplier(p),
        "donorName" => FormatLegacyDonor(p),
        "purchaseType" => p.PurchaseType ?? "-",
        "voucherNumber" => p.VoucherNumber ?? "-",
        "invoiceDate" => DateTime.TryParse(p.InvoiceDate, out var dt) ? dt.ToString("yyyy-MM-dd") : "-",
        "year" => ParseYearLabel(p),
        "plateNumber" => p.PlateNumber ?? "-",
        "engineNumber" => p.EngineNumber ?? "-",
        "attributes" => p.Attributes ?? "-",
        "description" => p.Description ?? "-",
        _ => "-"
    };

    private async Task<byte[]?> ResolveLogoBytesAsync(string? requestLogoBase64, CancellationToken cancellationToken)
    {
        var base64 = requestLogoBase64;
        if (string.IsNullOrWhiteSpace(base64))
        {
            var settings = await _context.SystemSettings.AsNoTracking().FirstOrDefaultAsync(cancellationToken);
            base64 = settings?.LogoBase64;
        }

        if (!string.IsNullOrWhiteSpace(base64))
        {
            try
            {
                var commaIndex = base64.IndexOf(',');
                var cleanBase64 = commaIndex >= 0 ? base64[(commaIndex + 1)..] : base64;
                return Convert.FromBase64String(cleanBase64);
            }
            catch { }
        }

        var logoPath = "wwwroot/images/organization-logo.png";
        if (File.Exists(logoPath))
        {
            return await File.ReadAllBytesAsync(logoPath, cancellationToken);
        }

        return null;
    }

    private static string SanitizeWorksheetName(string rawName, HashSet<string> usedNames)
    {
        var cleaned = Regex.Replace(rawName ?? "Sheet", @"[\\/\?\*\[\]:]", " ").Trim();
        if (string.IsNullOrWhiteSpace(cleaned)) cleaned = "Sheet";
        if (cleaned.Length > 28) cleaned = cleaned[..28].Trim();

        var candidate = cleaned;
        int suffix = 2;
        while (usedNames.Contains(candidate))
        {
            candidate = $"{cleaned}_{suffix++}";
            if (candidate.Length > 31) candidate = candidate[..31];
        }
        usedNames.Add(candidate);
        return candidate;
    }

    private static IContainer PdfHeaderCell(IContainer container) =>
        container.Border(0.5f).BorderColor(Colors.Blue.Darken3).Background(Colors.Blue.Darken2).Padding(4)
            .DefaultTextStyle(s => s.FontColor(Colors.White).Bold().FontSize(8));

    private static IContainer PdfBodyCell(IContainer container, string bgColor) =>
        container.Border(0.5f).BorderColor(Colors.Grey.Lighten2).Background(bgColor).Padding(4);

    private static IContainer LegacyHeaderCell(IContainer container) =>
        container.Border(0.6f).BorderColor(Colors.Grey.Darken1).Background(Colors.Grey.Lighten3).Padding(3)
            .DefaultTextStyle(s => s.Bold().FontSize(7.2f).FontColor(Colors.Black));

    private static IContainer LegacyCell(IContainer container) =>
        container.Border(0.5f).BorderColor(Colors.Grey.Medium).PaddingHorizontal(3).PaddingVertical(2.5f);

    private static IContainer LegacySubtotalCell(IContainer container) =>
        container.Border(0.6f).BorderColor(Colors.Grey.Darken1).Background(Colors.Grey.Lighten2).PaddingHorizontal(3).PaddingVertical(3);

    private static IContainer LegacyDepartmentTotalCell(IContainer container) =>
        container.Border(0.6f).BorderColor(Colors.Blue.Darken1).Background(Colors.Blue.Lighten5).PaddingHorizontal(3).PaddingVertical(3);

    private static IContainer LegacyGrandTotalCell(IContainer container) =>
        container.Border(0.7f).BorderColor(Colors.Blue.Darken2).Background(Colors.Blue.Lighten4).PaddingHorizontal(3).PaddingVertical(3.5f);
}
