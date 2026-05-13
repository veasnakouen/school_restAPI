namespace SchoolAPI.Entities;

public class AttributeDefinition
{
    public string Key { get; set; } = string.Empty;      // "plate_number"
    public string Label { get; set; } = string.Empty;    // "Plate Number"
    public string Type { get; set; } = "text";           // text,number,date
    public bool Required { get; set; }
    public string? Placeholder { get; set; }
}