using System.ComponentModel.DataAnnotations;

namespace Nexbuy.DTOs.Admin;

public class AdminCouponRequest
{
    [Required]
    public string Code { get; set; } = null!;

    public byte Type { get; set; }

    [Range(0, double.MaxValue)]
    public decimal Value { get; set; }

    public decimal? MinOrderAmount { get; set; }
    public int? UsageLimit { get; set; }
    public DateTime? StartAt { get; set; }
    public DateTime? ExpiredAt { get; set; }
    public byte Status { get; set; }
}
