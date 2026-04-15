using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Nexbuy.Models.Enums;

namespace Nexbuy.Models;

public class ShippingMethod
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public ShippingMethodType Type { get; set; }

    public decimal BaseFee { get; set; }

    public decimal? FreeShippingThreshold { get; set; }

    public bool IsActive { get; set; }

    public ShippingMethod()
    {
        IsActive = true;
    }
}
