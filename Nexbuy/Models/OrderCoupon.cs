using System.ComponentModel.DataAnnotations;

namespace Nexbuy.Models;

public class OrderCoupon
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid OrderId { get; set; }

    [Required]
    public int CouponId { get; set; }

    public decimal DiscountAmount { get; set; }

    public Order Order { get; set; } = null!;
    public Coupon Coupon { get; set; } = null!;

    public OrderCoupon()
    {
        Id = Guid.NewGuid();
    }
}
