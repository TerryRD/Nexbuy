using Nexbuy.DTOs.Auth;

namespace Nexbuy.Services.Interfaces;

public interface IAuthService
{
    Task<LoginResponse> RegisterAsync(RegisterRequest request);
    Task<LoginResponse> LoginAsync(LoginRequest request);
    Task<LoginResponse> RefreshAsync(RefreshRequest request);
    Task LogoutAsync(Guid userId);
    Task ForgotPasswordAsync(ForgotPasswordRequest request);
    Task ResetPasswordAsync(ResetPasswordRequest request);
    Task<LoginResponse> AdminLoginAsync(AdminLoginRequest request);
}
