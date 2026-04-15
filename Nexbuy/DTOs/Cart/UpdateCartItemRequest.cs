using System.ComponentModel.DataAnnotations;

namespace Nexbuy.DTOs.Cart;

public class UpdateCartItemRequest
{
    [Range(1, 999)]
    public int Quantity { get; set; }
}
