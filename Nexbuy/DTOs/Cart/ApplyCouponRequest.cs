using System.ComponentModel.DataAnnotations;

namespace Nexbuy.DTOs.Cart;

public class ApplyCouponRequest
{
    [Required]
    public string Code { get; set; } = null!;
}
