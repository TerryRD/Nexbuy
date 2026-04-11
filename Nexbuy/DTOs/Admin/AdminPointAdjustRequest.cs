using System.ComponentModel.DataAnnotations;

namespace Nexbuy.DTOs.Admin;

public class AdminPointAdjustRequest
{
    public int Amount { get; set; }

    [Required]
    public string Note { get; set; } = null!;
}
