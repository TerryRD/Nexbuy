using System.ComponentModel.DataAnnotations;

namespace Nexbuy.Models;

public class Wishlist
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid UserId { get; set; }

    [Required]
    public Guid ProductId { get; set; }

    public DateTime CreatedAt { get; set; }

    public User User { get; set; } = null!;
    public Product Product { get; set; } = null!;

    public Wishlist()
    {
        Id = Guid.NewGuid();
        CreatedAt = DateTime.UtcNow;
    }
}
