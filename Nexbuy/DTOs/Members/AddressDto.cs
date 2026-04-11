namespace Nexbuy.DTOs.Members;

public class AddressDto
{
    public Guid Id { get; set; }
    public string Label { get; set; } = null!;
    public string RecipientName { get; set; } = null!;
    public string Phone { get; set; } = null!;
    public byte AddressType { get; set; }
    public string? ZipCode { get; set; }
    public string? City { get; set; }
    public string? Address { get; set; }
    public string? StoreId { get; set; }
    public string? StoreName { get; set; }
    public bool IsDefault { get; set; }
}
