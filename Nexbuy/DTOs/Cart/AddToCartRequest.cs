using System.ComponentModel.DataAnnotations;

namespace Nexbuy.DTOs.Cart;

public class AddToCartRequest
{
    [Required]
    public Guid ProductId { get; set; }

    public Guid? VariantId { get; set; }

    [Range(1, 999)]
    public int Quantity { get; set; }
}
