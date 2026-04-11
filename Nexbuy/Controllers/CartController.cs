using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexbuy.DTOs.Cart;
using Nexbuy.DTOs.Common;
using Nexbuy.Services.Interfaces;

namespace Nexbuy.Controllers;

[ApiController]
[Route("api/v1/cart")]
public class CartController : ControllerBase
{
    private readonly ICartService _cartService;

    public CartController(ICartService cartService)
    {
        _cartService = cartService;
    }

    [AllowAnonymous]
    [HttpGet("")]
    public async Task<ActionResult<ApiResponse<CartDto>>> GetCart()
    {
        var cartId = GetCartId();
        var result = await _cartService.GetCartAsync(cartId);
        return Ok(ApiResponse<CartDto>.Ok(result));
    }

    [AllowAnonymous]
    [HttpPost("items")]
    public async Task<ActionResult<ApiResponse<CartDto>>> AddItem([FromBody] AddToCartRequest request)
    {
        var cartId = GetCartId();
        var result = await _cartService.AddItemAsync(cartId, request);
        return Ok(ApiResponse<CartDto>.Ok(result));
    }

    [AllowAnonymous]
    [HttpPut("items/{id}")]
    public async Task<ActionResult<ApiResponse<CartDto>>> UpdateItem(
        [FromRoute] string id,
        [FromBody] UpdateCartItemRequest request)
    {
        var cartId = GetCartId();
        var result = await _cartService.UpdateItemAsync(cartId, id, request);
        return Ok(ApiResponse<CartDto>.Ok(result));
    }

    [AllowAnonymous]
    [HttpDelete("items/{id}")]
    public async Task<ActionResult<ApiResponse<CartDto>>> RemoveItem([FromRoute] string id)
    {
        var cartId = GetCartId();
        var result = await _cartService.RemoveItemAsync(cartId, id);
        return Ok(ApiResponse<CartDto>.Ok(result));
    }

    [Authorize]
    [HttpPost("merge")]
    public async Task<ActionResult<ApiResponse<CartDto>>> MergeCart([FromBody] MergeCartRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _cartService.MergeCartAsync(userId.ToString(), request);
        return Ok(ApiResponse<CartDto>.Ok(result));
    }

    [AllowAnonymous]
    [HttpPost("coupon")]
    public async Task<ActionResult<ApiResponse<CartDto>>> ApplyCoupon([FromBody] ApplyCouponRequest request)
    {
        var cartId = GetCartId();
        var result = await _cartService.ApplyCouponAsync(cartId, request);
        return Ok(ApiResponse<CartDto>.Ok(result));
    }

    [AllowAnonymous]
    [HttpDelete("coupon")]
    public async Task<ActionResult<ApiResponse<CartDto>>> RemoveCoupon()
    {
        var cartId = GetCartId();
        var result = await _cartService.RemoveCouponAsync(cartId);
        return Ok(ApiResponse<CartDto>.Ok(result));
    }

    private string GetCartId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!string.IsNullOrEmpty(userIdClaim))
            return userIdClaim;

        var headerCartId = Request.Headers["X-Cart-Id"].FirstOrDefault();
        if (!string.IsNullOrEmpty(headerCartId))
            return headerCartId;

        var newCartId = Guid.NewGuid().ToString();
        Response.Headers["X-Cart-Id"] = newCartId;
        return newCartId;
    }
}
