using System.Globalization;
using System.Text;
using CsvHelper;
using CsvHelper.Configuration;
using Microsoft.EntityFrameworkCore;
using Nexbuy.Data;
using Nexbuy.DTOs.Admin;
using Nexbuy.DTOs.Common;
using Nexbuy.DTOs.Members;
using Nexbuy.Helpers;
using Nexbuy.Middleware;
using Nexbuy.Models;
using Nexbuy.Models.Enums;
using Nexbuy.Services.Interfaces;

namespace Nexbuy.Services.Admin;

public class AdminMemberService : IAdminMemberService
{
    private readonly NexbuyDbContext _db;

    public AdminMemberService(NexbuyDbContext db)
    {
        _db = db;
    }

    public async Task<PagedResult<UserProfileDto>> GetMembersAsync(int page, int pageSize, string? search)
    {
        var query = _db.Users.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var keyword = search.Trim();
            query = query.Where(u =>
                u.Email.Contains(keyword) ||
                u.Name.Contains(keyword) ||
                (u.Phone != null && u.Phone.Contains(keyword)));
        }

        var projected = query
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new UserProfileDto
            {
                Id = u.Id,
                Email = u.Email,
                Name = u.Name,
                Phone = u.Phone,
                PreferredLocale = u.PreferredLocale,
                PointBalance = u.PointBalance,
                Status = (byte)u.Status,
                CreatedAt = u.CreatedAt
            });

        return await projected.ToPagedResultAsync(page, pageSize);
    }

    public async Task<UserProfileDto> GetMemberDetailAsync(Guid id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null)
            throw new BusinessException("Member not found.", "MEMBER_NOT_FOUND", 404);

        return new UserProfileDto
        {
            Id = user.Id,
            Email = user.Email,
            Name = user.Name,
            Phone = user.Phone,
            PreferredLocale = user.PreferredLocale,
            PointBalance = user.PointBalance,
            Status = (byte)user.Status,
            CreatedAt = user.CreatedAt
        };
    }

    public async Task UpdateMemberStatusAsync(Guid id, AdminMemberStatusRequest request)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null)
            throw new BusinessException("Member not found.", "MEMBER_NOT_FOUND", 404);

        user.Status = (UserStatus)request.Status;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task AdjustPointsAsync(Guid memberId, AdminPointAdjustRequest request, Guid adminId)
    {
        var user = await _db.Users.FindAsync(memberId);
        if (user == null)
            throw new BusinessException("Member not found.", "MEMBER_NOT_FOUND", 404);

        user.PointBalance += request.Amount;
        if (user.PointBalance < 0)
            throw new BusinessException("Point balance cannot be negative.", "NEGATIVE_POINT_BALANCE");

        user.UpdatedAt = DateTime.UtcNow;

        _db.Points.Add(new Point
        {
            UserId = memberId,
            Type = PointType.Adjust,
            Amount = request.Amount,
            Note = $"[Admin:{adminId}] {request.Note}"
        });

        await _db.SaveChangesAsync();
    }

    public async Task<(byte[] FileBytes, string ContentType, string FileName)> ExportMembersAsync()
    {
        var members = await _db.Users
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new MemberExportRow
            {
                Email = u.Email,
                Name = u.Name,
                Phone = u.Phone ?? "",
                PointBalance = u.PointBalance,
                Status = u.Status.ToString(),
                CreatedAt = u.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss")
            })
            .ToListAsync();

        using var memoryStream = new MemoryStream();
        using (var writer = new StreamWriter(memoryStream, Encoding.UTF8, leaveOpen: true))
        using (var csv = new CsvWriter(writer, new CsvConfiguration(CultureInfo.InvariantCulture)))
        {
            csv.WriteRecords(members);
        }

        memoryStream.Position = 0;
        var fileName = $"Members_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";
        return (memoryStream.ToArray(), "text/csv", fileName);
    }

    private class MemberExportRow
    {
        public string Email { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string Phone { get; set; } = null!;
        public int PointBalance { get; set; }
        public string Status { get; set; } = null!;
        public string CreatedAt { get; set; } = null!;
    }
}
