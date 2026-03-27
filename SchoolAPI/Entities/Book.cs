namespace SchoolAPI.Entities;

public class Book
{
    public Guid Id { get; set; } // Todo : for Id Should have a function for generate a unique id with specific degit
    public string Title { get; set; }
    public string  Author { get; set; }
    public DateTimeOffset PublishedDate { get; set; }
    public Decimal Price { get; set; }
    public string  ImageUrl { get; set; }
}