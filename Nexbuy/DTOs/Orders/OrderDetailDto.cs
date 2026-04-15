namespace Nexbuy.DTOs.Orders;

public class OrderDetailDto
{
    public string OrderNo { get; set; } = null!;
    public byte Status { get; set; }
    public string? PaymentMethod { get; set; }
    public byte PaymentStatus { get; set; }
    public string? ShippingMethod { get; set; }
    public decimal ShippingFee { get; set; }
    public decimal SubTotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal PointDiscount { get; set; }
    public decimal TotalAmount { get; set; }
    public string? RecipientName { get; set; }
    public string? RecipientPhone { get; set; }
    public string? ShippingAddress { get; set; }
    public string? StoreId { get; set; }
    public string? TrackingNo { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<OrderItemDto> Items { get; set; } = new();
}

public class OrderItemDto
{
    public Guid ProductId { get; set; }
    public Guid? VariantId { get; set; }
    public string ProductName { get; set; } = null!;
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal Subtotal { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsDigital { get; set; }
}
