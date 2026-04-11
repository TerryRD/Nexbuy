namespace Nexbuy.DTOs.Cart;

public class MergeCartRequest
{
    public List<MergeCartItem> Items { get; set; } = new();
}

public class MergeCartItem
{
    public Guid ProductId { get; set; }
    public Guid? VariantId { get; set; }
    public int Quantity { get; set; }
}
