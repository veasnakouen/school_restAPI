namespace SchoolAPI.Entities;

public class Category : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Icon { get; set; }

    // Defines which extra fields this category needs
    // e.g. [{"key":"PlateNumber","label":"Plate No","required":true},...]
    public List<AttributeDefinition> AttributeSchema { get; set; } = [];

    public bool IsActive { get; set; } = true;

    public ICollection<Product> Products { get; set; } = [];
}
