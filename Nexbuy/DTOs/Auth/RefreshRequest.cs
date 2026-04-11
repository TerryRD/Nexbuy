using System.ComponentModel.DataAnnotations;

namespace Nexbuy.DTOs.Auth;

public class RefreshRequest
{
    [Required]
    public string RefreshToken { get; set; } = null!;
}
