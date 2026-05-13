namespace SchoolAPI.Entities;

public enum TransferStatus
{
    Pending = 1,
    InTransit = 2,
    Acknowledged = 3,  // receiver confirmed
    Cancelled = 4
}