namespace Nexbuy.DTOs.Products;

public class ProductListRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Sort { get; set; }
    public int? CategoryId { get; set; }
    public string? Search { get; set; }
    public string Lang { get; set; } = "zh-TW";
}
