using System.ComponentModel.DataAnnotations;
using Nexbuy.Models.Enums;

namespace Nexbuy.Models;

public class Product
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public int CategoryId { get; set; }

    [Required]
    [MaxLength(50)]
    public string SKU { get; set; } = string.Empty;

    public ProductType Type { get; set; }

    public decimal Price { get; set; }

    public int Stock { get; set; }

    public int? MaxDownloads { get; set; }

    public int? DownloadExpiryHours { get; set; }

    public ProductStatus Status { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public Category Category { get; set; } = null!;
    public ICollection<ProductTranslation> Translations { get; set; }
    public ICollection<ProductImage> Images { get; set; }
    public ICollection<ProductVariant> Variants { get; set; }
    public ICollection<Wishlist> Wishlists { get; set; }

    public Product()
    {
        Id = Guid.NewGuid();
        Status = ProductStatus.Active;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
        Translations = new List<ProductTranslation>();
        Images = new List<ProductImage>();
        Variants = new List<ProductVariant>();
        Wishlists = new List<Wishlist>();
    }
}
