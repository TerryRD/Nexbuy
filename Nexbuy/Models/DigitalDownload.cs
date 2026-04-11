using System.ComponentModel.DataAnnotations;

namespace Nexbuy.Models;

public class DigitalDownload
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid OrderItemId { get; set; }

    [Required]
    public Guid UserId { get; set; }

    [Required]
    [MaxLength(256)]
    public string Token { get; set; } = string.Empty;

    public int DownloadCount { get; set; }

    public int MaxDownloads { get; set; }

    public DateTime ExpiresAt { get; set; }

    public bool IsRevoked { get; set; }

    public OrderItem OrderItem { get; set; } = null!;
    public User User { get; set; } = null!;

    public DigitalDownload()
    {
        Id = Guid.NewGuid();
        Token = Guid.NewGuid().ToString("N");
        DownloadCount = 0;
        IsRevoked = false;
    }
}
