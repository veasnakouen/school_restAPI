namespace SchoolAPI.Entities;

public class ChatMessage
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Sender { get; set; } = null!;
    public string Receiver { get; set; } = null!;
    public string Message { get; set; } = null!;
    public DateTime Timestamp { get; set; }
    public string? AttachmentUrl { get; set; }
    public string? AttachmentName { get; set; }
}