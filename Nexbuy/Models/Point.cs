using System.ComponentModel.DataAnnotations;
using Nexbuy.Models.Enums;

namespace Nexbuy.Models;

public class Point
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid UserId { get; set; }

    public Guid? OrderId { get; set; }

    public PointType Type { get; set; }

    public int Amount { get; set; }

    public DateTime? ExpiresAt { get; set; }

    [MaxLength(500)]
    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; }

    public User User { get; set; } = null!;
    public Order? Order { get; set; }

    public Point()
    {
        Id = Guid.NewGuid();
        CreatedAt = DateTime.UtcNow;
    }
}
