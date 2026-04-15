using System.ComponentModel.DataAnnotations;
using Nexbuy.Models.Enums;

namespace Nexbuy.Models;

public class UserAddress
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid UserId { get; set; }

    [Required]
    [MaxLength(50)]
    public string Label { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string RecipientName { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string Phone { get; set; } = string.Empty;

    public AddressType AddressType { get; set; }

    [MaxLength(10)]
    public string? ZipCode { get; set; }

    [MaxLength(50)]
    public string? City { get; set; }

    [MaxLength(200)]
    public string? Address { get; set; }

    [MaxLength(20)]
    public string? StoreId { get; set; }

    [MaxLength(100)]
    public string? StoreName { get; set; }

    public bool IsDefault { get; set; }

    public User User { get; set; } = null!;

    public UserAddress()
    {
        Id = Guid.NewGuid();
    }
}
