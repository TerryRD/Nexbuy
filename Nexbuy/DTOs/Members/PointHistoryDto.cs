namespace Nexbuy.DTOs.Members;

public class PointHistoryDto
{
    public Guid Id { get; set; }
    public byte Type { get; set; }
    public int Amount { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? OrderNo { get; set; }
}
