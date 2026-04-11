using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexbuy.DTOs.Admin;
using Nexbuy.DTOs.Common;
using Nexbuy.DTOs.Members;
using Nexbuy.Services.Interfaces;

namespace Nexbuy.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/members")]
[Authorize(Roles = "Admin,SuperAdmin")]
public class AdminMembersController : ControllerBase
{
    private readonly IAdminMemberService _adminMemberService;

    public AdminMembersController(IAdminMemberService adminMemberService)
    {
        _adminMemberService = adminMemberService;
    }

    [HttpGet("")]
    public async Task<ActionResult<ApiResponse<PagedResult<UserProfileDto>>>> GetMembers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null)
    {
        var result = await _adminMemberService.GetMembersAsync(page, pageSize, search);
        return Ok(ApiResponse<PagedResult<UserProfileDto>>.Ok(result));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<UserProfileDto>>> GetMemberDetail([FromRoute] Guid id)
    {
        var result = await _adminMemberService.GetMemberDetailAsync(id);
        return Ok(ApiResponse<UserProfileDto>.Ok(result));
    }

    [HttpPut("{id:guid}/status")]
    public async Task<ActionResult<ApiResponse>> UpdateMemberStatus(
        [FromRoute] Guid id,
        [FromBody] AdminMemberStatusRequest request)
    {
        await _adminMemberService.UpdateMemberStatusAsync(id, request);
        return Ok(ApiResponse.Ok());
    }

    [HttpPost("{id:guid}/points")]
    public async Task<ActionResult<ApiResponse>> AdjustPoints(
        [FromRoute] Guid id,
        [FromBody] AdminPointAdjustRequest request)
    {
        var adminId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _adminMemberService.AdjustPointsAsync(id, request, adminId);
        return Ok(ApiResponse.Ok());
    }

    [HttpGet("export")]
    public async Task<IActionResult> ExportMembers()
    {
        var (fileBytes, contentType, fileName) = await _adminMemberService.ExportMembersAsync();
        return File(fileBytes, contentType, fileName);
    }
}
