using System.ComponentModel.DataAnnotations;

namespace Nexbuy.Models;

public class ProductVariant
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid ProductId { get; set; }

    [Required]
    [MaxLength(100)]
    public string VariantName { get; set; } = string.Empty;

    public decimal PriceAdjustment { get; set; }

    public int Stock { get; set; }

    [MaxLength(50)]
    public string? SKU { get; set; }

    public Product Product { get; set; } = null!;

    public ProductVariant()
    {
        Id = Guid.NewGuid();
        PriceAdjustment = 0;
    }
}
