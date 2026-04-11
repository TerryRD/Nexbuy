using System.ComponentModel.DataAnnotations;

namespace Nexbuy.DTOs.Admin;

public class AdminTrackingRequest
{
    [Required]
    public string TrackingNo { get; set; } = null!;
}
