using System.ComponentModel.DataAnnotations;
using Nexbuy.Models.Enums;

namespace Nexbuy.Models;

public class Admin
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(512)]
    public string PasswordHash { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public AdminRole Role { get; set; }

    public UserStatus Status { get; set; }

    [MaxLength(512)]
    public string? RefreshToken { get; set; }

    public DateTime? RefreshTokenExpiry { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public Admin()
    {
        Id = Guid.NewGuid();
        Status = UserStatus.Active;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }
}
