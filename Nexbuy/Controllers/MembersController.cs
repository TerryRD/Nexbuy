using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexbuy.DTOs.Common;
using Nexbuy.DTOs.Members;
using Nexbuy.Services.Interfaces;

namespace Nexbuy.Controllers;

[ApiController]
[Route("api/v1/members")]
[Authorize]
public class MembersController : ControllerBase
{
    private readonly IMemberService _memberService;

    public MembersController(IMemberService memberService)
    {
        _memberService = memberService;
    }

    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<UserProfileDto>>> GetProfile()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _memberService.GetProfileAsync(userId);
        return Ok(ApiResponse<UserProfileDto>.Ok(result));
    }

    [HttpPut("me")]
    public async Task<ActionResult<ApiResponse>> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _memberService.UpdateProfileAsync(userId, request);
        return Ok(ApiResponse.Ok());
    }

    [HttpGet("me/addresses")]
    public async Task<ActionResult<ApiResponse<List<AddressDto>>>> GetAddresses()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _memberService.GetAddressesAsync(userId);
        return Ok(ApiResponse<List<AddressDto>>.Ok(result));
    }

    [HttpPost("me/addresses")]
    public async Task<ActionResult<ApiResponse<AddressDto>>> CreateAddress([FromBody] CreateAddressRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _memberService.CreateAddressAsync(userId, request);
        return Ok(ApiResponse<AddressDto>.Ok(result));
    }

    [HttpPut("me/addresses/{id:guid}")]
    public async Task<ActionResult<ApiResponse>> UpdateAddress(
        [FromRoute] Guid id,
        [FromBody] UpdateAddressRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _memberService.UpdateAddressAsync(userId, id, request);
        return Ok(ApiResponse.Ok());
    }

    [HttpDelete("me/addresses/{id:guid}")]
    public async Task<ActionResult<ApiResponse>> DeleteAddress([FromRoute] Guid id)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _memberService.DeleteAddressAsync(userId, id);
        return Ok(ApiResponse.Ok());
    }

    [HttpGet("me/points")]
    public async Task<ActionResult<ApiResponse<PagedResult<PointHistoryDto>>>> GetPoints(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _memberService.GetPointsAsync(userId, page, pageSize);
        return Ok(ApiResponse<PagedResult<PointHistoryDto>>.Ok(result));
    }

    [HttpGet("me/wishlist")]
    public async Task<ActionResult<ApiResponse<List<WishlistItemDto>>>> GetWishlist()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _memberService.GetWishlistAsync(userId);
        return Ok(ApiResponse<List<WishlistItemDto>>.Ok(result));
    }

    [HttpPost("me/wishlist/{productId:guid}")]
    public async Task<ActionResult<ApiResponse>> AddToWishlist([FromRoute] Guid productId)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _memberService.AddToWishlistAsync(userId, productId);
        return Ok(ApiResponse.Ok());
    }

    [HttpDelete("me/wishlist/{productId:guid}")]
    public async Task<ActionResult<ApiResponse>> RemoveFromWishlist([FromRoute] Guid productId)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _memberService.RemoveFromWishlistAsync(userId, productId);
        return Ok(ApiResponse.Ok());
    }
}
