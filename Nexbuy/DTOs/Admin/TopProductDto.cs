namespace Nexbuy.DTOs.Admin;

public class TopProductDto
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = null!;
    public int TotalQuantity { get; set; }
    public decimal TotalRevenue { get; set; }
}
