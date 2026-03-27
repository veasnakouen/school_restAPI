using System.Diagnostics.CodeAnalysis;
using SchoolAPI.Entities;

namespace SchoolAPI.Controllers;

public class Product:BaseEntity
{
    public string CodeNumber { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    [AllowNull]
    public Category Category { get; set; }
    public Decimal? Price { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    // public string Department { get; set; } = string.Empty;
    public string VochurNumber { get; set; }  
}

public class Category : BaseEntity
{
    public string Name { get; set; }
}
 
public class Department : BaseEntity
{
    public string Name { get; set; }
    public string Location{ get; set; }
}