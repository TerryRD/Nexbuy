namespace Nexbuy.DTOs.Auth;

public class LoginResponse
{
    public string AccessToken { get; set; } = null!;
    public string RefreshToken { get; set; } = null!;
    public DateTime ExpiresAt { get; set; }
    public UserProfile User { get; set; } = null!;

    public class UserProfile
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string? Phone { get; set; }
        public string? PreferredLocale { get; set; }
        public int PointBalance { get; set; }
    }
}
