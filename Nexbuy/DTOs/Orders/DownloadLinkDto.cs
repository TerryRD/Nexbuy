namespace Nexbuy.DTOs.Orders;

public class DownloadLinkDto
{
    public string Token { get; set; } = null!;
    public int DownloadCount { get; set; }
    public int MaxDownloads { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsRevoked { get; set; }
    public string ProductName { get; set; } = null!;
}
