using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Nexbuy.Models;

public class PointRule
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    public decimal EarnRate { get; set; }

    public decimal RedeemRate { get; set; }

    public int PointExpiryMonths { get; set; }

    public DateTime UpdatedAt { get; set; }

    public Guid? UpdatedBy { get; set; }

    public PointRule()
    {
        UpdatedAt = DateTime.UtcNow;
    }
}
