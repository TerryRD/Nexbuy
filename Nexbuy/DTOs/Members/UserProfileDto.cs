namespace Nexbuy.DTOs.Members;

public class UserProfileDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string? Phone { get; set; }
    public string? PreferredLocale { get; set; }
    public int PointBalance { get; set; }
    public byte Status { get; set; }
    public DateTime CreatedAt { get; set; }
}
