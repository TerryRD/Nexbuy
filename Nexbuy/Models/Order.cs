using System.ComponentModel.DataAnnotations;
using Nexbuy.Models.Enums;

namespace Nexbuy.Models;

public class Order
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(30)]
    public string OrderNo { get; set; } = string.Empty;

    [Required]
    public Guid UserId { get; set; }

    public OrderStatus Status { get; set; }

    public PaymentMethod PaymentMethod { get; set; }

    public PaymentStatus PaymentStatus { get; set; }

    public ShippingMethodType ShippingMethod { get; set; }

    public decimal ShippingFee { get; set; }

    public decimal SubTotal { get; set; }

    public decimal DiscountAmount { get; set; }

    public decimal PointDiscount { get; set; }

    public decimal TotalAmount { get; set; }

    [Required]
    [MaxLength(100)]
    public string RecipientName { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string RecipientPhone { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? ShippingAddress { get; set; }

    [MaxLength(20)]
    public string? StoreId { get; set; }

    [MaxLength(50)]
    public string? TrackingNo { get; set; }

    [MaxLength(500)]
    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public User User { get; set; } = null!;
    public ICollection<OrderItem> Items { get; set; }
    public ICollection<OrderCoupon> OrderCoupons { get; set; }

    public Order()
    {
        Id = Guid.NewGuid();
        Status = OrderStatus.Pending;
        PaymentStatus = PaymentStatus.Unpaid;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
        Items = new List<OrderItem>();
        OrderCoupons = new List<OrderCoupon>();
    }
}
