using System.ComponentModel.DataAnnotations;

namespace Nexbuy.DTOs.Auth;

public class AdminLoginRequest
{
    [Required]
    public string Email { get; set; } = null!;

    [Required]
    public string Password { get; set; } = null!;
}
