namespace Nexbuy.DTOs.Products;

public class ProductListItemDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public decimal Price { get; set; }
    public string? ImageUrl { get; set; }
    public byte Type { get; set; }
    public int Stock { get; set; }
    public string? CategorySlug { get; set; }
}
