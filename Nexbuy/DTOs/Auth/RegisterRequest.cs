using System.ComponentModel.DataAnnotations;

namespace Nexbuy.DTOs.Auth;

public class RegisterRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = null!;

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = null!;

    [Required]
    public string Name { get; set; } = null!;

    public string? Phone { get; set; }

    public string? PreferredLocale { get; set; }
}
