namespace Nexbuy.DTOs.Orders;

public class OrderListRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public byte? Status { get; set; }
}
