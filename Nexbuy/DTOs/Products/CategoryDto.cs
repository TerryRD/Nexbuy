namespace Nexbuy.DTOs.Products;

public class CategoryDto
{
    public int Id { get; set; }
    public string Slug { get; set; } = null!;
    public int SortOrder { get; set; }
    public string Name { get; set; } = null!;
    public List<CategoryDto> Children { get; set; } = new();
}
