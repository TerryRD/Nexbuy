namespace Nexbuy.DTOs.Members;

public class WishlistItemDto
{
    public Guid ProductId { get; set; }
    public string Name { get; set; } = null!;
    public decimal Price { get; set; }
    public string? ImageUrl { get; set; }
    public DateTime CreatedAt { get; set; }
}
