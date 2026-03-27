#nullable enable

using System.Diagnostics.CodeAnalysis;
using SchoolAPI.Entities;

namespace SchoolAPI.Controllers;

public class Product:BaseEntity
{
    [AllowNull]
    public string CodeNumber { get; set; }
    [AllowNull]
    public string Name { get; set; }
    [AllowNull]
    public string Description { get; set; }
    [AllowNull]
    public Category Category { get; set; }
    public Decimal? Price { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    // public string Department { get; set; } = string.Empty;
    [AllowNull]
    public string VochurNumber { get; set; }  
}

public class Category : BaseEntity
{
    [AllowNull]
    public string Name { get; set; }
}
 
public class Department : BaseEntity
{
    [AllowNull]
    public string Name { get; set; }
    [AllowNull]
    public string Location{ get; set; }
}