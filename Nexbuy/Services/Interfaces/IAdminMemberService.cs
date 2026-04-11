using Nexbuy.DTOs.Admin;
using Nexbuy.DTOs.Common;
using Nexbuy.DTOs.Members;

namespace Nexbuy.Services.Interfaces;

public interface IAdminMemberService
{
    Task<PagedResult<UserProfileDto>> GetMembersAsync(int page, int pageSize, string? search);
    Task<UserProfileDto> GetMemberDetailAsync(Guid id);
    Task UpdateMemberStatusAsync(Guid id, AdminMemberStatusRequest request);
    Task AdjustPointsAsync(Guid memberId, AdminPointAdjustRequest request, Guid adminId);
    Task<(byte[] FileBytes, string ContentType, string FileName)> ExportMembersAsync();
}
