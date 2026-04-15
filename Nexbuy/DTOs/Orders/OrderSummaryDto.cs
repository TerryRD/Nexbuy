namespace Nexbuy.DTOs.Orders;

public class OrderSummaryDto
{
    public string OrderNo { get; set; } = null!;
    public byte Status { get; set; }
    public byte PaymentStatus { get; set; }
    public decimal TotalAmount { get; set; }
    public DateTime CreatedAt { get; set; }
    public int ItemCount { get; set; }
}
