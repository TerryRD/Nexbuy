using System.ComponentModel.DataAnnotations;

namespace Nexbuy.DTOs.Auth;

public class ForgotPasswordRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = null!;
}
