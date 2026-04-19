using System;

namespace SchoolAPI.Contracts;

public class PersonDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Department { get; set; }
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public bool IsActive { get; set; }
}