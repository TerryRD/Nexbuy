using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Nexbuy.Models.Enums;

namespace Nexbuy.Models;

public class Coupon
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Code { get; set; } = string.Empty;

    public CouponType Type { get; set; }

    public decimal Value { get; set; }

    public decimal MinOrderAmount { get; set; }

    public int? UsageLimit { get; set; }

    public int UsedCount { get; set; }

    public DateTime StartAt { get; set; }

    public DateTime ExpiredAt { get; set; }

    public CouponStatus Status { get; set; }

    public ICollection<OrderCoupon> OrderCoupons { get; set; }

    public Coupon()
    {
        UsedCount = 0;
        Status = CouponStatus.Active;
        OrderCoupons = new List<OrderCoupon>();
    }
}
