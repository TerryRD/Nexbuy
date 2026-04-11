using System.ComponentModel.DataAnnotations;
using Nexbuy.Models.Enums;

namespace Nexbuy.Models;

public class User
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(512)]
    public string PasswordHash { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Phone { get; set; }

    public int PointBalance { get; set; }

    [Required]
    [MaxLength(10)]
    public string PreferredLocale { get; set; } = "zh-TW";

    public UserStatus Status { get; set; }

    [MaxLength(512)]
    public string? RefreshToken { get; set; }

    public DateTime? RefreshTokenExpiry { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public ICollection<UserAddress> Addresses { get; set; }
    public ICollection<Order> Orders { get; set; }
    public ICollection<Point> Points { get; set; }
    public ICollection<Wishlist> Wishlists { get; set; }
    public ICollection<DigitalDownload> DigitalDownloads { get; set; }

    public User()
    {
        Id = Guid.NewGuid();
        PointBalance = 0;
        Status = UserStatus.Active;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
        Addresses = new List<UserAddress>();
        Orders = new List<Order>();
        Points = new List<Point>();
        Wishlists = new List<Wishlist>();
        DigitalDownloads = new List<DigitalDownload>();
    }
}
