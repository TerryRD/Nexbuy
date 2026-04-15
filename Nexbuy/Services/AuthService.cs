using System.Collections.Concurrent;
using Microsoft.EntityFrameworkCore;
using Nexbuy.Data;
using Nexbuy.DTOs.Auth;
using Nexbuy.Helpers;
using Nexbuy.Middleware;
using Nexbuy.Models;
using Nexbuy.Models.Enums;
using Nexbuy.Services.Interfaces;

namespace Nexbuy.Services;

public class AuthService : IAuthService
{
    private readonly NexbuyDbContext _db;
    private readonly JwtHelper _jwt;
    private readonly IConfiguration _configuration;

    // In-memory store for password reset tokens: token -> (email, expiry)
    private static readonly ConcurrentDictionary<string, (string Email, DateTime Expiry)> _resetTokens = new();

    public AuthService(NexbuyDbContext db, JwtHelper jwt, IConfiguration configuration)
    {
        _db = db;
        _jwt = jwt;
        _configuration = configuration;
    }

    public async Task<LoginResponse> RegisterAsync(RegisterRequest request)
    {
        var exists = await _db.Users.AnyAsync(u => u.Email == request.Email);
        if (exists)
            throw new BusinessException("Email already registered.", "EMAIL_ALREADY_EXISTS");

        var user = new User
        {
            Email = request.Email,
            PasswordHash = PasswordHelper.Hash(request.Password),
            Name = request.Name,
            Phone = request.Phone,
            PreferredLocale = request.PreferredLocale ?? "zh-TW"
        };

        var accessToken = _jwt.GenerateAccessToken(user.Id, user.Email, "User");
        var refreshToken = _jwt.GenerateRefreshToken();
        var refreshExpiryDays = int.Parse(_configuration["JwtSettings:RefreshTokenExpiryDays"] ?? "7");

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(refreshExpiryDays);

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var expiryMinutes = int.Parse(_configuration["JwtSettings:AccessTokenExpiryMinutes"] ?? "60");

        return new LoginResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes),
            User = new LoginResponse.UserProfile
            {
                Id = user.Id,
                Email = user.Email,
                Name = user.Name,
                Phone = user.Phone,
                PreferredLocale = user.PreferredLocale,
                PointBalance = user.PointBalance
            }
        };
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user == null || !PasswordHelper.Verify(request.Password, user.PasswordHash))
            throw new BusinessException("Invalid email or password.", "INVALID_CREDENTIALS", 401);

        if (user.Status != UserStatus.Active)
            throw new BusinessException("Account is disabled.", "ACCOUNT_DISABLED", 403);

        var accessToken = _jwt.GenerateAccessToken(user.Id, user.Email, "User");
        var refreshToken = _jwt.GenerateRefreshToken();
        var refreshExpiryDays = int.Parse(_configuration["JwtSettings:RefreshTokenExpiryDays"] ?? "7");

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(refreshExpiryDays);
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var expiryMinutes = int.Parse(_configuration["JwtSettings:AccessTokenExpiryMinutes"] ?? "60");

        return new LoginResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes),
            User = new LoginResponse.UserProfile
            {
                Id = user.Id,
                Email = user.Email,
                Name = user.Name,
                Phone = user.Phone,
                PreferredLocale = user.PreferredLocale,
                PointBalance = user.PointBalance
            }
        };
    }

    public async Task<LoginResponse> RefreshAsync(RefreshRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.RefreshToken == request.RefreshToken);
        if (user == null || user.RefreshTokenExpiry == null || user.RefreshTokenExpiry < DateTime.UtcNow)
            throw new BusinessException("Invalid or expired refresh token.", "INVALID_REFRESH_TOKEN", 401);

        var accessToken = _jwt.GenerateAccessToken(user.Id, user.Email, "User");
        var refreshToken = _jwt.GenerateRefreshToken();
        var refreshExpiryDays = int.Parse(_configuration["JwtSettings:RefreshTokenExpiryDays"] ?? "7");

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(refreshExpiryDays);
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var expiryMinutes = int.Parse(_configuration["JwtSettings:AccessTokenExpiryMinutes"] ?? "60");

        return new LoginResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes),
            User = new LoginResponse.UserProfile
            {
                Id = user.Id,
                Email = user.Email,
                Name = user.Name,
                Phone = user.Phone,
                PreferredLocale = user.PreferredLocale,
                PointBalance = user.PointBalance
            }
        };
    }

    public async Task LogoutAsync(Guid userId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null)
            throw new BusinessException("User not found.", "USER_NOT_FOUND", 404);

        user.RefreshToken = null;
        user.RefreshTokenExpiry = null;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task ForgotPasswordAsync(ForgotPasswordRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user == null)
        {
            // Return silently to avoid email enumeration
            return;
        }

        var token = Guid.NewGuid().ToString("N");
        _resetTokens[token] = (user.Email, DateTime.UtcNow.AddHours(1));

        // In a real app, send email. For now, log it.
        Console.WriteLine($"[ForgotPassword] Reset token for {user.Email}: {token}");
    }

    public async Task ResetPasswordAsync(ResetPasswordRequest request)
    {
        if (!_resetTokens.TryRemove(request.Token, out var entry))
            throw new BusinessException("Invalid or expired reset token.", "INVALID_RESET_TOKEN");

        if (entry.Expiry < DateTime.UtcNow)
            throw new BusinessException("Reset token has expired.", "EXPIRED_RESET_TOKEN");

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == entry.Email);
        if (user == null)
            throw new BusinessException("User not found.", "USER_NOT_FOUND", 404);

        user.PasswordHash = PasswordHelper.Hash(request.NewPassword);
        user.RefreshToken = null;
        user.RefreshTokenExpiry = null;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task<LoginResponse> AdminLoginAsync(AdminLoginRequest request)
    {
        var admin = await _db.Admins.FirstOrDefaultAsync(a => a.Email == request.Email);
        if (admin == null || !PasswordHelper.Verify(request.Password, admin.PasswordHash))
            throw new BusinessException("Invalid email or password.", "INVALID_CREDENTIALS", 401);

        if (admin.Status != UserStatus.Active)
            throw new BusinessException("Account is disabled.", "ACCOUNT_DISABLED", 403);

        var role = admin.Role == AdminRole.SuperAdmin ? "SuperAdmin" : "Admin";
        var accessToken = _jwt.GenerateAccessToken(admin.Id, admin.Email, role);
        var refreshToken = _jwt.GenerateRefreshToken();
        var refreshExpiryDays = int.Parse(_configuration["JwtSettings:RefreshTokenExpiryDays"] ?? "7");

        admin.RefreshToken = refreshToken;
        admin.RefreshTokenExpiry = DateTime.UtcNow.AddDays(refreshExpiryDays);
        admin.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var expiryMinutes = int.Parse(_configuration["JwtSettings:AccessTokenExpiryMinutes"] ?? "60");

        return new LoginResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes),
            User = new LoginResponse.UserProfile
            {
                Id = admin.Id,
                Email = admin.Email,
                Name = admin.Name,
                Phone = null,
                PreferredLocale = null,
                PointBalance = 0
            }
        };
    }
}
