namespace Nexbuy.DTOs.Orders;

public class CreateOrderRequest
{
    public Guid? ShippingAddressId { get; set; }
    public int ShippingMethodId { get; set; }
    public string? RecipientName { get; set; }
    public string? RecipientPhone { get; set; }
    public string? ShippingAddress { get; set; }
    public string? StoreId { get; set; }
    public int PointsToRedeem { get; set; } = 0;
    public string? Note { get; set; }
}
