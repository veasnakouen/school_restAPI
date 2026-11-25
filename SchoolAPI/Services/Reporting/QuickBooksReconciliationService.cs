using System.Drawing;
using System.Globalization;
using OfficeOpenXml;
using OfficeOpenXml.Style;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Contracts.Reports;
using SchoolAPI.Data;
using SchoolAPI.Helpers;

namespace SchoolAPI.Services.Reporting;

public sealed class QuickBooksReconciliationService : IQuickBooksReconciliationService
{
    private readonly SchoolDbContext _context;

    private static readonly (string[] Keywords, string AccountLabel)[] AccountRules =
    [
        (["intangible", "software", "website", "domain", "license", "subscription"], "2405 · Intangible Assets"),
        (["it", "computer", "laptop", "desktop", "monitor", "printer", "scanner", "projector", "server", "network", "router", "camera", "switch"], "2401 · IT/Computers"),
        (["electric", "air-cond", "aircon", "ac ", "fan", "solar", "generator", "heater", "appliance"], "2402 · Electric Equipment"),
        (["vehicle", "motor", "car", "van", "truck", "transport", "moto"], "2403 · Vehicles"),
        (["furniture", "desk", "chair", "cabinet", "table", "shelf", "rack"], "2404 · Furniture & Fixtures"),
    ];

    public QuickBooksReconciliationService(SchoolDbContext context)
    {
        _context = context;
    }

    public async Task<QuickBooksReconciliationResponseDto> BuildReconciliationDataAsync(
        QuickBooksReconciliationRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var (startUtc, endUtc) = ResolveDateRange(request.StartDate, request.EndDate);
        var periodLabel = string.IsNullOrWhiteSpace(request.PeriodLabel)
            ? FormatDefaultPeriodLabel(startUtc, endUtc)
            : request.PeriodLabel.Trim();

        var query = _context.Products
            .AsNoTracking()
            .Where(p => p.IsActive);

        if (!string.IsNullOrWhiteSpace(request.DepartmentId))
        {
            var deptIds = request.DepartmentId.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList();
            query = query.Where(p => p.DepartmentId != null && deptIds.Contains(p.DepartmentId));
        }

        if (!string.IsNullOrWhiteSpace(request.PurchaseType))
        {
            query = query.Where(p => p.PurchaseItems.Any(pi =>
                pi.Purchase != null && pi.Purchase.AcquisitionType == request.PurchaseType));
        }

        query = VehicleFilterHelper.ApplyProductVehicleFilter(query, request.VehicleType);

        var rawProducts = await (
            from p in query
            let latestPI = p.PurchaseItems.OrderByDescending(pi => pi.CreatedDate).FirstOrDefault()
            select new
            {
                p.Id,
                p.ProductName,
                p.CodeNumber,
                p.PlateNumber,
                p.EngineNumber,
                p.Price,
                p.Attributes,
                p.Description,
                p.CreatedDate,
                p.Year,
                CategoryName = p.Category != null ? p.Category.Name : null,
                DepartmentName = p.Department != null ? p.Department.Name : null,
                InitialQty = latestPI != null ? (int?)latestPI.Quantity : null,
                UnitPrice = latestPI != null ? (decimal?)latestPI.UnitPrice : null,
                InvoiceDate = latestPI != null && latestPI.Purchase != null ? (DateTime?)latestPI.Purchase.InvoiceDate : null,
                VoucherNumber = latestPI != null && latestPI.Purchase != null ? latestPI.Purchase.VoucherNumber : null,
                AcquisitionType = latestPI != null && latestPI.Purchase != null ? latestPI.Purchase.AcquisitionType : null,
                PurchaseNotes = latestPI != null && latestPI.Purchase != null ? latestPI.Purchase.Notes : null,
                SupplierName = latestPI != null && latestPI.Purchase != null && latestPI.Purchase.Supplier != null
                    ? latestPI.Purchase.Supplier.Name
                    : null,
                ResponsiblePerson = latestPI != null && latestPI.ResponsiblePerson != null
                    ? latestPI.ResponsiblePerson.FullName
                    : null,
            })
            .ToListAsync(cancellationToken);

        var accountMappings = request.AccountMappings != null
            ? new Dictionary<string, string>(request.AccountMappings, StringComparer.OrdinalIgnoreCase)
            : new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        var rows = new List<ReconciliationRowDto>();

        foreach (var item in rawProducts)
        {
            var effectiveDate = (item.InvoiceDate ?? item.CreatedDate ?? item.Year ?? DateTime.UtcNow).ToUniversalTime();
            if (effectiveDate < startUtc || effectiveDate > endUtc)
            {
                continue;
            }

            int qty = item.InitialQty is > 0 ? item.InitialQty.Value : 1;
            decimal unitPrice = item.Price ?? item.UnitPrice ?? 0m;
            decimal amount = Math.Round(unitPrice * qty, 2, MidpointRounding.AwayFromZero);

            var categoryName = string.IsNullOrWhiteSpace(item.CategoryName) ? "Inventory" : item.CategoryName.Trim();
            var departmentName = string.IsNullOrWhiteSpace(item.DepartmentName) ? "Unassigned" : item.DepartmentName.Trim();
            var accountGroup = ResolveAccountGroup(categoryName, item.ProductName, accountMappings);

            var reference = !string.IsNullOrWhiteSpace(item.VoucherNumber)
                ? item.VoucherNumber.Trim()
                : (item.CodeNumber ?? "-");

            var description = BuildDescription(item.ProductName, qty, item.Attributes, item.ResponsiblePerson);
            var className = ResolveClassLabel(item.PurchaseNotes, item.SupplierName, item.AcquisitionType);

            rows.Add(new ReconciliationRowDto
            {
                ProductId = item.Id,
                Date = effectiveDate.ToString("MM/dd/yyyy", CultureInfo.InvariantCulture),
                Reference = reference,
                Department = departmentName,
                Description = description,
                PlateNumber = item.PlateNumber,
                EngineNumber = item.EngineNumber,
                ClassName = className,
                CategoryName = categoryName,
                AccountGroup = accountGroup,
                MonthKey = effectiveDate.ToString("yyyy-MM", CultureInfo.InvariantCulture),
                MonthLabel = effectiveDate.ToString("MMM yyyy", CultureInfo.InvariantCulture),
                Quantity = qty,
                UnitPrice = unitPrice,
                Amount = amount
            });
        }

        rows = rows
            .OrderBy(r => r.AccountGroup, StringComparer.OrdinalIgnoreCase)
            .ThenBy(r => r.Date, StringComparer.Ordinal)
            .ThenBy(r => r.Reference, StringComparer.OrdinalIgnoreCase)
            .ToList();

        var accountGroups = rows
            .GroupBy(r => r.AccountGroup, StringComparer.OrdinalIgnoreCase)
            .OrderBy(g => g.Key, StringComparer.OrdinalIgnoreCase)
            .Select(g => new ReconciliationAccountGroupDto
            {
                AccountGroup = g.Key,
                Rows = g.ToList(),
                Subtotal = g.Sum(r => r.Amount)
            })
            .ToList();

        var recordedSummary = rows
            .GroupBy(r => r.CategoryName, StringComparer.OrdinalIgnoreCase)
            .OrderBy(g => g.Key, StringComparer.OrdinalIgnoreCase)
            .Select(g => new ReconciliationSummaryItemDto
            {
                CategoryLabel = g.Key,
                ItemCount = g.Count(),
                TotalQuantity = g.Sum(r => r.Quantity),
                Amount = g.Sum(r => r.Amount)
            })
            .ToList();

        var months = BuildMonthSequence(startUtc, endUtc, rows);
        var monthTotals = months.ToDictionary(m => m, _ => 0m, StringComparer.OrdinalIgnoreCase);

        var deptMonthlyRows = rows
            .GroupBy(r => r.Department, StringComparer.OrdinalIgnoreCase)
            .OrderBy(g => g.Key, StringComparer.OrdinalIgnoreCase)
            .Select(g =>
            {
                var perMonth = months.ToDictionary(m => m, _ => 0m, StringComparer.OrdinalIgnoreCase);
                foreach (var r in g)
                {
                    if (perMonth.ContainsKey(r.MonthLabel))
                    {
                        perMonth[r.MonthLabel] += r.Amount;
                    }
                    if (monthTotals.ContainsKey(r.MonthLabel))
                    {
                        monthTotals[r.MonthLabel] += r.Amount;
                    }
                }

                return new DepartmentMonthlyAmountRowDto
                {
                    Department = g.Key,
                    MonthlyAmounts = perMonth,
                    TotalItems = g.Count(),
                    TotalQuantity = g.Sum(r => r.Quantity),
                    TotalAmount = g.Sum(r => r.Amount)
                };
            })
            .ToList();

        decimal grandTotal = rows.Sum(r => r.Amount);
        decimal? variance = request.QuickBooksReferenceTotal.HasValue
            ? request.QuickBooksReferenceTotal.Value - grandTotal
            : null;
        bool includeVehicleColumns = !string.IsNullOrWhiteSpace(request.VehicleType) ||
            rows.Any(r => !string.IsNullOrWhiteSpace(r.PlateNumber) || !string.IsNullOrWhiteSpace(r.EngineNumber));

        return new QuickBooksReconciliationResponseDto
        {
            PeriodLabel = periodLabel,
            StartDate = startUtc,
            EndDate = endUtc,
            PreparedBy = request.PreparedBy?.Trim() ?? string.Empty,
            PreparedRole = string.IsNullOrWhiteSpace(request.PreparedRole) ? "Management Assistant" : request.PreparedRole.Trim(),
            ReviewedBy = request.ReviewedBy?.Trim() ?? string.Empty,
            ReviewedRole = string.IsNullOrWhiteSpace(request.ReviewedRole) ? "Co-Director" : request.ReviewedRole.Trim(),
            IncludeVehicleColumns = includeVehicleColumns,
            AccountGroups = accountGroups,
            RecordedSummary = recordedSummary,
            Months = months,
            DepartmentMonthlySubReport = deptMonthlyRows,
            MonthColumnTotals = monthTotals,
            GrandTotal = grandTotal,
            QuickBooksReferenceTotal = request.QuickBooksReferenceTotal,
            VarianceAmount = variance,
            TotalItems = rows.Count,
            TotalQuantity = rows.Sum(r => r.Quantity)
        };
    }

    public async Task<byte[]> GenerateReconciliationPdfAsync(
        QuickBooksReconciliationRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var data = await BuildReconciliationDataAsync(request, cancellationToken);

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Portrait());
                page.Margin(24);
                page.DefaultTextStyle(s => s.FontSize(8.5f).FontFamily("Arial"));

                page.Header().Column(header =>
                {
                    header.Item().Text("Inventory/Fixed asset RECONCILIATION to Quick Book")
                        .FontSize(11.5f).Bold().FontColor(Colors.Black);
                    header.Item().PaddingTop(2).Text($"For the Month of : {data.PeriodLabel}")
                        .FontSize(9.5f).SemiBold().FontColor(Colors.Grey.Darken3);
                    header.Item().PaddingTop(4).LineHorizontal(1.2f).LineColor(Colors.Black);
                });

                page.Content().PaddingTop(8).Column(content =>
                {
                    content.Spacing(10);

                    content.Item().Text("Quick Book Report").FontSize(10).Bold();

                    content.Item().Table(table =>
                    {
                        bool showVehicle = data.IncludeVehicleColumns;
                        uint colCount = showVehicle ? 8u : 6u;
                        uint labelSpan = colCount - 1;

                        table.ColumnsDefinition(cols =>
                        {
                            cols.ConstantColumn(showVehicle ? 52 : 58);  // Date
                            cols.ConstantColumn(showVehicle ? 58 : 68);  // Reference
                            cols.RelativeColumn(showVehicle ? 1.05f : 1.25f); // Department
                            cols.RelativeColumn(showVehicle ? 1.75f : 2.15f); // Description
                            if (showVehicle)
                            {
                                cols.RelativeColumn(0.85f); // Plate #
                                cols.RelativeColumn(1.0f);  // Engine/Serial #
                            }
                            cols.RelativeColumn(showVehicle ? 0.9f : 1.15f); // Class
                            cols.ConstantColumn(showVehicle ? 56 : 62);  // Amount
                        });

                        table.Header(header =>
                        {
                            string[] headers = showVehicle
                                ? ["Date", "Reference", "Department", "Description", "Plate #", "Engine/Serial #", "Class", "Amount"]
                                : ["Date", "Reference", "Department", "Description", "Class", "Amount"];
                            foreach (var h in headers)
                            {
                                var cell = header.Cell().BorderBottom(1f).BorderColor(Colors.Black).PaddingVertical(4).PaddingHorizontal(3);
                                if (h == "Amount") cell.AlignRight().Text(h).Bold().FontSize(8);
                                else cell.Text(h).Bold().FontSize(8);
                            }
                        });

                        if (data.AccountGroups.Count == 0)
                        {
                            table.Cell().ColumnSpan(colCount).Padding(18).AlignCenter()
                                .Text("No new products/assets recorded in this date range.")
                                .FontColor(Colors.Grey.Darken1);
                        }
                        else
                        {
                            foreach (var grp in data.AccountGroups)
                            {
                                table.Cell().ColumnSpan(colCount).Background(Colors.Grey.Lighten4)
                                    .PaddingVertical(3.5f).PaddingHorizontal(3)
                                    .Text(grp.AccountGroup).Bold().FontSize(8.5f);

                                foreach (var row in grp.Rows)
                                {
                                    table.Cell().PaddingVertical(2.5f).PaddingHorizontal(3).Text(row.Date).FontSize(7.8f);
                                    table.Cell().PaddingVertical(2.5f).PaddingHorizontal(3).Text(row.Reference).FontSize(7.8f);
                                    table.Cell().PaddingVertical(2.5f).PaddingHorizontal(3).Text(row.Department).FontSize(7.8f);
                                    table.Cell().PaddingVertical(2.5f).PaddingHorizontal(3).Text(row.Description).FontSize(7.8f);
                                    if (showVehicle)
                                    {
                                        table.Cell().PaddingVertical(2.5f).PaddingHorizontal(3).Text(row.PlateNumber ?? "-").FontSize(7.5f);
                                        table.Cell().PaddingVertical(2.5f).PaddingHorizontal(3).Text(row.EngineNumber ?? "-").FontSize(7.5f);
                                    }
                                    table.Cell().PaddingVertical(2.5f).PaddingHorizontal(3).Text(row.ClassName).FontSize(7.8f);
                                    table.Cell().PaddingVertical(2.5f).PaddingHorizontal(3).AlignRight()
                                        .Text(row.Amount.ToString("N2", CultureInfo.InvariantCulture)).FontSize(7.8f);
                                }

                                // Group Subtotal Row
                                table.Cell().ColumnSpan(labelSpan).PaddingVertical(3).PaddingHorizontal(3).AlignRight()
                                    .Text($"Subtotal ({grp.AccountGroup})").Italic().FontSize(7.8f).FontColor(Colors.Grey.Darken2);
                                table.Cell().BorderTop(0.75f).BorderBottom(0.75f).BorderColor(Colors.Black)
                                    .PaddingVertical(3).PaddingHorizontal(3).AlignRight()
                                    .Text(grp.Subtotal.ToString("N2", CultureInfo.InvariantCulture)).Bold().FontSize(8);
                            }

                            // Grand Total Row
                            table.Cell().ColumnSpan(labelSpan).BorderTop(1f).BorderBottom(1.5f).BorderColor(Colors.Black)
                                .PaddingVertical(4).PaddingHorizontal(3)
                                .Text($"Total Ending amount to Quick Book {data.PeriodLabel}").Bold().FontSize(8.5f);
                            table.Cell().BorderTop(1f).BorderBottom(1.5f).BorderColor(Colors.Black)
                                .PaddingVertical(4).PaddingHorizontal(3).AlignRight()
                                .Text($"$ {data.GrandTotal:N2}").Bold().FontSize(8.5f);
                        }
                    });

                    // Sub-Report 1: Ending amount according to inventory/Fixed asset recorded
                    content.Item().PaddingTop(6).ShowEntire().Column(sub =>
                    {
                        sub.Item().AlignCenter().Text($"Ending amount according to inventory/Fixed asset recorded {data.PeriodLabel}")
                            .Bold().FontSize(9);

                        sub.Item().PaddingTop(4).AlignCenter().Width(310).Table(st =>
                        {
                            st.ColumnsDefinition(c =>
                            {
                                c.RelativeColumn(2f);
                                c.ConstantColumn(22);
                                c.ConstantColumn(80);
                            });

                            foreach (var sumItem in data.RecordedSummary)
                            {
                                st.Cell().Border(0.6f).BorderColor(Colors.Black).Padding(4)
                                    .Text($"* {sumItem.CategoryLabel}").FontSize(8.2f);
                                st.Cell().BorderTop(0.6f).BorderBottom(0.6f).BorderColor(Colors.Black).Padding(4).AlignCenter()
                                    .Text("$").FontSize(8.2f);
                                st.Cell().BorderTop(0.6f).BorderBottom(0.6f).BorderRight(0.6f).BorderColor(Colors.Black).Padding(4).AlignRight()
                                    .Text(sumItem.Amount.ToString("N2", CultureInfo.InvariantCulture)).FontSize(8.2f);
                            }

                            st.Cell().Border(0.8f).BorderColor(Colors.Black).Background(Colors.Grey.Lighten4).Padding(4)
                                .Text("Total").Bold().FontSize(8.5f);
                            st.Cell().BorderTop(0.8f).BorderBottom(0.8f).BorderColor(Colors.Black).Background(Colors.Grey.Lighten4).Padding(4).AlignCenter()
                                .Text("$").Bold().FontSize(8.5f);
                            st.Cell().BorderTop(0.8f).BorderBottom(0.8f).BorderRight(0.8f).BorderColor(Colors.Black).Background(Colors.Grey.Lighten4).Padding(4).AlignRight()
                                .Text(data.GrandTotal.ToString("N2", CultureInfo.InvariantCulture)).Bold().FontSize(8.5f);
                        });
                    });

                    // Sub-Report 2: Monthly New Products Amount by Department
                    if (request.IncludeMonthlyDepartmentSubReport && data.DepartmentMonthlySubReport.Count > 0)
                    {
                        content.Item().PaddingTop(8).ShowEntire().Column(deptSub =>
                        {
                            deptSub.Item().Text($"Sub-Report: New Product Amount by Month & Department ({data.PeriodLabel})")
                                .Bold().FontSize(9);

                            deptSub.Item().PaddingTop(4).Table(dt =>
                            {
                                dt.ColumnsDefinition(c =>
                                {
                                    c.RelativeColumn(1.8f);
                                    foreach (var _ in data.Months)
                                    {
                                        c.RelativeColumn(1f);
                                    }
                                    c.ConstantColumn(36);
                                    c.ConstantColumn(68);
                                });

                                dt.Header(h =>
                                {
                                    h.Cell().Border(0.6f).BorderColor(Colors.Grey.Darken1).Background(Colors.Grey.Lighten3).Padding(3.5f)
                                        .Text("Department").Bold().FontSize(7.8f);
                                    foreach (var m in data.Months)
                                    {
                                        h.Cell().Border(0.6f).BorderColor(Colors.Grey.Darken1).Background(Colors.Grey.Lighten3).Padding(3.5f)
                                            .AlignRight().Text(m).Bold().FontSize(7.8f);
                                    }
                                    h.Cell().Border(0.6f).BorderColor(Colors.Grey.Darken1).Background(Colors.Grey.Lighten3).Padding(3.5f)
                                        .AlignRight().Text("Qty").Bold().FontSize(7.8f);
                                    h.Cell().Border(0.6f).BorderColor(Colors.Grey.Darken1).Background(Colors.Grey.Lighten3).Padding(3.5f)
                                        .AlignRight().Text("Total ($)").Bold().FontSize(7.8f);
                                });

                                foreach (var dRow in data.DepartmentMonthlySubReport)
                                {
                                    dt.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).Padding(3.5f).Text(dRow.Department).FontSize(7.8f);
                                    foreach (var m in data.Months)
                                    {
                                        decimal mVal = dRow.MonthlyAmounts.TryGetValue(m, out var val) ? val : 0m;
                                        dt.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).Padding(3.5f).AlignRight()
                                            .Text(mVal > 0 ? mVal.ToString("N2", CultureInfo.InvariantCulture) : "-").FontSize(7.8f);
                                    }
                                    dt.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).Padding(3.5f).AlignRight()
                                        .Text(dRow.TotalQuantity.ToString()).FontSize(7.8f);
                                    dt.Cell().Border(0.5f).BorderColor(Colors.Grey.Medium).Padding(3.5f).AlignRight()
                                        .Text(dRow.TotalAmount.ToString("N2", CultureInfo.InvariantCulture)).Bold().FontSize(7.8f);
                                }

                                // Column Totals
                                dt.Cell().Border(0.7f).BorderColor(Colors.Black).Background(Colors.Grey.Lighten4).Padding(3.5f)
                                    .Text("Monthly Total").Bold().FontSize(8);
                                foreach (var m in data.Months)
                                {
                                    decimal colVal = data.MonthColumnTotals.TryGetValue(m, out var val) ? val : 0m;
                                    dt.Cell().Border(0.7f).BorderColor(Colors.Black).Background(Colors.Grey.Lighten4).Padding(3.5f).AlignRight()
                                        .Text(colVal.ToString("N2", CultureInfo.InvariantCulture)).Bold().FontSize(8);
                                }
                                dt.Cell().Border(0.7f).BorderColor(Colors.Black).Background(Colors.Grey.Lighten4).Padding(3.5f).AlignRight()
                                    .Text(data.TotalQuantity.ToString()).Bold().FontSize(8);
                                dt.Cell().Border(0.7f).BorderColor(Colors.Black).Background(Colors.Grey.Lighten4).Padding(3.5f).AlignRight()
                                    .Text($"$ {data.GrandTotal:N2}").Bold().FontSize(8);
                            });
                        });
                    }

                    // Signatures matching photo #1
                    content.Item().PaddingTop(18).ShowEntire().Row(sigRow =>
                    {
                        sigRow.RelativeItem().Column(c =>
                        {
                            c.Item().Text("Prepared by:").Bold().FontSize(8.5f);
                            c.Item().PaddingTop(26).Text(string.IsNullOrWhiteSpace(data.PreparedBy) ? data.PreparedRole : $"{data.PreparedBy} ({data.PreparedRole})")
                                .Bold().FontSize(8.5f);
                        });
                        sigRow.RelativeItem().AlignRight().Column(c =>
                        {
                            c.Item().AlignRight().Text("Reviewed by:").Bold().FontSize(8.5f);
                            c.Item().PaddingTop(26).AlignRight().Text(string.IsNullOrWhiteSpace(data.ReviewedBy) ? data.ReviewedRole : $"{data.ReviewedBy} ({data.ReviewedRole})")
                                .Bold().FontSize(8.5f);
                        });
                    });
                });

                page.Footer().Row(footer =>
                {
                    footer.RelativeItem().Text($"Generated {DateTime.Now:dd-MMM-yyyy HH:mm}").FontSize(7.5f).FontColor(Colors.Grey.Darken1);
                    footer.RelativeItem().AlignRight().Text(t =>
                    {
                        t.DefaultTextStyle(s => s.FontSize(7.5f).FontColor(Colors.Grey.Darken1));
                        t.Span("Page ");
                        t.CurrentPageNumber();
                        t.Span(" of ");
                        t.TotalPages();
                    });
                });
            });
        });

        await using var stream = new MemoryStream();
        document.GeneratePdf(stream);
        return stream.ToArray();
    }

    public async Task<byte[]> GenerateReconciliationExcelAsync(
        QuickBooksReconciliationRequestDto request,
        CancellationToken cancellationToken = default)
    {
        ExcelPackage.License.SetNonCommercialPersonal("SchoolAPI");
        var data = await BuildReconciliationDataAsync(request, cancellationToken);

        using var package = new ExcelPackage();

        // Sheet 1: QuickBooks Reconciliation
        var ws = package.Workbook.Worksheets.Add("QuickBook Reconciliation");
        ws.Cells[1, 1].Value = "Inventory/Fixed asset RECONCILIATION to Quick Book";
        ws.Cells[1, 1].Style.Font.Bold = true;
        ws.Cells[1, 1].Style.Font.Size = 13;

        ws.Cells[2, 1].Value = $"For the Month of : {data.PeriodLabel}";
        ws.Cells[2, 1].Style.Font.Bold = true;
        ws.Cells[2, 1].Style.Font.Size = 10;

        ws.Cells[4, 1].Value = "Quick Book Report";
        ws.Cells[4, 1].Style.Font.Bold = true;

        bool showVehicle = data.IncludeVehicleColumns;
        int headerRow = 5;
        string[] headers = showVehicle
            ? ["Date", "Reference", "Department", "Description", "Plate #", "Engine/Serial #", "Class", "Amount"]
            : ["Date", "Reference", "Department", "Description", "Class", "Amount"];
        int amountCol = headers.Length;
        int labelCol = amountCol - 1;
        string amountColLetter = ExcelCellAddress.GetColumnLetter(amountCol);
        for (int c = 0; c < headers.Length; c++)
        {
            ws.Cells[headerRow, c + 1].Value = headers[c];
        }

        using (var hr = ws.Cells[headerRow, 1, headerRow, headers.Length])
        {
            hr.Style.Font.Bold = true;
            hr.Style.Fill.PatternType = ExcelFillStyle.Solid;
            hr.Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.FromArgb(230, 236, 245));
            hr.Style.Border.Bottom.Style = ExcelBorderStyle.Medium;
        }
        ws.Cells[headerRow, amountCol].Style.HorizontalAlignment = ExcelHorizontalAlignment.Right;

        int row = headerRow + 1;
        var subtotalRows = new List<int>();

        foreach (var grp in data.AccountGroups)
        {
            ws.Cells[row, 1].Value = grp.AccountGroup;
            ws.Cells[row, 1, row, amountCol].Merge = true;
            ws.Cells[row, 1].Style.Font.Bold = true;
            ws.Cells[row, 1].Style.Fill.PatternType = ExcelFillStyle.Solid;
            ws.Cells[row, 1].Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.FromArgb(245, 247, 250));
            row++;

            int groupStart = row;
            foreach (var item in grp.Rows)
            {
                int colIdx = 1;
                ws.Cells[row, colIdx++].Value = item.Date;
                ws.Cells[row, colIdx++].Value = item.Reference;
                ws.Cells[row, colIdx++].Value = item.Department;
                ws.Cells[row, colIdx++].Value = item.Description;
                if (showVehicle)
                {
                    ws.Cells[row, colIdx++].Value = item.PlateNumber ?? "-";
                    ws.Cells[row, colIdx++].Value = item.EngineNumber ?? "-";
                }
                ws.Cells[row, colIdx++].Value = item.ClassName;
                ws.Cells[row, colIdx].Value = item.Amount;
                ws.Cells[row, colIdx].Style.Numberformat.Format = "#,##0.00";
                row++;
            }

            int groupEnd = row - 1;
            ws.Cells[row, labelCol].Value = $"Subtotal ({grp.AccountGroup})";
            ws.Cells[row, labelCol].Style.HorizontalAlignment = ExcelHorizontalAlignment.Right;
            ws.Cells[row, labelCol].Style.Font.Italic = true;
            ws.Cells[row, amountCol].Formula = $"SUM({amountColLetter}{groupStart}:{amountColLetter}{groupEnd})";
            ws.Cells[row, amountCol].Style.Numberformat.Format = "#,##0.00";
            ws.Cells[row, amountCol].Style.Font.Bold = true;
            ws.Cells[row, amountCol].Style.Border.Top.Style = ExcelBorderStyle.Thin;
            ws.Cells[row, amountCol].Style.Border.Bottom.Style = ExcelBorderStyle.Thin;
            subtotalRows.Add(row);
            row++;
        }

        ws.Cells[row, 1].Value = $"Total Ending amount to Quick Book {data.PeriodLabel}";
        ws.Cells[row, 1, row, labelCol].Merge = true;
        ws.Cells[row, 1].Style.Font.Bold = true;
        if (subtotalRows.Count > 0)
        {
            ws.Cells[row, amountCol].Formula = string.Join("+", subtotalRows.Select(r => $"{amountColLetter}{r}"));
        }
        else
        {
            ws.Cells[row, amountCol].Value = 0m;
        }
        ws.Cells[row, amountCol].Style.Numberformat.Format = "$#,##0.00";
        ws.Cells[row, amountCol].Style.Font.Bold = true;
        using (var gtr = ws.Cells[row, 1, row, amountCol])
        {
            gtr.Style.Border.Top.Style = ExcelBorderStyle.Thin;
            gtr.Style.Border.Bottom.Style = ExcelBorderStyle.Double;
        }

        // Sub-report 1: Recorded Ending Amount Summary
        row += 2;
        ws.Cells[row, 3].Value = $"Ending amount according to inventory/Fixed asset recorded {data.PeriodLabel}";
        ws.Cells[row, 3].Style.Font.Bold = true;
        row++;

        int summaryStart = row;
        foreach (var sumItem in data.RecordedSummary)
        {
            ws.Cells[row, 3].Value = $"* {sumItem.CategoryLabel}";
            ws.Cells[row, 4].Value = "$";
            ws.Cells[row, 4].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
            ws.Cells[row, 5].Value = sumItem.Amount;
            ws.Cells[row, 5].Style.Numberformat.Format = "#,##0.00";
            using var r = ws.Cells[row, 3, row, 5];
            r.Style.Border.Top.Style = ExcelBorderStyle.Thin;
            r.Style.Border.Bottom.Style = ExcelBorderStyle.Thin;
            r.Style.Border.Left.Style = ExcelBorderStyle.Thin;
            r.Style.Border.Right.Style = ExcelBorderStyle.Thin;
            row++;
        }

        ws.Cells[row, 3].Value = "Total";
        ws.Cells[row, 3].Style.Font.Bold = true;
        ws.Cells[row, 4].Value = "$";
        ws.Cells[row, 4].Style.Font.Bold = true;
        ws.Cells[row, 4].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
        ws.Cells[row, 5].Formula = data.RecordedSummary.Count > 0
            ? $"SUM(E{summaryStart}:E{row - 1})"
            : "0";
        ws.Cells[row, 5].Style.Font.Bold = true;
        ws.Cells[row, 5].Style.Numberformat.Format = "#,##0.00";
        using (var tr = ws.Cells[row, 3, row, 5])
        {
            tr.Style.Fill.PatternType = ExcelFillStyle.Solid;
            tr.Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.FromArgb(240, 240, 240));
            tr.Style.Border.Top.Style = ExcelBorderStyle.Thin;
            tr.Style.Border.Bottom.Style = ExcelBorderStyle.Thin;
            tr.Style.Border.Left.Style = ExcelBorderStyle.Thin;
            tr.Style.Border.Right.Style = ExcelBorderStyle.Thin;
        }

        // Signatures
        row += 3;
        ws.Cells[row, 1].Value = "Prepared by:";
        ws.Cells[row, 5].Value = "Reviewed by:";
        ws.Cells[row + 3, 1].Value = string.IsNullOrWhiteSpace(data.PreparedBy) ? data.PreparedRole : $"{data.PreparedBy} ({data.PreparedRole})";
        ws.Cells[row + 3, 5].Value = string.IsNullOrWhiteSpace(data.ReviewedBy) ? data.ReviewedRole : $"{data.ReviewedBy} ({data.ReviewedRole})";
        ws.Cells[row + 3, 1].Style.Font.Bold = true;
        ws.Cells[row + 3, 5].Style.Font.Bold = true;

        ws.Cells.AutoFitColumns(12, 48);

        // Sheet 2: Monthly New Product Amount by Department
        if (request.IncludeMonthlyDepartmentSubReport)
        {
            var mws = package.Workbook.Worksheets.Add("Monthly Dept Breakdown");
            mws.Cells[1, 1].Value = $"New Product Amount by Month & Department ({data.PeriodLabel})";
            mws.Cells[1, 1].Style.Font.Bold = true;
            mws.Cells[1, 1].Style.Font.Size = 13;

            int mHeader = 3;
            mws.Cells[mHeader, 1].Value = "Department";
            for (int mIdx = 0; mIdx < data.Months.Count; mIdx++)
            {
                mws.Cells[mHeader, mIdx + 2].Value = data.Months[mIdx];
                mws.Cells[mHeader, mIdx + 2].Style.HorizontalAlignment = ExcelHorizontalAlignment.Right;
            }
            int qtyCol = data.Months.Count + 2;
            int totalCol = data.Months.Count + 3;
            mws.Cells[mHeader, qtyCol].Value = "Total Qty";
            mws.Cells[mHeader, totalCol].Value = "Total Amount";
            mws.Cells[mHeader, qtyCol].Style.HorizontalAlignment = ExcelHorizontalAlignment.Right;
            mws.Cells[mHeader, totalCol].Style.HorizontalAlignment = ExcelHorizontalAlignment.Right;

            using (var mhr = mws.Cells[mHeader, 1, mHeader, totalCol])
            {
                mhr.Style.Font.Bold = true;
                mhr.Style.Fill.PatternType = ExcelFillStyle.Solid;
                mhr.Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.FromArgb(30, 64, 175));
                mhr.Style.Font.Color.SetColor(System.Drawing.Color.White);
            }

            int mRow = mHeader + 1;
            int dataStart = mRow;
            foreach (var dRow in data.DepartmentMonthlySubReport)
            {
                mws.Cells[mRow, 1].Value = dRow.Department;
                for (int mIdx = 0; mIdx < data.Months.Count; mIdx++)
                {
                    var monthKey = data.Months[mIdx];
                    decimal val = dRow.MonthlyAmounts.TryGetValue(monthKey, out var amt) ? amt : 0m;
                    mws.Cells[mRow, mIdx + 2].Value = val;
                    mws.Cells[mRow, mIdx + 2].Style.Numberformat.Format = "$#,##0.00";
                }
                mws.Cells[mRow, qtyCol].Value = dRow.TotalQuantity;
                if (data.Months.Count > 0)
                {
                    var lastMonthColLetter = ExcelCellAddress.GetColumnLetter(data.Months.Count + 1);
                    mws.Cells[mRow, totalCol].Formula = $"SUM(B{mRow}:{lastMonthColLetter}{mRow})";
                }
                else
                {
                    mws.Cells[mRow, totalCol].Value = dRow.TotalAmount;
                }
                mws.Cells[mRow, totalCol].Style.Numberformat.Format = "$#,##0.00";
                mws.Cells[mRow, totalCol].Style.Font.Bold = true;
                mRow++;
            }

            int dataEnd = mRow - 1;
            mws.Cells[mRow, 1].Value = "Monthly Total";
            mws.Cells[mRow, 1].Style.Font.Bold = true;
            for (int col = 2; col <= totalCol; col++)
            {
                if (dataEnd >= dataStart)
                {
                    var colLetter = ExcelCellAddress.GetColumnLetter(col);
                    mws.Cells[mRow, col].Formula = $"SUM({colLetter}{dataStart}:{colLetter}{dataEnd})";
                }
                else
                {
                    mws.Cells[mRow, col].Value = 0;
                }
                mws.Cells[mRow, col].Style.Font.Bold = true;
                if (col != qtyCol)
                {
                    mws.Cells[mRow, col].Style.Numberformat.Format = "$#,##0.00";
                }
            }
            using (var mtr = mws.Cells[mRow, 1, mRow, totalCol])
            {
                mtr.Style.Fill.PatternType = ExcelFillStyle.Solid;
                mtr.Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.FromArgb(219, 234, 254));
                mtr.Style.Border.Top.Style = ExcelBorderStyle.Thin;
                mtr.Style.Border.Bottom.Style = ExcelBorderStyle.Double;
            }
            mws.Cells.AutoFitColumns(12, 40);
        }

        return package.GetAsByteArray();
    }

    private static (DateTime startUtc, DateTime endUtc) ResolveDateRange(DateTime? start, DateTime? end)
    {
        var now = DateTime.UtcNow;
        var quarterStartMonth = ((now.Month - 1) / 3) * 3 + 1;
        var defaultStart = new DateTime(now.Year, quarterStartMonth, 1, 0, 0, 0, DateTimeKind.Utc);
        var defaultEnd = defaultStart.AddMonths(3).AddTicks(-1);

        var s = start.HasValue ? DateTime.SpecifyKind(start.Value.Date, DateTimeKind.Utc) : defaultStart;
        var e = end.HasValue ? DateTime.SpecifyKind(end.Value.Date, DateTimeKind.Utc).AddDays(1).AddTicks(-1) : defaultEnd;
        if (e < s) e = s.AddDays(1).AddTicks(-1);
        return (s, e);
    }

    private static string FormatDefaultPeriodLabel(DateTime start, DateTime end)
    {
        if (start.Year == end.Year && start.Month == end.Month)
        {
            return start.ToString("MMMM yyyy", CultureInfo.InvariantCulture);
        }
        if (start.Year == end.Year)
        {
            return $"{start:MMMM}-{end:MMMM} {start:yyyy}";
        }
        return $"{start:MMM yyyy} - {end:MMM yyyy}";
    }

    private static string ResolveAccountGroup(string categoryName, string productName, Dictionary<string, string> overrides)
    {
        if (overrides.TryGetValue(categoryName, out var exact) && !string.IsNullOrWhiteSpace(exact))
        {
            return exact.Trim();
        }

        var combined = $"{categoryName} {productName}";
        foreach (var (keywords, label) in AccountRules)
        {
            if (keywords.Any(k => combined.Contains(k, StringComparison.OrdinalIgnoreCase)))
            {
                return label;
            }
        }

        return "2406 · Inventory";
    }

    private static string BuildDescription(string productName, int qty, string? attributes, string? responsiblePerson)
    {
        var parts = new List<string> { $"{productName} ({qty} unit{(qty == 1 ? "" : "s")})" };
        if (!string.IsNullOrWhiteSpace(attributes)) parts.Add(attributes.Trim());
        if (!string.IsNullOrWhiteSpace(responsiblePerson)) parts.Add($"for {responsiblePerson.Trim()}");
        return string.Join(" · ", parts);
    }

    private static string ResolveClassLabel(string? purchaseNotes, string? supplierName, string? acquisitionType)
    {
        if (!string.IsNullOrWhiteSpace(purchaseNotes))
        {
            var cleaned = purchaseNotes
                .Replace("Donor:", "", StringComparison.OrdinalIgnoreCase)
                .Replace("Donated by:", "", StringComparison.OrdinalIgnoreCase)
                .Split('|')[0]
                .Trim();
            if (!string.IsNullOrWhiteSpace(cleaned) && !cleaned.StartsWith("Sheet:", StringComparison.OrdinalIgnoreCase))
            {
                return cleaned;
            }
        }
        if (!string.IsNullOrWhiteSpace(supplierName) && !supplierName.StartsWith("Default Supplier", StringComparison.OrdinalIgnoreCase))
        {
            return supplierName.Trim();
        }
        return string.IsNullOrWhiteSpace(acquisitionType) ? "General Fund" : acquisitionType;
    }

    private static List<string> BuildMonthSequence(DateTime start, DateTime end, List<ReconciliationRowDto> rows)
    {
        var list = new List<string>();
        var cursor = new DateTime(start.Year, start.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var limit = new DateTime(end.Year, end.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        int guard = 0;
        while (cursor <= limit && guard++ < 36)
        {
            list.Add(cursor.ToString("MMM yyyy", CultureInfo.InvariantCulture));
            cursor = cursor.AddMonths(1);
        }

        foreach (var r in rows)
        {
            if (!list.Contains(r.MonthLabel, StringComparer.OrdinalIgnoreCase))
            {
                list.Add(r.MonthLabel);
            }
        }
        return list;
    }
}
