using System.ComponentModel.DataAnnotations;

namespace Nexbuy.DTOs.Admin;

public class AdminProductRequest
{
    [Required]
    public string SKU { get; set; } = null!;

    public byte Type { get; set; }

    [Range(0, double.MaxValue)]
    public decimal Price { get; set; }

    public int Stock { get; set; }
    public int? MaxDownloads { get; set; }
    public int? DownloadExpiryHours { get; set; }
    public int? CategoryId { get; set; }
    public byte Status { get; set; }
    public List<TranslationInput> Translations { get; set; } = new();
    public List<VariantInput> Variants { get; set; } = new();
}

public class TranslationInput
{
    [Required]
    public string Locale { get; set; } = null!;

    [Required]
    public string Name { get; set; } = null!;

    public string? Description { get; set; }
}

public class VariantInput
{
    [Required]
    public string VariantName { get; set; } = null!;

    public decimal PriceAdjustment { get; set; }
    public int Stock { get; set; }
    public string? SKU { get; set; }
}
