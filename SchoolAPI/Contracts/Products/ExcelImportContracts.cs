namespace SchoolAPI.Contracts.Products;

public sealed class ExcelSheetPreviewDto
{
    public int SheetIndex { get; set; }
    public string SheetName { get; set; } = string.Empty;
    public bool IsImportable { get; set; }
    public string? SkipReason { get; set; }
    public int HeaderRowNumber { get; set; }
    public int EstimatedRowCount { get; set; }
    public string? SuggestedDepartment { get; set; }
    public List<string> DetectedColumns { get; set; } = new();
    public Dictionary<string, string> MappedFields { get; set; } = new();
    public List<Dictionary<string, string>> SampleRows { get; set; } = new();
}

public sealed class ExcelSheetImportResultDto
{
    public string SheetName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty; // Imported | Skipped | Failed
    public int ImportedCount { get; set; }
    public int SkippedDuplicateCount { get; set; }
    public int ErrorCount { get; set; }
    public string? Notes { get; set; }
}

public sealed class ExcelImportResultDto
{
    public string Message { get; set; } = string.Empty;
    public int ImportedCount { get; set; }
    public int SkippedDuplicateCount { get; set; }
    public List<ExcelSheetImportResultDto> SheetResults { get; set; } = new();
    public List<string> Errors { get; set; } = new();
}
