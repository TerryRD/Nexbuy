using System.ComponentModel.DataAnnotations;

namespace Nexbuy.Models;

public class ProductImage
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid ProductId { get; set; }

    [Required]
    [MaxLength(500)]
    public string Url { get; set; } = string.Empty;

    public int SortOrder { get; set; }

    public DateTime CreatedAt { get; set; }

    public Product Product { get; set; } = null!;

    public ProductImage()
    {
        Id = Guid.NewGuid();
        SortOrder = 0;
        CreatedAt = DateTime.UtcNow;
    }
}
