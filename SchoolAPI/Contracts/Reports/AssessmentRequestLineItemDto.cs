namespace SchoolAPI.Contracts.Reports;

public sealed class AssessmentRequestLineItemDto
{
    public string Description { get; set; } = string.Empty;
    public int Quantity { get; set; } = 1;
    public decimal Price { get; set; }
    public decimal Total => Quantity * Price;
}