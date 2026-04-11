namespace Nexbuy.DTOs.Products;

public class ProductDetailDto
{
    public Guid Id { get; set; }
    public string SKU { get; set; } = null!;
    public byte Type { get; set; }
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public int? MaxDownloads { get; set; }
    public int? DownloadExpiryHours { get; set; }
    public byte Status { get; set; }
    public int? CategoryId { get; set; }
    public List<TranslationDto> Translations { get; set; } = new();
    public List<ImageDto> Images { get; set; } = new();
    public List<VariantDto> Variants { get; set; } = new();
}

public class TranslationDto
{
    public string Locale { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
}

public class ImageDto
{
    public Guid Id { get; set; }
    public string Url { get; set; } = null!;
    public int SortOrder { get; set; }
}

public class VariantDto
{
    public Guid Id { get; set; }
    public string VariantName { get; set; } = null!;
    public decimal PriceAdjustment { get; set; }
    public int Stock { get; set; }
    public string? SKU { get; set; }
}
