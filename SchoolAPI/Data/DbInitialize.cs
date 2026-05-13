using System.Text.Json;
using System.Diagnostics;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Entities;

namespace SchoolAPI.Data;

public class DbInitialize
{
    // This is for seeding initial data into the database
    public static void InitDb(WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SchoolDbContext>() ?? throw new InvalidOperationException("Failed to get SchoolDbContext from service provider.");
        
        SeedingData(context);
        SeedExcelData(context);
    }


    private static void SeedingData(SchoolDbContext context)
    {
        context.Database.Migrate();
        if (context.Students.Any())
        {
            Console.WriteLine("Already have data");
            return;   // DB has been seeded
        }
        // var student = new List<Student> { new Student { } ,new Student { } }
        var student = new Student
        {
            KhFirstName = "សុខ",
            KhLastName = "សុវណ្ណ",
            EngFirstName = "Sok",
            EngLastName = "Sovann",
        };

        context.Students.Add(student);
        // context.Students.AddRange(student)
        context.SaveChanges();
    }

    public static void SeedExcelData(SchoolDbContext context)
    {
        // 1. Prevent double-seeding if products already exist
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
            Path.Combine(Directory.GetCurrentDirectory(), fileName) // In case it's just sitting in the root SchoolAPI folder
        };

        var filePath = possiblePaths.FirstOrDefault(File.Exists);

        if (filePath == null)
        {
            throw new FileNotFoundException($"\n\n❌ CRITICAL: Excel file '{fileName}' NOT found.\nWe tried looking in these locations:\n1. {possiblePaths[0]}\n2. {possiblePaths[1]}\n3. {possiblePaths[2]}\n\nPlease double check the file's name and location!\n\n");
        }

        using var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
        ProcessExcelStream(context, stream);
    }

    public static (int importedCount, List<string> errors) ProcessExcelStream(SchoolDbContext context, Stream stream)
    {
        var errors = new List<string>();
        try 
        {
            using var workbook = new XLWorkbook(stream);
            var worksheet = workbook.Worksheet(1); // Read the first worksheet

        // 2. Dynamically map Column Names to their exact Column Indexes
            // We look for the ACTUAL header row by searching for standard column names instead of guessing by cell count
            var headerRow = worksheet.RowsUsed().FirstOrDefault(r => 
                r.CellsUsed().Any(c => 
                    c.GetString().Contains("Name", StringComparison.OrdinalIgnoreCase) || 
                    c.GetString().Contains("ឈ្មោះ", StringComparison.OrdinalIgnoreCase) ||
                    c.GetString().Contains("Code", StringComparison.OrdinalIgnoreCase) ||
                    c.GetString().Contains("កូដ", StringComparison.OrdinalIgnoreCase) ||
                    c.GetString().Contains("Item", StringComparison.OrdinalIgnoreCase)
                )
            ) ?? worksheet.FirstRowUsed();
        if (headerRow == null)
        {
            Console.WriteLine("\n⚠️ Excel file is completely empty!\n");
            errors.Add("Excel file is completely empty!");
            return (0, errors);
        }

        var columnMap = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        foreach (var cell in headerRow.CellsUsed())
        {
            var headerName = cell.GetString().Trim();
                // Normalize spaces and newlines so "Responsible\nPerson" becomes "Responsible Person"
                headerName = System.Text.RegularExpressions.Regex.Replace(headerName, @"\s+", " ");
            if (!string.IsNullOrEmpty(headerName) && !columnMap.ContainsKey(headerName))
            {
                columnMap[headerName] = cell.Address.ColumnNumber;
            }
        }

        var lastRow = worksheet.LastRowUsed()?.RowNumber() ?? headerRow.RowNumber();
        var rows = worksheet.Rows(headerRow.RowNumber() + 1, lastRow);

        // Local dictionaries to act as a cache. GroupBy prevents crashes if the DB already has identical duplicate keys!
        var categories = context.Categories.AsEnumerable().GroupBy(c => c.Name ?? "").ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);
        var brands = context.Brands.AsEnumerable().GroupBy(b => b.Name ?? "").ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);
        var departments = context.Departments.AsEnumerable().GroupBy(d => d.Name ?? "").ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);
        var qualities = context.Qualities.AsEnumerable().GroupBy(q => q.Name ?? "").ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);
        var suppliers = context.Suppliers.AsEnumerable().GroupBy(s => s.Name ?? "").ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);
        var donors = context.Donors.AsEnumerable().GroupBy(d => d.Name ?? "").ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);
        var persons = context.Persons.AsEnumerable().GroupBy(p => p.FullName ?? "").ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);
        var responsers = context.Responsers.AsEnumerable().GroupBy(r => r.Name ?? "").ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

        Console.WriteLine("\n========================================================");
        Console.WriteLine("📊 FOUND THE FOLLOWING COLUMNS IN YOUR EXCEL FILE:");
        foreach (var header in columnMap.Keys)
        {
            Console.WriteLine($"   => \"{header}\"");
        }
        Console.WriteLine("========================================================\n");

        Console.WriteLine("Scanning Excel file for Lookup Data (Categories, Brands, etc.)...");

        // 3. Helper to safely extract strings by Column Header Name OR Fallback Index
        string GetSafeString(IXLRow r, string columnName, int fallbackIndex = -1) {
            int targetCol = -1;
            if (columnMap.TryGetValue(columnName, out int colIndex)) {
                targetCol = colIndex;
            } else if (fallbackIndex > 0) {
                targetCol = fallbackIndex;
            }

            if (targetCol > 0) {
                try { 
                    var cell = r.Cell(targetCol);
                    if (cell.IsEmpty()) return "";

                    // Attempt to get the value EXACTLY as it appears visually in Excel (e.g. "50%" or "Brand New")
                    try {
                        var formatted = cell.GetFormattedString();
                        if (!string.IsNullOrWhiteSpace(formatted)) return formatted.Trim();
                    } catch { }

                    // Fallback to raw unformatted value if the cell has a weird custom format
                    return cell.Value.ToString().Trim(); 
                }
                catch { return ""; }
            }
            return "";
        }

            // 4. Auto-detect columns (Strict mapping to avoid misinterpretation)
        string FindColumn(params string[] possibleNames)
        {
                // First pass: Try to find an EXACT match
            foreach (var name in possibleNames)
            {
                    var exactMatch = columnMap.Keys.FirstOrDefault(k => k.Equals(name, StringComparison.OrdinalIgnoreCase));
                    if (exactMatch != null) return exactMatch;
                }
                // Second pass: Try to find a CONTAINS match safely
                foreach (var name in possibleNames)
                {
                    var match = columnMap.Keys.FirstOrDefault(k => k.Contains(name, StringComparison.OrdinalIgnoreCase));
                    if (match != null) return match;
            }
            return possibleNames[0]; // Fallback to the first option if nothing matches
        }

        // ==============================================================================
        // ⚠️ AUTO-DETECTED COLUMN MAPPING ⚠️
        // Add your exact Khmer or English column names to these lists if they fail!
        // ==============================================================================
            string col_ProductName = FindColumn("ឈ្មោះសម្ភារៈ", "ឈ្មោះ", "មុខទំនិញ", "Item Name", "Product Name", "Asset Name", "Product", "Name"); 
        string col_CodeNumber  = FindColumn("លេខកូដ", "កូដ", "អត្តលេខ","Code No", "Code Number", "Code", "ID");  
        string col_Category    = FindColumn("ប្រភេទ", "Category", "Type", "ក្រុម"); 
        string col_Brand       = FindColumn("ម៉ាក", "យីហោ", "Brand", "Make");
        string col_Department  = FindColumn("ផ្នែក", "ទីតាំង", "Department", "Dept","Location", "Place");  
        string col_Quality     = FindColumn("ស្ថានភាព", "គុណភាព", "Condition", "Quality");  
        string col_Price       = FindColumn("តម្លៃ", "តំលៃ", "ឯកតា", "Price", "Cost", "Value","Unit Price"); 
        string col_Quantity    = FindColumn("ចំនួន", "បរិមាណ", "Quantity", "Qty", "Count"); 
        string col_Supplier    = FindColumn("អ្នកផ្គត់ផ្គង់", "ក្រុមហ៊ុន", "Supplier", "Suppliers", "Vendor", "Source");
        string col_Contact     = FindColumn("ទំនាក់ទំនង", "លេខទូរស័ព្ទ", "Contact", "Phone","Email");
        string col_Donor       = FindColumn("អ្នកផ្តល់ជំនួយ", "អង្គការ", "Donor", "Sponsor");
        string col_Person      = FindColumn("អ្នកទទួលខុសត្រូវ", "អ្នកប្រើប្រាស់", "ឈ្មោះអ្នកប្រើប្រាស់", "Responsible Person", "User", "Owner", "Person");
        string col_Voucher     = FindColumn("វិក្កយបត្រ", "ឯកសារយោង", "Voucher", "Invoice", "Receipt");
        string col_Specs       = FindColumn("លក្ខណៈបច្ចេកទេស", "ម៉ូដែល", "Specs", "Specification", "Model", "Attributes");
        string col_Year        = FindColumn("ឆ្នាំ", "កាលបរិច្ឆេទ", "Year");
        string col_Description = FindColumn("បរិយាយ", "កំណត់សម្គាល់", "Note", "Remark", "Details", "Description");
        // ==============================================================================

            Console.WriteLine("\n========================================================");
            Console.WriteLine("✅ FINAL COLUMN MAPPINGS DETERMINED:");
            Console.WriteLine($"   Product Name => {col_ProductName}");
            Console.WriteLine($"   Code Number  => {col_CodeNumber}");
            Console.WriteLine($"   Description  => {col_Description}");
            Console.WriteLine($"   Quantity     => {col_Quantity}");
            Console.WriteLine($"   Responsible  => {col_Person}");
            Console.WriteLine($"   Supplier     => {col_Supplier}");
            Console.WriteLine($"   Donor        => {col_Donor}");
            Console.WriteLine($"   Voucher      => {col_Voucher}");
            Console.WriteLine("========================================================\n");

        // PASS 1: Extract and insert all unique lookup values
        foreach (var row in rows)
        {
            try 
            {
                var categoryName = GetSafeString(row, col_Category, 5); // Col E
                var brandName = GetSafeString(row, col_Brand, 6);       // Col F
                var deptName = GetSafeString(row, col_Department, 7);   // Col G
                var qualityName = GetSafeString(row, col_Quality, 8);   // Col H
                
                var supplierName = GetSafeString(row, col_Supplier, 9); // Col I
                var contactInfo = GetSafeString(row, col_Contact, 10);  // Col J
                var donorName = GetSafeString(row, col_Donor, 13);      // Col M
                var personName = GetSafeString(row, col_Person, 14);    // Col N

                // if (!string.IsNullOrEmpty(donorName) && !donors.ContainsKey(donorName))
                // {
                //     var newDonor = new Donor { Name = donorName };
                //     context.Donors.Add(newDonor);
                //     donors[donorName] = newDonor;
                // }
            
            if (!string.IsNullOrEmpty(categoryName) && !categories.ContainsKey(categoryName))
            {
                var newCategory = new Category { Name = categoryName };
                context.Categories.Add(newCategory);
                categories[categoryName] = newCategory;
            }

            if (!string.IsNullOrEmpty(brandName) && !brands.ContainsKey(brandName))
            {
                var newBrand = new Brand { Name = brandName };
                context.Brands.Add(newBrand);
                brands[brandName] = newBrand;
            }

            if (!string.IsNullOrEmpty(deptName) && !departments.ContainsKey(deptName))
            {
                var newDept = new Department { Name = deptName };
                context.Departments.Add(newDept);
                departments[deptName] = newDept;
            }

                if (!string.IsNullOrEmpty(qualityName) && !qualities.ContainsKey(qualityName))
                {
                    var newQuality = new Quality { Name = qualityName };
                    context.Qualities.Add(newQuality);
                    qualities[qualityName] = newQuality;
                }

                if (!string.IsNullOrEmpty(supplierName))
                {
                    if (!suppliers.ContainsKey(supplierName)) {
                        var newSupplier = new Supplier { 
                            Name = supplierName,
                            ContactInfo = !string.IsNullOrEmpty(contactInfo) ? new List<string> { contactInfo } : new List<string>()
                        };
                        context.Suppliers.Add(newSupplier);
                        suppliers[supplierName] = newSupplier;
                    } else if (!string.IsNullOrEmpty(contactInfo)) {
                        var existingSup = suppliers[supplierName];
                        if (existingSup.ContactInfo == null) existingSup.ContactInfo = new List<string>();
                        if (!existingSup.ContactInfo.Contains(contactInfo)) existingSup.ContactInfo.Add(contactInfo);
                    }
                }
                
                if (!string.IsNullOrEmpty(donorName) && !donors.ContainsKey(donorName))
                {
                    var newDonor = new Donor { Name = donorName };
                    context.Donors.Add(newDonor);
                    donors[donorName] = newDonor;
                }
                
                if (!string.IsNullOrEmpty(personName))
                {
                    if (!persons.ContainsKey(personName)) {
                        var newPerson = new Person { FullName = personName };
                        context.Persons.Add(newPerson);
                        persons[personName] = newPerson;
                    }
                    if (!responsers.ContainsKey(personName)) {
                        var newResponser = new Responser { Name = personName };
                        context.Responsers.Add(newResponser);
                        responsers[personName] = newResponser;
                    }
                }
            }
            catch (Exception ex)
            {
                // This error is not critical, as the row might just be empty.
                // Console.WriteLine($"Info: Skipping lookup on Row {row.RowNumber()} - {ex.Message}");
            }
        }

        // Save the lookups so Entity Framework assigns them standard primary key IDs
        context.SaveChanges();

        Console.WriteLine("Seeding Products from Excel...");
        var productsToInsert = new List<Product>();
        var purchasesToInsert = new List<Purchase>();

        // PASS 2: Create the Products using the newly generated Lookup IDs
        foreach (var row in rows)
        {
            try 
            {
                // ==============================================================================
                var codeNumber  = GetSafeString(row, col_CodeNumber, 3);  // Col C
                
                // Skip the row entirely if there is no code number!
                if (string.IsNullOrEmpty(codeNumber)) 
                    continue;

                var productName = GetSafeString(row, col_ProductName, 2); // Col B
                if (string.IsNullOrEmpty(productName)) 
                {
                    // Try column A as a last resort for name if B is empty
                    productName = GetSafeString(row, "", 1); 
                    if (string.IsNullOrEmpty(productName)) {
                        productName = "Unknown Item " + codeNumber;
                    }
                }

                var categoryName = GetSafeString(row, col_Category, 5); // Col E
                var brandName    = GetSafeString(row, col_Brand, 6);    // Col F
                var deptName     = GetSafeString(row, col_Department, 7); // Col G
                var qualityName  = GetSafeString(row, col_Quality, 8);   // Col H
                
                var supplierName = GetSafeString(row, col_Supplier, 9);
                var contactInfo  = GetSafeString(row, col_Contact, 10);
                var donorName    = GetSafeString(row, col_Donor, 13);
                var personName   = GetSafeString(row, col_Person, 14);
                var voucher      = GetSafeString(row, col_Voucher, 15);
                var specs        = GetSafeString(row, col_Specs, 4); // Specs typically col D
                var description  = GetSafeString(row, col_Description, 16);
                var yearStr      = GetSafeString(row, col_Year, 17);
            
                var priceStr     = GetSafeString(row, col_Price, 11); // Col K
                var cleanPrice   = priceStr.Replace("$", "").Replace(",", "").Replace("៛", "").Trim();
                decimal.TryParse(cleanPrice, out decimal price);
                
                var qtyStr = GetSafeString(row, col_Quantity, 12);
                // Strip out random text like " pcs" or " units" so the number parses successfully
                var cleanQty = new string(qtyStr.Where(char.IsDigit).ToArray());
                if (!int.TryParse(cleanQty, out int qty)) { 
                    qty = 1; 
                }
                
                DateTime? yearDate = null;
                if (int.TryParse(yearStr.Replace(",", ""), out int parsedYear) && parsedYear > 1900 && parsedYear <= 2100) {
                    yearDate = new DateTime(parsedYear, 1, 1, 0, 0, 0, DateTimeKind.Utc);
                } else if (DateTime.TryParse(yearStr, out DateTime pDate)) {
                    yearDate = pDate.ToUniversalTime();
                }

            var product = new Product
            {
                ProductName = productName,
                CodeNumber = codeNumber,
                Price = price,
                TotalQuantity = qty,
                AvailableQuantity = qty,
                Description = description ?? "",
                Attributes = specs,
                Year = yearDate,
                CreatedDate = DateTime.UtcNow,
                
                // Link to relations
                CategoryId = !string.IsNullOrEmpty(categoryName) ? categories[categoryName].Id : null,
                BrandId = !string.IsNullOrEmpty(brandName) ? brands[brandName].Id : null,
                DepartmentId = !string.IsNullOrEmpty(deptName) ? departments[deptName].Id : null,
                QualityId = !string.IsNullOrEmpty(qualityName) ? qualities[qualityName].Id : null,
                ResponsiblePersonId = !string.IsNullOrEmpty(personName) && persons.ContainsKey(personName) ? persons[personName].Id : null,
            };

            // Build the Purchase/PurchaseItem and Transaction tree for every item to record its initial acquisition.
            // This ensures that quantity, supplier, donor, etc. are always tracked in the system's history.
                var supplierId = !string.IsNullOrEmpty(supplierName) && suppliers.ContainsKey(supplierName) 
                    ? suppliers[supplierName].Id 
                        : null;

                // Enforce FK constraints by ensuring a supplier exists
                if (string.IsNullOrEmpty(supplierId)) {
                        var defaultSupName = !string.IsNullOrEmpty(donorName) ? "Donated (No Supplier)" : "Default Supplier (Excel Import)";
                        if (!suppliers.ContainsKey(defaultSupName)) {
                            var defaultSup = new Supplier { Name = defaultSupName };
                            context.Suppliers.Add(defaultSup);
                            context.SaveChanges();
                            suppliers[defaultSupName] = defaultSup;
                        }
                        supplierId = suppliers[defaultSupName].Id;
                }

                var purchase = new Purchase
                {
                    SupplierId = supplierId,
                    VoucherNumber = voucher,
                    TotalAmount = price * qty,
                    Status = "Completed",
                    AcquisitionType = !string.IsNullOrEmpty(donorName) ? "Donated" : "Purchased",
                    InvoiceDate = DateTime.UtcNow,
                    Notes = !string.IsNullOrEmpty(donorName) ? $"Donor: {donorName}" : ""
                };

                var purchaseItem = new PurchaseItem
                {
                    Product = product,
                    Quantity = qty,
                    UnitPrice = price,
                    ResponsiblePersonId = !string.IsNullOrEmpty(personName) && persons.ContainsKey(personName) ? persons[personName].Id : null,
                    Notes = description
                };

                purchase.PurchaseItems.Add(purchaseItem);
                purchasesToInsert.Add(purchase);

                    // Add Transaction to ensure DonorName/Responser/Department are flawlessly mapped!
                    var donorId = !string.IsNullOrEmpty(donorName) && donors.ContainsKey(donorName) ? donors[donorName].Id : null;
                    if (string.IsNullOrEmpty(donorId)) {
                        if (!donors.ContainsKey("N/A")) {
                            var defaultDonor = new Donor { Name = "N/A" };
                            context.Donors.Add(defaultDonor);
                            context.SaveChanges();
                            donors["N/A"] = defaultDonor;
                        }
                        donorId = donors["N/A"].Id;
                    }

                    var responserId = !string.IsNullOrEmpty(personName) && responsers.ContainsKey(personName) ? responsers[personName].Id : null;
                    if (string.IsNullOrEmpty(responserId)) {
                        if (!responsers.ContainsKey("N/A")) {
                            var defaultResponser = new Responser { Name = "N/A" };
                            context.Responsers.Add(defaultResponser);
                            context.SaveChanges();
                            responsers["N/A"] = defaultResponser;
                        }
                        responserId = responsers["N/A"].Id;
                    }

                    var transactionDeptId = product.DepartmentId;
                    if (string.IsNullOrEmpty(transactionDeptId)) {
                        if (!departments.ContainsKey("N/A")) {
                            var defaultDept = new Department { Name = "N/A" };
                            context.Departments.Add(defaultDept);
                            context.SaveChanges();
                            departments["N/A"] = defaultDept;
                        }
                        transactionDeptId = departments["N/A"].Id;
                    }

                    var transaction = new Transaction
                    {
                        Product = product,
                        TransactionType = !string.IsNullOrEmpty(donorName) ? TransactionType.Donate : TransactionType.Purchase,
                        ProviderName = supplierName ?? "",
                        DonorId = donorId,
                        DepartmentId = transactionDeptId,
                        ResponserId = responserId,
                        Quantity = qty,
                        TotalCost = price * qty
                    };
                    context.Transactions.Add(transaction);

            productsToInsert.Add(product);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ Warning: Failed to process product on Row {row.RowNumber()}. Error: {ex.Message}");
                errors.Add($"Failed to process product on Row {row.RowNumber()}: {ex.Message}");
            }
        }

        // Batch insert all products
        if (productsToInsert.Any())
        {
            context.Products.AddRange(productsToInsert);
            if (purchasesToInsert.Any()) context.Purchases.AddRange(purchasesToInsert);
            
            context.SaveChanges();
            Console.WriteLine($"\n✅ Successfully seeded {productsToInsert.Count} products from Excel!\n");
        }
        else
        {
            Console.WriteLine("\n⚠️ 0 products were found!");
            Console.WriteLine("This means the names in the C# code don't match the headers in your Excel file.");
            Console.WriteLine("\nHOW TO FIX THIS:");
            Console.WriteLine("1. Look at the 📊 FOUND COLUMNS list printed above in this terminal.");
            Console.WriteLine("2. Open 'DbInitialize.cs'.");
            Console.WriteLine("3. Update the FindColumn(\"...\") strings to include the exact names printed above.");
            Console.WriteLine("4. Restart the app!\n");
            errors.Add("0 products were found! Please check column mappings.");
        }
        
        return (productsToInsert.Count, errors);
        }
        catch (Exception ex)
        {
            errors.Add($"Fatal error processing Excel file: {ex.Message}");
            return (0, errors);
        }
    }
}

#region Another Seed Example
public class SeedUserDto
{
    public string UserName { get; set; }
    public string Email { get; set; }
    // other properties as needed
}


public class SeedUser
{
    // TODO : this function to seed users not yet completed

    public static async Task SeedUsers(SchoolDbContext context)
    {
        if (await context.Users.AnyAsync()) return;

        //Read user data from json file
        var userData = await File.ReadAllTextAsync("Data/UserSeedData.json");
        var users = JsonSerializer.Deserialize<List<SeedUserDto>>(userData);

        if (users == null)
        {
            Console.WriteLine("No users in seed data.");
            return;
        }
    }
}
#endregion