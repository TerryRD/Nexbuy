namespace Nexbuy.DTOs.Cart;

public class CartDto
{
    public List<CartItemDto> Items { get; set; } = new();
    public decimal SubTotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal Total { get; set; }
    public string? CouponCode { get; set; }
}

public class CartItemDto
{
    public string Id { get; set; } = null!;
    public Guid ProductId { get; set; }
    public Guid? VariantId { get; set; }
    public string ProductName { get; set; } = null!;
    public string? ImageUrl { get; set; }
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal Subtotal { get; set; }
    public int Stock { get; set; }
    public byte Type { get; set; }
}
