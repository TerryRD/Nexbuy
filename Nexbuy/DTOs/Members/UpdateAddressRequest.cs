using System.ComponentModel.DataAnnotations;

namespace Nexbuy.DTOs.Members;

public class UpdateAddressRequest
{
    [Required]
    public string Label { get; set; } = null!;

    [Required]
    public string RecipientName { get; set; } = null!;

    [Required]
    public string Phone { get; set; } = null!;

    public byte AddressType { get; set; }
    public string? ZipCode { get; set; }
    public string? City { get; set; }
    public string? Address { get; set; }
    public string? StoreId { get; set; }
    public string? StoreName { get; set; }
    public bool IsDefault { get; set; }
}
