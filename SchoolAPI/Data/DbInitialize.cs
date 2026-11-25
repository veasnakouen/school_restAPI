using System.Globalization;
using System.Text.Json;
using System.Text.RegularExpressions;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Contracts.Products;
using SchoolAPI.Entities;

namespace SchoolAPI.Data;

public class DbInitialize
{
    public static void InitDb(WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SchoolDbContext>()
            ?? throw new InvalidOperationException("Failed to get SchoolDbContext from service provider.");

        context.Database.Migrate();
        SeedExcelData(context);
    }

    public static void SeedExcelData(SchoolDbContext context)
    {
        if (context.Products.Any())
        {
            Console.WriteLine("Products already seeded. Skipping Excel import.");
            return;
        }

        var fileName = "inventory.xlsx";
        var possiblePaths = new[]
        {
            Path.Combine(Directory.GetCurrentDirectory(), "Data", fileName),
            Path.Combine(AppContext.BaseDirectory, "Data", fileName),
            Path.Combine(Directory.GetCurrentDirectory(), fileName)
        };

        var filePath = possiblePaths.FirstOrDefault(File.Exists);
        if (filePath == null)
        {
            throw new FileNotFoundException(
                $"Excel file '{fileName}' not found. Checked: {string.Join(", ", possiblePaths)}");
        }

        using var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
        ProcessExcelStreamDetailed(context, stream, selectedSheets: null, skipDuplicates: true);
    }

    /// <summary>
    /// Inspects all worksheets in an Excel workbook without modifying the database.
    /// </summary>
    public static List<ExcelSheetPreviewDto> InspectExcelStream(Stream stream)
    {
        var previews = new List<ExcelSheetPreviewDto>();
        using var workbook = new XLWorkbook(stream);

        int index = 1;
        foreach (var worksheet in workbook.Worksheets)
        {
            var preview = AnalyzeWorksheet(worksheet, index++);
            previews.Add(preview);
        }

        return previews;
    }

    /// <summary>
    /// Backward-compatible wrapper returning total imported count and errors across all importable sheets.
    /// </summary>
    public static (int importedCount, List<string> errors) ProcessExcelStream(SchoolDbContext context, Stream stream)
    {
        var result = ProcessExcelStreamDetailed(context, stream, selectedSheets: null, skipDuplicates: true);
        return (result.ImportedCount, result.Errors);
    }

    /// <summary>
    /// Imports selected (or all auto-detected inventory) worksheets from a multi-sheet Excel workbook.
    /// </summary>
    public static ExcelImportResultDto ProcessExcelStreamDetailed(
        SchoolDbContext context,
        Stream stream,
        IReadOnlyCollection<string>? selectedSheets = null,
        bool skipDuplicates = true,
        IReadOnlyDictionary<string, string>? sheetDepartments = null)
    {
        var result = new ExcelImportResultDto();

        try
        {
            using var workbook = new XLWorkbook(stream);

            var selectedSet = selectedSheets != null && selectedSheets.Count > 0
                ? new HashSet<string>(selectedSheets.Select(s => s.Trim()), StringComparer.OrdinalIgnoreCase)
                : null;

            var deptOverrideMap = sheetDepartments != null && sheetDepartments.Count > 0
                ? new Dictionary<string, string>(sheetDepartments, StringComparer.OrdinalIgnoreCase)
                : new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

            // Load existing CodeNumbers once so duplicate detection works across all sheets & existing DB rows
            var existingCodeNumbers = skipDuplicates
                ? context.Products
                    .AsNoTracking()
                    .Where(p => p.CodeNumber != null && p.CodeNumber != "")
                    .Select(p => p.CodeNumber!.Trim())
                    .ToHashSet(StringComparer.OrdinalIgnoreCase)
                : new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            // Shared case-insensitive lookup caches across all sheets
            static Dictionary<string, T> BuildLookupMap<T>(IEnumerable<T> source, Func<T, string?> keySelector)
                => source
                    .Select(item => (Key: (keySelector(item) ?? "").Trim(), Item: item))
                    .Where(x => !string.IsNullOrEmpty(x.Key))
                    .GroupBy(x => x.Key, StringComparer.OrdinalIgnoreCase)
                    .ToDictionary(g => g.Key, g => g.First().Item, StringComparer.OrdinalIgnoreCase);

            var categories = BuildLookupMap(context.Categories.AsEnumerable(), c => c.Name);
            var brands = BuildLookupMap(context.Brands.AsEnumerable(), b => b.Name);
            var departments = BuildLookupMap(context.Departments.AsEnumerable(), d => d.Name);
            var qualities = BuildLookupMap(context.Qualities.AsEnumerable(), q => q.Name);
            var suppliers = BuildLookupMap(context.Suppliers.AsEnumerable(), s => s.Name);
            var donors = BuildLookupMap(context.Donors.AsEnumerable(), d => d.Name);
            var persons = BuildLookupMap(context.Persons.AsEnumerable(), p => p.FullName);
            var responsers = BuildLookupMap(context.Responsers.AsEnumerable(), r => r.Name);

            int sheetIndex = 1;
            foreach (var worksheet in workbook.Worksheets)
            {
                var preview = AnalyzeWorksheet(worksheet, sheetIndex++);

                if (selectedSet != null && !selectedSet.Contains(worksheet.Name.Trim()))
                {
                    result.SheetResults.Add(new ExcelSheetImportResultDto
                    {
                        SheetName = worksheet.Name,
                        Status = "Skipped",
                        Notes = "Deselected by user"
                    });
                    continue;
                }

                if (!preview.IsImportable)
                {
                    result.SheetResults.Add(new ExcelSheetImportResultDto
                    {
                        SheetName = worksheet.Name,
                        Status = "Skipped",
                        Notes = preview.SkipReason ?? "Not an inventory product sheet"
                    });
                    continue;
                }

                deptOverrideMap.TryGetValue(worksheet.Name.Trim(), out var sheetDeptOverride);
                var sheetResult = ImportSingleWorksheet(
                    context,
                    worksheet,
                    preview,
                    existingCodeNumbers,
                    skipDuplicates,
                    sheetDeptOverride,
                    categories,
                    brands,
                    departments,
                    qualities,
                    suppliers,
                    donors,
                    persons,
                    responsers,
                    result.Errors);

                result.SheetResults.Add(sheetResult);
                result.ImportedCount += sheetResult.ImportedCount;
                result.SkippedDuplicateCount += sheetResult.SkippedDuplicateCount;
            }

            result.Message = $"Import completed: {result.ImportedCount} imported, {result.SkippedDuplicateCount} duplicates skipped across {result.SheetResults.Count(s => s.Status == "Imported")} sheet(s).";
            return result;
        }
        catch (Exception ex)
        {
            result.Errors.Add($"Fatal error processing Excel file: {ex.Message}");
            result.Message = "Excel import failed.";
            return result;
        }
    }

    private static ExcelSheetPreviewDto AnalyzeWorksheet(IXLWorksheet worksheet, int sheetIndex)
    {
        var preview = new ExcelSheetPreviewDto
        {
            SheetIndex = sheetIndex,
            SheetName = worksheet.Name,
            SuggestedDepartment = InferDepartmentFromSheetName(worksheet.Name)
        };

        var usedRows = worksheet.RowsUsed().Take(35).ToList();
        if (usedRows.Count == 0)
        {
            preview.IsImportable = false;
            preview.SkipReason = "Empty worksheet";
            return preview;
        }

        // Find the real header row by scoring header keyword matches (must contain Code + Name + inventory attributes)
        IXLRow? headerRow = null;
        int bestScore = 0;

        foreach (var row in usedRows)
        {
            var cellTexts = row.CellsUsed()
                .Select(c => NormalizeHeader(c.GetString()))
                .Where(t => !string.IsNullOrEmpty(t))
                .ToList();

            if (cellTexts.Count < 3) continue;

            bool hasCode = cellTexts.Any(t => MatchesAny(t, CodeHeaderCandidates));
            bool hasName = cellTexts.Any(t => MatchesAny(t, NameHeaderCandidates));
            bool hasInventoryAttribute = cellTexts.Any(t =>
                MatchesAny(t, QtyHeaderCandidates) ||
                MatchesAny(t, PriceHeaderCandidates) ||
                MatchesAny(t, DeptHeaderCandidates));

            int score = (hasCode ? 3 : 0) + (hasName ? 3 : 0) + (hasInventoryAttribute ? 2 : 0) + Math.Min(cellTexts.Count, 10);
            if (hasCode && hasName && hasInventoryAttribute && score > bestScore)
            {
                bestScore = score;
                headerRow = row;
            }
        }

        if (headerRow == null)
        {
            preview.IsImportable = false;
            preview.SkipReason = "Summary/reference or non-inventory sheet (missing Code, Name, and Quantity/Price/Location headers)";
            return preview;
        }

        var columnMap = BuildColumnMap(headerRow);
        var mappings = ResolveFieldMappings(columnMap);

        preview.HeaderRowNumber = headerRow.RowNumber();
        preview.DetectedColumns = columnMap.Keys.ToList();
        preview.MappedFields = mappings
            .Where(kv => !string.IsNullOrEmpty(kv.Value))
            .ToDictionary(kv => kv.Key, kv => kv.Value!);

        var lastRow = worksheet.LastRowUsed()?.RowNumber() ?? headerRow.RowNumber();
        var dataRows = worksheet.Rows(headerRow.RowNumber() + 1, lastRow);

        int estimatedCount = 0;
        foreach (var row in dataRows)
        {
            if (row.IsEmpty()) continue;
            var code = mappings.TryGetValue("CodeNumber", out var codeCol) && codeCol != null
                ? CleanCellString(GetCellText(row, columnMap, codeCol))
                : "";
            var name = mappings.TryGetValue("ProductName", out var nameCol) && nameCol != null
                ? CleanCellString(GetCellText(row, columnMap, nameCol))
                : "";

            if (string.IsNullOrEmpty(code) || IsSummaryOrTotalRow(code, name)) continue;

            estimatedCount++;
            if (preview.SampleRows.Count < 3)
            {
                var sample = new Dictionary<string, string>();
                foreach (var kv in preview.MappedFields)
                {
                    var val = CleanCellString(GetCellText(row, columnMap, kv.Value));
                    if (!string.IsNullOrEmpty(val))
                    {
                        sample[kv.Key] = val;
                    }
                }
                if (sample.Count > 0)
                {
                    preview.SampleRows.Add(sample);
                }
            }
        }

        preview.EstimatedRowCount = estimatedCount;
        preview.IsImportable = estimatedCount > 0;
        if (!preview.IsImportable)
        {
            preview.SkipReason = "No product rows with valid Code Number found";
        }

        return preview;
    }

    private static ExcelSheetImportResultDto ImportSingleWorksheet(
        SchoolDbContext context,
        IXLWorksheet worksheet,
        ExcelSheetPreviewDto preview,
        HashSet<string> existingCodeNumbers,
        bool skipDuplicates,
        string? sheetDeptOverride,
        Dictionary<string, Category> categories,
        Dictionary<string, Brand> brands,
        Dictionary<string, Department> departments,
        Dictionary<string, Quality> qualities,
        Dictionary<string, Supplier> suppliers,
        Dictionary<string, Donor> donors,
        Dictionary<string, Person> persons,
        Dictionary<string, Responser> responsers,
        List<string> globalErrors)
    {
        var sheetResult = new ExcelSheetImportResultDto
        {
            SheetName = worksheet.Name,
            Status = "Imported"
        };

        var headerRow = worksheet.Row(preview.HeaderRowNumber);
        var columnMap = BuildColumnMap(headerRow);
        var map = ResolveFieldMappings(columnMap);

        var lastRow = worksheet.LastRowUsed()?.RowNumber() ?? headerRow.RowNumber();
        var rows = worksheet.Rows(headerRow.RowNumber() + 1, lastRow).ToList();

        string? sheetDefaultCategory = InferCategoryFromSheetName(worksheet.Name);
        string? currentSectionCategory = null;
        string? normalizedDeptOverride = CleanCellString(sheetDeptOverride);

        // First pass: register lookups & collect parsed rows for this sheet
        var parsedRows = new List<ParsedExcelProductRow>();

        foreach (var row in rows)
        {
            if (row.IsEmpty()) continue;

            try
            {
                var codeNumber = CleanCellString(GetMappedText(row, columnMap, map, "CodeNumber"));
                var productName = CleanCellString(GetMappedText(row, columnMap, map, "ProductName"));
                var priceStr = CleanCellString(GetMappedText(row, columnMap, map, "Price"));
                var qtyStr = CleanCellString(GetMappedText(row, columnMap, map, "Quantity"));

                // Detect section sub-header rows (common in I14-I25, ED (2): e.g., "Furnitures", "Technical Equipment")
                if (string.IsNullOrEmpty(codeNumber))
                {
                    if (string.IsNullOrEmpty(priceStr) && string.IsNullOrEmpty(qtyStr))
                    {
                        var firstText = CleanCellString(row.CellsUsed().FirstOrDefault()?.GetString());
                        if (!string.IsNullOrEmpty(firstText) &&
                            !IsSummaryOrTotalRow(firstText, firstText) &&
                            !firstText.StartsWith("MT ", StringComparison.OrdinalIgnoreCase) &&
                            !firstText.StartsWith("Inventory ", StringComparison.OrdinalIgnoreCase) &&
                            firstText.Length <= 60)
                        {
                            currentSectionCategory = NormalizeCategoryName(firstText);
                        }
                    }
                    continue;
                }

                // Skip year/section subtotal rows if any slipped in with a code-like string
                if (IsSummaryOrTotalRow(codeNumber, productName))
                {
                    continue;
                }

                // Deduplicate CodeNumber across sheets and existing DB records
                if (skipDuplicates && existingCodeNumbers.Contains(codeNumber))
                {
                    sheetResult.SkippedDuplicateCount++;
                    continue;
                }

                if (string.IsNullOrEmpty(productName))
                {
                    productName = $"Unknown Item {codeNumber}";
                }

                var rawCategory = CleanCellString(GetMappedText(row, columnMap, map, "Category"));
                var categoryName = NormalizeCategoryName(
                    !string.IsNullOrEmpty(rawCategory)
                        ? rawCategory
                        : (currentSectionCategory ?? sheetDefaultCategory ?? ""));

                var brandName = CleanCellString(GetMappedText(row, columnMap, map, "Brand"));
                var rawDeptOrLoc = CleanCellString(GetMappedText(row, columnMap, map, "Department"));
                var deptName = !string.IsNullOrEmpty(normalizedDeptOverride)
                    ? normalizedDeptOverride
                    : (!string.IsNullOrEmpty(rawDeptOrLoc) ? rawDeptOrLoc : (preview.SuggestedDepartment ?? ""));
                var qualityName = FormatQualityValue(row, columnMap, map);

                var rawSupplier = CleanCellString(GetMappedText(row, columnMap, map, "Supplier"));
                var rawContact = CleanCellString(GetMappedText(row, columnMap, map, "Contact"));
                var (supplierName, contactInfo) = ParseSupplierAndContact(rawSupplier, rawContact);

                var donorName = CleanCellString(GetMappedText(row, columnMap, map, "Donor"));
                var personName = CleanCellString(GetMappedText(row, columnMap, map, "Person"));
                var voucher = CleanCellString(GetMappedText(row, columnMap, map, "Voucher"));
                var specs = CleanCellString(GetMappedText(row, columnMap, map, "Specs"));
                var plateNumber = CleanCellString(GetMappedText(row, columnMap, map, "PlateNumber"));
                var engineNumber = CleanCellString(GetMappedText(row, columnMap, map, "EngineNumber"));
                var description = CleanCellString(GetMappedText(row, columnMap, map, "Description"));
                if (!string.IsNullOrEmpty(normalizedDeptOverride) &&
                    !string.IsNullOrEmpty(rawDeptOrLoc) &&
                    !rawDeptOrLoc.Equals(normalizedDeptOverride, StringComparison.OrdinalIgnoreCase))
                {
                    description = string.IsNullOrEmpty(description)
                        ? $"Location: {rawDeptOrLoc}"
                        : $"{description} | Location: {rawDeptOrLoc}";
                }

                var invoiceDate = TryParseExcelDate(row, columnMap, map);
                var yearDate = ResolveYearDate(row, columnMap, map, invoiceDate, codeNumber);

                bool isDonation =
                    !string.IsNullOrEmpty(donorName) ||
                    priceStr.Contains("donat", StringComparison.OrdinalIgnoreCase) ||
                    rawSupplier.Contains("donat", StringComparison.OrdinalIgnoreCase);

                if (isDonation && string.IsNullOrEmpty(donorName) && rawSupplier.Contains("donat", StringComparison.OrdinalIgnoreCase))
                {
                    donorName = rawSupplier;
                }

                var cleanPrice = priceStr.Replace("$", "").Replace(",", "").Replace("៛", "").Trim();
                decimal.TryParse(cleanPrice, NumberStyles.Any, CultureInfo.InvariantCulture, out decimal price);

                var cleanQty = new string(qtyStr.Where(char.IsDigit).ToArray());
                if (!int.TryParse(cleanQty, out int qty) || qty <= 0)
                {
                    qty = 1;
                }

                if (skipDuplicates)
                {
                    existingCodeNumbers.Add(codeNumber);
                }

                // Ensure lookups are queued in context
                EnsureLookup(context.Categories, categories, categoryName, n => new Category { Name = n });
                EnsureLookup(context.Brands, brands, brandName, n => new Brand { Name = n });
                EnsureLookup(context.Departments, departments, deptName, n => new Department { Name = n });
                EnsureLookup(context.Qualities, qualities, qualityName, n => new Quality { Name = n });
                EnsureLookup(context.Donors, donors, donorName, n => new Donor { Name = n });

                if (!string.IsNullOrEmpty(supplierName))
                {
                    if (!suppliers.TryGetValue(supplierName, out var existingSup))
                    {
                        var newSup = new Supplier
                        {
                            Name = supplierName,
                            ContactInfo = !string.IsNullOrEmpty(contactInfo) ? new List<string> { contactInfo } : new List<string>()
                        };
                        context.Suppliers.Add(newSup);
                        suppliers[supplierName] = newSup;
                    }
                    else if (!string.IsNullOrEmpty(contactInfo))
                    {
                        existingSup.ContactInfo ??= new List<string>();
                        if (!existingSup.ContactInfo.Contains(contactInfo))
                        {
                            existingSup.ContactInfo.Add(contactInfo);
                        }
                    }
                }

                if (!string.IsNullOrEmpty(personName))
                {
                    if (!persons.ContainsKey(personName))
                    {
                        var newPerson = new Person { FullName = personName };
                        context.Persons.Add(newPerson);
                        persons[personName] = newPerson;
                    }
                    if (!responsers.ContainsKey(personName))
                    {
                        var newResponser = new Responser { Name = personName };
                        context.Responsers.Add(newResponser);
                        responsers[personName] = newResponser;
                    }
                }

                parsedRows.Add(new ParsedExcelProductRow
                {
                    CodeNumber = codeNumber,
                    ProductName = productName,
                    CategoryName = categoryName,
                    BrandName = brandName,
                    DepartmentName = deptName,
                    QualityName = qualityName,
                    SupplierName = supplierName,
                    DonorName = donorName,
                    IsDonation = isDonation,
                    PersonName = personName,
                    Voucher = voucher,
                    Specs = specs,
                    PlateNumber = plateNumber,
                    EngineNumber = engineNumber,
                    Description = description,
                    Price = price,
                    Quantity = qty,
                    InvoiceDate = invoiceDate,
                    YearDate = yearDate
                });
            }
            catch (Exception ex)
            {
                sheetResult.ErrorCount++;
                globalErrors.Add($"[{worksheet.Name}] Row {row.RowNumber()}: {ex.Message}");
            }
        }

        if (parsedRows.Count == 0)
        {
            sheetResult.Notes = sheetResult.SkippedDuplicateCount > 0
                ? $"All {sheetResult.SkippedDuplicateCount} item(s) already exist (skipped duplicates)"
                : "No new product rows found";
            return sheetResult;
        }

        using var tx = context.Database.IsRelational() ? context.Database.BeginTransaction() : null;
        try
        {
            // Persist lookups first so IDs exist for FK relationships
            context.SaveChanges();

            var productsToInsert = new List<Product>(parsedRows.Count);
            var purchasesToInsert = new List<Purchase>(parsedRows.Count);

            foreach (var item in parsedRows)
            {
                var product = new Product
                {
                    ProductName = item.ProductName,
                    CodeNumber = item.CodeNumber,
                    Price = item.Price,
                    TotalQuantity = item.Quantity,
                    AvailableQuantity = item.Quantity,
                    Description = item.Description,
                    Attributes = string.IsNullOrEmpty(item.Specs) ? null : item.Specs,
                    PlateNumber = string.IsNullOrEmpty(item.PlateNumber) ? null : item.PlateNumber,
                    EngineNumber = string.IsNullOrEmpty(item.EngineNumber) ? null : item.EngineNumber,
                    Year = item.YearDate,
                    CreatedDate = DateTime.UtcNow,
                    CategoryId = !string.IsNullOrEmpty(item.CategoryName) && categories.TryGetValue(item.CategoryName, out var cat) ? cat.Id : null,
                    BrandId = !string.IsNullOrEmpty(item.BrandName) && brands.TryGetValue(item.BrandName, out var br) ? br.Id : null,
                    DepartmentId = !string.IsNullOrEmpty(item.DepartmentName) && departments.TryGetValue(item.DepartmentName, out var dep) ? dep.Id : null,
                    QualityId = !string.IsNullOrEmpty(item.QualityName) && qualities.TryGetValue(item.QualityName, out var qual) ? qual.Id : null,
                    ResponsiblePersonId = !string.IsNullOrEmpty(item.PersonName) && persons.TryGetValue(item.PersonName, out var per) ? per.Id : null,
                };

                string? supplierId = !string.IsNullOrEmpty(item.SupplierName) && suppliers.TryGetValue(item.SupplierName, out var sup)
                    ? sup.Id
                    : null;

                if (string.IsNullOrEmpty(supplierId))
                {
                    var defaultSupName = item.IsDonation
                        ? "Donated (No Supplier)"
                        : "Default Supplier (Excel Import)";
                    if (!suppliers.TryGetValue(defaultSupName, out var defaultSup))
                    {
                        defaultSup = new Supplier { Name = defaultSupName };
                        context.Suppliers.Add(defaultSup);
                        context.SaveChanges();
                        suppliers[defaultSupName] = defaultSup;
                    }
                    supplierId = defaultSup.Id;
                }

                var purchase = new Purchase
                {
                    SupplierId = supplierId,
                    VoucherNumber = string.IsNullOrEmpty(item.Voucher) ? null : item.Voucher,
                    TotalAmount = item.Price * item.Quantity,
                    Status = "Completed",
                    AcquisitionType = item.IsDonation ? "Donated" : "Purchased",
                    InvoiceDate = item.InvoiceDate ?? DateTime.UtcNow,
                    Notes = !string.IsNullOrEmpty(item.DonorName) ? $"Donor: {item.DonorName} | Sheet: {worksheet.Name}" : $"Sheet: {worksheet.Name}"
                };

                purchase.PurchaseItems.Add(new PurchaseItem
                {
                    Product = product,
                    Quantity = item.Quantity,
                    UnitPrice = item.Price,
                    ResponsiblePersonId = product.ResponsiblePersonId,
                    Notes = item.Description
                });

                var donorId = EnsureDefaultLookupId(context, context.Donors, donors, item.DonorName, "N/A", n => new Donor { Name = n }, d => d.Id);
                var responserId = EnsureDefaultLookupId(context, context.Responsers, responsers, item.PersonName, "N/A", n => new Responser { Name = n }, r => r.Id);
                var transactionDeptId = !string.IsNullOrEmpty(product.DepartmentId)
                    ? product.DepartmentId
                    : EnsureDefaultLookupId(context, context.Departments, departments, "", "N/A", n => new Department { Name = n }, d => d.Id);

                context.Transactions.Add(new Transaction
                {
                    Product = product,
                    TransactionType = item.IsDonation ? TransactionType.Donate : TransactionType.Purchase,
                    ProviderName = item.SupplierName,
                    DonorId = donorId,
                    DepartmentId = transactionDeptId,
                    ResponserId = responserId,
                    Resource = $"Excel:{worksheet.Name}",
                    Quantity = item.Quantity,
                    TotalCost = item.Price * item.Quantity
                });

                productsToInsert.Add(product);
                purchasesToInsert.Add(purchase);
            }

            context.Products.AddRange(productsToInsert);
            context.Purchases.AddRange(purchasesToInsert);
            context.SaveChanges();
            tx?.Commit();

            sheetResult.ImportedCount = productsToInsert.Count;
            sheetResult.Notes = $"Imported {productsToInsert.Count} item(s)" +
                (sheetResult.SkippedDuplicateCount > 0 ? $", skipped {sheetResult.SkippedDuplicateCount} duplicate(s)" : "");
        }
        catch (Exception ex)
        {
            tx?.Rollback();
            sheetResult.Status = "Failed";
            sheetResult.ErrorCount++;
            sheetResult.Notes = $"Sheet save failed: {ex.Message}";
            globalErrors.Add($"[{worksheet.Name}] Save failed: {ex.Message}");
        }

        return sheetResult;
    }

    // ──────────────────────────────────────────────────────────────
    // Column & Data Normalization Helpers
    // ──────────────────────────────────────────────────────────────

    private static readonly string[] CodeHeaderCandidates =
        ["Co.Inventory No.", "Co.Inventory No", "លេខកូដ", "កូដ", "អត្តលេខ", "Code No.", "Code No", "Code Number", "Code"];

    private static readonly string[] NameHeaderCandidates =
        ["ឈ្មោះសម្ភារៈ", "ឈ្មោះ", "មុខទំនិញ", "Item Name", "Iem Name", "Product Name", "Asset Name", "Product", "Name"];

    private static readonly string[] CategoryHeaderCandidates =
        ["ប្រភេទ", "Category", "Catergory", "Type", "ក្រុម"];

    private static readonly string[] BrandHeaderCandidates =
        ["ម៉ាក", "យីហោ", "Brand", "Make"];

    private static readonly string[] DeptHeaderCandidates =
        ["ផ្នែក", "ទីតាំង", "Department", "Dept", "Location", "Place"];

    private static readonly string[] QualityHeaderCandidates =
        ["ស្ថានភាព", "គុណភាព", "Condition", "Quality", "%New", "%NEW", "%Ne", "% New"];

    private static readonly string[] PriceHeaderCandidates =
        ["Unit Price", "តម្លៃ", "តំលៃ", "Price", "Cost", "Value"];

    private static readonly string[] QtyHeaderCandidates =
        ["Q.TY", "Q.Ty", "Quantity", "Qty", "ចំនួន", "បរិមាណ", "Count"];

    private static readonly string[] SupplierHeaderCandidates =
        ["Suppliers", "Supplier", "អ្នកផ្គត់ផ្គង់", "ក្រុមហ៊ុន", "Vendor", "Source"];

    private static readonly string[] ContactHeaderCandidates =
        ["ទំនាក់ទំនង", "លេខទូរស័ព្ទ", "Contact", "Phone", "Email"];

    private static readonly string[] DonorHeaderCandidates =
        ["Donor", "អ្នកផ្តល់ជំនួយ", "អង្គការ", "Sponsor", "Donation"];

    private static readonly string[] PersonHeaderCandidates =
        ["Responsible Person", "Responsible person", "អ្នកទទួលខុសត្រូវ", "អ្នកប្រើប្រាស់", "ឈ្មោះអ្នកប្រើប្រាស់", "User", "Owner", "Person"];

    private static readonly string[] VoucherHeaderCandidates =
        ["Voucher #", "Voucher#", "Voucher No", "Voucher Number", "Number Vou.", "Voucher", "វិក្កយបត្រ", "Invoice", "Receipt"];

    private static readonly string[] SpecsHeaderCandidates =
        ["Productt Specs", "Specs", "Specification", "Size/Color", "Size / Color", "Size & Color", "Size", "Size/brand", "Color", "Model", "Attributes", "លក្ខណៈបច្ចេកទេស"];

    private static readonly string[] PlateHeaderCandidates =
        ["Plate #", "Plate No", "Plate Number", "Plate", "ស្លាកលេខ"];

    private static readonly string[] EngineHeaderCandidates =
        ["Engine/Serial #", "Engine Number", "Engine No", "Engine", "Serial #", "Serial Number", "Serial No", "លេខម៉ាស៊ីន"];

    private static readonly string[] InvoiceDateHeaderCandidates =
        ["Invoice Date", "Date"];

    private static readonly string[] YearHeaderCandidates =
        ["Year", "ឆ្នាំ"];

    private static readonly string[] DescriptionHeaderCandidates =
        ["Description", "Remarks", "Remark", "Note", "Details", "បរិយាយ", "កំណត់សម្គាល់"];

    private static string NormalizeHeader(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return string.Empty;
        return Regex.Replace(raw.Trim(), @"\s+", " ");
    }

    private static bool MatchesAny(string header, string[] candidates) =>
        candidates.Any(c => header.Equals(c, StringComparison.OrdinalIgnoreCase) ||
                            header.Contains(c, StringComparison.OrdinalIgnoreCase));

    private static Dictionary<string, int> BuildColumnMap(IXLRow headerRow)
    {
        var columnMap = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        foreach (var cell in headerRow.CellsUsed())
        {
            var headerName = NormalizeHeader(cell.GetString());
            if (!string.IsNullOrEmpty(headerName) && !columnMap.ContainsKey(headerName))
            {
                columnMap[headerName] = cell.Address.ColumnNumber;
            }
        }
        return columnMap;
    }

    private static Dictionary<string, string?> ResolveFieldMappings(Dictionary<string, int> columnMap)
    {
        string? Find(params string[] candidates)
        {
            foreach (var c in candidates)
            {
                var exact = columnMap.Keys.FirstOrDefault(k => k.Equals(c, StringComparison.OrdinalIgnoreCase));
                if (exact != null) return exact;
            }
            foreach (var c in candidates)
            {
                var partial = columnMap.Keys.FirstOrDefault(k => k.Contains(c, StringComparison.OrdinalIgnoreCase));
                if (partial != null) return partial;
            }
            return null;
        }

        return new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase)
        {
            ["CodeNumber"] = Find(CodeHeaderCandidates),
            ["ProductName"] = Find(NameHeaderCandidates),
            ["Category"] = Find(CategoryHeaderCandidates),
            ["Brand"] = Find(BrandHeaderCandidates),
            ["Department"] = Find(DeptHeaderCandidates),
            ["Quality"] = Find(QualityHeaderCandidates),
            ["Price"] = Find(PriceHeaderCandidates),
            ["Quantity"] = Find(QtyHeaderCandidates),
            ["Supplier"] = Find(SupplierHeaderCandidates),
            ["Contact"] = Find(ContactHeaderCandidates),
            ["Donor"] = Find(DonorHeaderCandidates),
            ["Person"] = Find(PersonHeaderCandidates),
            ["Voucher"] = Find(VoucherHeaderCandidates),
            ["Specs"] = Find(SpecsHeaderCandidates),
            ["PlateNumber"] = Find(PlateHeaderCandidates),
            ["EngineNumber"] = Find(EngineHeaderCandidates),
            ["InvoiceDate"] = Find(InvoiceDateHeaderCandidates),
            ["Year"] = Find(YearHeaderCandidates),
            ["Description"] = Find(DescriptionHeaderCandidates)
        };
    }

    private static string GetMappedText(IXLRow row, Dictionary<string, int> columnMap, Dictionary<string, string?> mappings, string field)
    {
        if (!mappings.TryGetValue(field, out var header) || string.IsNullOrEmpty(header))
        {
            return string.Empty;
        }
        return GetCellText(row, columnMap, header);
    }

    private static string GetCellText(IXLRow row, Dictionary<string, int> columnMap, string headerName)
    {
        if (!columnMap.TryGetValue(headerName, out int colIndex) || colIndex <= 0) return string.Empty;
        try
        {
            var cell = row.Cell(colIndex);
            if (cell.IsEmpty()) return string.Empty;

            try
            {
                var formatted = cell.GetFormattedString();
                if (!string.IsNullOrWhiteSpace(formatted)) return formatted.Trim();
            }
            catch { }

            return cell.Value.ToString().Trim();
        }
        catch
        {
            return string.Empty;
        }
    }

    private static string CleanCellString(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return string.Empty;
        var trimmed = Regex.Replace(raw.Trim(), @"\s+", " ");
        // Filter Wingdings checkmarks ("ü") and placeholder tokens
        if (trimmed is "ü" or "" or "?" or "-" or "--" or "N/A") return string.Empty;
        return trimmed;
    }

    private static string NormalizeCategoryName(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return string.Empty;
        var cleaned = CleanCellString(raw);
        if (cleaned.Contains("Equeipment", StringComparison.OrdinalIgnoreCase))
        {
            cleaned = cleaned.Replace("Equeipment", "Equipment", StringComparison.OrdinalIgnoreCase);
        }
        if (cleaned.Equals("Furnitures", StringComparison.OrdinalIgnoreCase) ||
            cleaned.Equals("Furnitures Equipments", StringComparison.OrdinalIgnoreCase))
        {
            return "Furniture";
        }
        return cleaned;
    }

    private static bool IsSummaryOrTotalRow(string codeNumber, string productName)
    {
        static bool LooksLikeTotal(string text)
        {
            if (string.IsNullOrWhiteSpace(text)) return false;
            var t = text.Trim();
            return t.StartsWith("Total", StringComparison.OrdinalIgnoreCase) ||
                   t.StartsWith("Grand Total", StringComparison.OrdinalIgnoreCase) ||
                   t.StartsWith("Sub Total", StringComparison.OrdinalIgnoreCase) ||
                   t.StartsWith("Subtotal", StringComparison.OrdinalIgnoreCase) ||
                   t.StartsWith("សរុប", StringComparison.OrdinalIgnoreCase);
        }

        return LooksLikeTotal(codeNumber) || LooksLikeTotal(productName);
    }

    private static string? InferDepartmentFromSheetName(string sheetName)
    {
        var name = sheetName.Trim();
        if (string.IsNullOrEmpty(name)) return null;
        if (Regex.IsMatch(name, @"^IT\b|IT Inventory", RegexOptions.IgnoreCase)) return "IT";
        if (Regex.IsMatch(name, @"^Admin\b|Administration", RegexOptions.IgnoreCase)) return "Admin";
        if (Regex.IsMatch(name, @"^Account|Finance", RegexOptions.IgnoreCase)) return "Accounting";
        if (Regex.IsMatch(name, @"^Vehicle|Transport|Motor", RegexOptions.IgnoreCase)) return "Vehicle";
        if (Regex.IsMatch(name, @"^Kitchen|Canteen", RegexOptions.IgnoreCase)) return "Kitchen";
        if (Regex.IsMatch(name, @"^Clinic|Health|Medical", RegexOptions.IgnoreCase)) return "Clinic";
        if (Regex.IsMatch(name, @"^HR\b|Human Resource", RegexOptions.IgnoreCase)) return "HR";
        if (Regex.IsMatch(name, @"^Security", RegexOptions.IgnoreCase)) return "Security";
        return null;
    }

    private static string? InferCategoryFromSheetName(string sheetName)
    {
        if (sheetName.Equals("SW", StringComparison.OrdinalIgnoreCase)) return "Sewing Machine";
        if (sheetName.Equals("Entertainment Equipment", StringComparison.OrdinalIgnoreCase)) return "Entertainment Equipment";
        if (sheetName.Equals("Furniture", StringComparison.OrdinalIgnoreCase)) return "Furniture";
        if (sheetName.Equals("Technical Equipment", StringComparison.OrdinalIgnoreCase)) return "Technical Equipment";
        if (sheetName.Equals("Electric Equipment", StringComparison.OrdinalIgnoreCase)) return "Electric Equipment";
        return null;
    }

    private static string FormatQualityValue(IXLRow row, Dictionary<string, int> columnMap, Dictionary<string, string?> mappings)
    {
        if (!mappings.TryGetValue("Quality", out var header) || string.IsNullOrEmpty(header)) return string.Empty;
        if (!columnMap.TryGetValue(header, out int colIndex)) return string.Empty;

        var cell = row.Cell(colIndex);
        if (cell.IsEmpty()) return string.Empty;

        var formatted = CleanCellString(GetCellText(row, columnMap, header));
        if (decimal.TryParse(formatted, NumberStyles.Any, CultureInfo.InvariantCulture, out decimal numVal) &&
            header.Contains("%", StringComparison.OrdinalIgnoreCase))
        {
            if (numVal >= 0 && numVal <= 1)
            {
                return $"{Math.Round(numVal * 100)}%";
            }
        }
        return formatted;
    }

    private static (string supplierName, string contactInfo) ParseSupplierAndContact(string rawSupplier, string rawContact)
    {
        if (string.IsNullOrEmpty(rawSupplier)) return (string.Empty, rawContact);

        var telMatch = Regex.Match(rawSupplier, @"\bTel\s*:?\s*(.+)$", RegexOptions.IgnoreCase);
        if (telMatch.Success)
        {
            var extractedPhone = CleanCellString(telMatch.Groups[1].Value);
            var namePart = CleanCellString(rawSupplier[..telMatch.Index]);
            var combinedContact = string.IsNullOrEmpty(rawContact) ? extractedPhone : rawContact;
            return (namePart, combinedContact);
        }

        return (rawSupplier, rawContact);
    }

    private static DateTime? TryParseExcelDate(IXLRow row, Dictionary<string, int> columnMap, Dictionary<string, string?> mappings)
    {
        if (!mappings.TryGetValue("InvoiceDate", out var header) || string.IsNullOrEmpty(header)) return null;
        if (!columnMap.TryGetValue(header, out int colIndex)) return null;

        try
        {
            var cell = row.Cell(colIndex);
            if (cell.IsEmpty()) return null;

            if (cell.DataType == XLDataType.DateTime)
            {
                var dt = cell.GetDateTime();
                return DateTime.SpecifyKind(dt, DateTimeKind.Utc);
            }

            if (cell.DataType == XLDataType.Number)
            {
                var serial = cell.GetDouble();
                if (serial is > 20000 and < 80000)
                {
                    var dt = DateTime.FromOADate(serial);
                    return DateTime.SpecifyKind(dt, DateTimeKind.Utc);
                }
            }

            var text = CleanCellString(cell.GetString());
            if (!string.IsNullOrEmpty(text) && DateTime.TryParse(text, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var parsed))
            {
                return parsed.ToUniversalTime();
            }
        }
        catch { }

        return null;
    }

    private static DateTime? ResolveYearDate(
        IXLRow row,
        Dictionary<string, int> columnMap,
        Dictionary<string, string?> mappings,
        DateTime? invoiceDate,
        string codeNumber)
    {
        var yearStr = CleanCellString(GetMappedText(row, columnMap, mappings, "Year"));
        if (!string.IsNullOrEmpty(yearStr))
        {
            if (int.TryParse(yearStr.Replace(",", ""), out int parsedYear) && parsedYear is > 1900 and <= 2100)
            {
                return new DateTime(parsedYear, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            }
            if (DateTime.TryParse(yearStr, out var pDate))
            {
                return pDate.ToUniversalTime();
            }
        }

        if (invoiceDate.HasValue)
        {
            return new DateTime(invoiceDate.Value.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        }

        // Derive from code prefixes like "2016-7-001" or "MT14-FN-011"
        var fourDigit = Regex.Match(codeNumber, @"^(19|20)\d{2}\b");
        if (fourDigit.Success && int.TryParse(fourDigit.Value, out int y4))
        {
            return new DateTime(y4, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        }

        var mtTwoDigit = Regex.Match(codeNumber, @"^MT(\d{2})-", RegexOptions.IgnoreCase);
        if (mtTwoDigit.Success && int.TryParse(mtTwoDigit.Groups[1].Value, out int y2))
        {
            return new DateTime(2000 + y2, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        }

        return null;
    }

    private static void EnsureLookup<T>(
        DbSet<T> dbSet,
        Dictionary<string, T> cache,
        string name,
        Func<string, T> factory) where T : class
    {
        if (string.IsNullOrEmpty(name) || cache.ContainsKey(name)) return;
        var entity = factory(name);
        dbSet.Add(entity);
        cache[name] = entity;
    }

    private static string EnsureDefaultLookupId<T>(
        SchoolDbContext context,
        DbSet<T> dbSet,
        Dictionary<string, T> cache,
        string preferredName,
        string fallbackName,
        Func<string, T> factory,
        Func<T, string> idSelector) where T : class
    {
        if (!string.IsNullOrEmpty(preferredName) && cache.TryGetValue(preferredName, out var found))
        {
            return idSelector(found);
        }

        if (!cache.TryGetValue(fallbackName, out var fallback))
        {
            fallback = factory(fallbackName);
            dbSet.Add(fallback);
            context.SaveChanges();
            cache[fallbackName] = fallback;
        }
        return idSelector(fallback);
    }

    private sealed class ParsedExcelProductRow
    {
        public string CodeNumber { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public string CategoryName { get; set; } = string.Empty;
        public string BrandName { get; set; } = string.Empty;
        public string DepartmentName { get; set; } = string.Empty;
        public string QualityName { get; set; } = string.Empty;
        public string SupplierName { get; set; } = string.Empty;
        public string DonorName { get; set; } = string.Empty;
        public bool IsDonation { get; set; }
        public string PersonName { get; set; } = string.Empty;
        public string Voucher { get; set; } = string.Empty;
        public string Specs { get; set; } = string.Empty;
        public string PlateNumber { get; set; } = string.Empty;
        public string EngineNumber { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int Quantity { get; set; }
        public DateTime? InvoiceDate { get; set; }
        public DateTime? YearDate { get; set; }
    }
}

#region Another Seed Example
public class SeedUserDto
{
    public string UserName { get; set; }
    public string Email { get; set; }
}

public class SeedUser
{
    public static async Task SeedUsers(SchoolDbContext context)
    {
        if (await context.Users.AnyAsync()) return;

        var userData = await File.ReadAllTextAsync("Data/UserSeedData.json");
        var users = JsonSerializer.Deserialize<List<SeedUserDto>>(userData);

        if (users == null)
        {
            Console.WriteLine("No users in seed data.");
        }
    }
}
#endregion
